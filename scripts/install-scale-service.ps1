param(
  [string]$ServiceName = "LAB-ScaleBridge",
  [string]$NodePath = "C:\\Program Files\\nodejs\\node.exe",
  [string]$RepoPath = (Resolve-Path "..").Path,
  [string]$ComPort = "COM3",
  [int]$Baud = 9600,
  [int]$SiMs = 500,
  [string]$PollCmds = "P",
  [int]$Continuous = 0
)

function Assert-InPath($exe){ if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { Write-Error "'$exe' not found in PATH"; exit 1 } }

Assert-InPath "nssm"

$Bridge = Join-Path $RepoPath "scripts/ja5003_ws_bridge.js"
if (-not (Test-Path $Bridge)) { Write-Error "Bridge not found: $Bridge"; exit 1 }

Write-Host "Installing service $ServiceName..."
nssm install $ServiceName $NodePath $Bridge

Write-Host "Setting environment..."
nssm set $ServiceName AppEnvironmentExtra "JA_FORCE_OPEN=1;JA_PORT=$ComPort;JA_BAUD=$Baud;JA_CONTINUOUS=$Continuous;JA_POLL_CMDS=$PollCmds;JA_SI_MS=$SiMs"

Write-Host "Setting delayed automatic start..."
nssm set $ServiceName Start SERVICE_DELAYED_AUTO_START

Write-Host "Starting service..."
nssm start $ServiceName

Write-Host "Done."


