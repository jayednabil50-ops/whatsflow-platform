param(
  [string]$WorkspaceRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "SilentlyContinue"

$outputDir = Join-Path $WorkspaceRoot "output"
$supervisorPidFile = Join-Path $outputDir "whatsflow-supervisor.pid"
$appPidFile = Join-Path $outputDir "app-server.pid"
$workerPidFile = Join-Path $outputDir "worker.pid"
$tunnelPidFile = Join-Path $outputDir "cloudflared.pid"

function Stop-FromPidFile {
  param([string]$PidFile)

  if (-not (Test-Path -LiteralPath $PidFile)) {
    return
  }

  $pidValue = Get-Content -LiteralPath $PidFile | Select-Object -First 1
  if ($pidValue) {
    $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
    if ($process) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
  }

  Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
}

Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq "powershell.exe" -and
    $_.CommandLine -like "*watch-whatsflow.ps1*"
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }

Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq "cmd.exe" -and
    (
      $_.CommandLine -like "*npm.cmd start*" -or
      $_.CommandLine -like "*npm.cmd run worker:start*" -or
      $_.CommandLine -like "*cloudflared.exe tunnel*" -or
      $_.CommandLine -like "*next start*"
    )
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }

Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -eq "node.exe" -and $_.CommandLine -like "*next*dist*bin*next*start*") -or
    ($_.Name -eq "node.exe" -and $_.CommandLine -like "*tsx*whatsapp-worker.ts*") -or
    ($_.Name -eq "cloudflared.exe" -and $_.CommandLine -like "*tunnel --url http://localhost*")
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }

Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
  Where-Object { $_.OwningProcess -gt 0 } |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object {
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
  }

Get-NetTCPConnection -LocalPort 3101 -ErrorAction SilentlyContinue |
  Where-Object { $_.OwningProcess -gt 0 } |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object {
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
  }

Stop-FromPidFile -PidFile $supervisorPidFile
Stop-FromPidFile -PidFile $appPidFile
Stop-FromPidFile -PidFile $workerPidFile
Stop-FromPidFile -PidFile $tunnelPidFile

Write-Output "WhatsFlow supervisor stopped."
