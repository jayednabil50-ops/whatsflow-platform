param(
  [string]$WorkspaceRoot = (Split-Path -Parent $PSScriptRoot),
  [int]$Port = 3000,
  [int]$WorkerPort = 3101,
  [int]$CheckIntervalSeconds = 10
)

$ErrorActionPreference = "Stop"

$outputDir = Join-Path $WorkspaceRoot "output"
$appPidFile = Join-Path $outputDir "app-server.pid"
$workerPidFile = Join-Path $outputDir "worker.pid"
$tunnelPidFile = Join-Path $outputDir "cloudflared.pid"
$supervisorLog = Join-Path $outputDir "supervisor.log"
$liveUrlFile = Join-Path $outputDir "live-url.txt"
$cloudflaredExe = Join-Path $outputDir "cloudflared.exe"

function Ensure-OutputDir {
  if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
  }
}

function Write-SupervisorLog {
  param([string]$Message)

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  [System.IO.File]::AppendAllText(
    $supervisorLog,
    "$timestamp $Message`r`n",
    [System.Text.Encoding]::UTF8
  )
}

function Read-Pid {
  param([string]$PidFile)

  if (-not (Test-Path -LiteralPath $PidFile)) {
    return $null
  }

  $raw = (Get-Content -LiteralPath $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
  if (-not $raw) {
    return $null
  }

  $value = 0
  if ([int]::TryParse($raw.Trim(), [ref]$value)) {
    return $value
  }

  return $null
}

function Save-Pid {
  param(
    [string]$PidFile,
    [int]$PidValue
  )

  Set-Content -LiteralPath $PidFile -Value $PidValue -Encoding ascii
}

function Remove-PidFile {
  param([string]$PidFile)

  if (Test-Path -LiteralPath $PidFile) {
    Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
  }
}

function Get-ManagedProcess {
  param([string]$PidFile)

  $pidValue = Read-Pid -PidFile $PidFile
  if (-not $pidValue) {
    return $null
  }

  return Get-Process -Id $pidValue -ErrorAction SilentlyContinue
}

function Test-PortListening {
  param([int]$PortNumber)

  return [bool](Get-NetTCPConnection -LocalPort $PortNumber -State Listen -ErrorAction SilentlyContinue)
}

function Get-PortOwnerPid {
  param([int]$PortNumber)

  return Get-NetTCPConnection -LocalPort $PortNumber -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -First 1
}

function Stop-ManagedProcess {
  param([string]$PidFile)

  $process = Get-ManagedProcess -PidFile $PidFile
  if ($process) {
    try {
      Stop-Process -Id $process.Id -Force -ErrorAction Stop
      Write-SupervisorLog "Stopped process $($process.Id) from $(Split-Path $PidFile -Leaf)."
    } catch {
      Write-SupervisorLog "Failed to stop process from $(Split-Path $PidFile -Leaf): $($_.Exception.Message)"
    }
  }

  Remove-PidFile -PidFile $PidFile
}

function Start-AppServer {
  $process = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList "start" `
    -WorkingDirectory $WorkspaceRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $outputDir "app-server.out.log") `
    -RedirectStandardError (Join-Path $outputDir "app-server.err.log") `
    -PassThru
  Save-Pid -PidFile $appPidFile -PidValue $process.Id
  Write-SupervisorLog "Started app server supervisor process $($process.Id)."
}

function Start-Worker {
  $process = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList "run", "worker:start" `
    -WorkingDirectory $WorkspaceRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $outputDir "worker.out.log") `
    -RedirectStandardError (Join-Path $outputDir "worker.err.log") `
    -PassThru
  Save-Pid -PidFile $workerPidFile -PidValue $process.Id
  Write-SupervisorLog "Started WhatsApp worker process $($process.Id)."
}

function Start-Tunnel {
  if (-not (Test-Path -LiteralPath $cloudflaredExe)) {
    throw "cloudflared.exe was not found at $cloudflaredExe"
  }

  $process = Start-Process `
    -FilePath $cloudflaredExe `
    -ArgumentList "tunnel", "--url", "http://localhost:$Port", "--logfile", (Join-Path $outputDir "cloudflared-tunnel.log"), "--loglevel", "info" `
    -WorkingDirectory $WorkspaceRoot `
    -WindowStyle Hidden `
    -PassThru
  Save-Pid -PidFile $tunnelPidFile -PidValue $process.Id
  Write-SupervisorLog "Started Cloudflare tunnel process $($process.Id)."
}

function Update-LiveUrlFile {
  $logPath = Join-Path $outputDir "cloudflared-tunnel.log"
  if (-not (Test-Path -LiteralPath $logPath)) {
    return
  }

  $matches = Select-String -Path $logPath -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -AllMatches -ErrorAction SilentlyContinue
  if (-not $matches) {
    return
  }

  $lastUrl = $null
  foreach ($entry in $matches) {
    foreach ($match in $entry.Matches) {
      $lastUrl = $match.Value
    }
  }

  if ($lastUrl) {
    Set-Content -LiteralPath $liveUrlFile -Value $lastUrl -Encoding ascii
  }
}

Ensure-OutputDir
Set-Location -LiteralPath $WorkspaceRoot
Write-SupervisorLog "Watchdog started."

while ($true) {
  try {
    $appProcess = Get-ManagedProcess -PidFile $appPidFile
    $portListening = Test-PortListening -PortNumber $Port
    $portOwnerPid = Get-PortOwnerPid -PortNumber $Port

    if ($appProcess -and -not $portListening) {
      Write-SupervisorLog "App supervisor process exists but port $Port is down. Restarting app server."
      Stop-ManagedProcess -PidFile $appPidFile
      Start-Sleep -Seconds 2
      Start-AppServer
      Start-Sleep -Seconds 8
    } elseif (-not $appProcess -and -not $portListening) {
      Write-SupervisorLog "App server is down. Starting it again."
      Start-AppServer
      Start-Sleep -Seconds 8
    } elseif (-not $appProcess -and $portListening -and $portOwnerPid) {
      Save-Pid -PidFile $appPidFile -PidValue $portOwnerPid
      Write-SupervisorLog "Adopted existing app server process $portOwnerPid on port $Port."
    }

    $workerProcess = Get-ManagedProcess -PidFile $workerPidFile
    $workerPortListening = Test-PortListening -PortNumber $WorkerPort
    $workerPortOwnerPid = Get-PortOwnerPid -PortNumber $WorkerPort

    if ($workerProcess -and -not $workerPortListening) {
      Write-SupervisorLog "WhatsApp worker process exists but port $WorkerPort is down. Restarting worker."
      Stop-ManagedProcess -PidFile $workerPidFile
      Start-Sleep -Seconds 2
      Start-Worker
      Start-Sleep -Seconds 5
    } elseif (-not $workerProcess -and -not $workerPortListening) {
      Write-SupervisorLog "WhatsApp worker is down. Starting it again."
      Start-Worker
      Start-Sleep -Seconds 5
    } elseif (-not $workerProcess -and $workerPortListening -and $workerPortOwnerPid) {
      Save-Pid -PidFile $workerPidFile -PidValue $workerPortOwnerPid
      Write-SupervisorLog "Adopted existing WhatsApp worker process $workerPortOwnerPid on port $WorkerPort."
    }

    $tunnelProcess = Get-ManagedProcess -PidFile $tunnelPidFile
    if (-not $tunnelProcess) {
      Write-SupervisorLog "Cloudflare tunnel is down. Starting it again."
      Start-Tunnel
      Start-Sleep -Seconds 8
    }

    Update-LiveUrlFile
  } catch {
    Write-SupervisorLog "Watchdog error: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds $CheckIntervalSeconds
}
