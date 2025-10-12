Param(
  [string]$Com = "COM3",
  [int]$Baud = 9600,
  [int]$Ms = 250
)
$ErrorActionPreference = "Stop"
$env:JA_FORCE_OPEN = '1'
$env:JA_PORT        = $Com
$env:JA_BAUD        = [string]$Baud
$env:JA_CONTINUOUS  = '0'      # device is in Prt Soft; we poll
$env:JA_POLL_CMDS   = 'P'      # Print command
$env:JA_SI_MS       = [string]$Ms
npm run scale:bridge
