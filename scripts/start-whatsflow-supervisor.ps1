param(
  [string]$WorkspaceRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$outputDir = Join-Path $WorkspaceRoot "output"
$supervisorPidFile = Join-Path $outputDir "whatsflow-supervisor.pid"
$watchScript = Join-Path $PSScriptRoot "watch-whatsflow.ps1"
$liveUrlFile = Join-Path $outputDir "live-url.txt"

if (-not (Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

if (Test-Path -LiteralPath $supervisorPidFile) {
  $existingPid = Get-Content -LiteralPath $supervisorPidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($existingPid) {
    $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($existingProcess) {
      Write-Output "Supervisor already running with PID $existingPid."
      if (Test-Path -LiteralPath $liveUrlFile) {
        Write-Output (Get-Content -LiteralPath $liveUrlFile -ErrorAction SilentlyContinue | Select-Object -First 1)
      }
      exit 0
    }
  }
}

$command = "cd /d `"$WorkspaceRoot`" && powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File `"$watchScript`" -WorkspaceRoot `"$WorkspaceRoot`" 1>> output\\supervisor.out.log 2>> output\\supervisor.err.log"
$process = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/d", "/c", $command `
  -WindowStyle Hidden `
  -PassThru

Set-Content -LiteralPath $supervisorPidFile -Value $process.Id -Encoding ascii

Start-Sleep -Seconds 2
$startedProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue

if (-not $startedProcess) {
  throw "The WhatsFlow watchdog could not be started."
}

Start-Sleep -Seconds 15

Write-Output "Supervisor started with PID $($process.Id)."
if (Test-Path -LiteralPath $liveUrlFile) {
  Write-Output (Get-Content -LiteralPath $liveUrlFile -ErrorAction SilentlyContinue | Select-Object -First 1)
}
