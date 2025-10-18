# Scale Bridge Windows Service Installation Guide

This guide explains how to install the JA5003 WebSocket Bridge as a Windows Service using NSSM (Non-Sucking Service Manager), so the bridge runs automatically on system startup and continues running even when the browser is closed.

## Prerequisites

1. **Node.js** installed (v18+ recommended)
2. **NSSM** (Non-Sucking Service Manager)
3. **Admin rights** on the Windows PC

## Step 1: Download NSSM

1. Download NSSM from: https://nssm.cc/download
2. Extract the ZIP file
3. Copy `nssm.exe` (from `win64` or `win32` folder) to a permanent location, e.g.:
   ```
   C:\Program Files\nssm\nssm.exe
   ```
4. Add NSSM to your system PATH (optional but recommended):
   - Open System Properties → Environment Variables
   - Edit `Path` under System variables
   - Add: `C:\Program Files\nssm`

## Step 2: Install the Service via Command Line

Open PowerShell **as Administrator** and navigate to your Lab project directory:

```powershell
cd C:\Users\spn\Documents\GitHub\Lab

# Install the service
nssm install JA5003Bridge
```

This opens the NSSM GUI installer. Configure as follows:

### Application Tab:
- **Path:** `C:\Program Files\nodejs\node.exe` (or wherever Node.js is installed)
- **Startup directory:** `C:\Users\spn\Documents\GitHub\Lab` (your project path)
- **Arguments:** `scripts\bridge-runner.mjs`

### Details Tab (optional):
- **Display name:** JA5003 Scale Bridge
- **Description:** WebSocket bridge for JA5003 precision scale (auto-restart on failure)
- **Startup type:** Automatic

### Environment Tab:
Add these environment variables (click "Add" for each):
```
JA_FORCE_OPEN=1
JA_PORT=AUTO
JA_BAUD=9600
JA_CONTINUOUS=1
JA_POLL_CMDS=
JA_SI_MS=500
JA_WS_PORT=8787
JA_WS_HOST=127.0.0.1
```

**Important Environment Variables:**
- `JA_PORT=AUTO` - Automatically detects serial port (recommended)
- `JA_PORT=COM3` - Use specific COM port (if you know it)
- `JA_BAUD=9600` - Baud rate for JA5003 (usually 9600)
- `JA_CONTINUOUS=1` - Enable continuous weight streaming
- `JA_SI_MS=500` - Polling interval in milliseconds
- `JA_WS_PORT=8787` - WebSocket port (must match app config)

### I/O Tab (optional but recommended):
- **Output (stdout):** `C:\Users\spn\Documents\GitHub\Lab\logs\bridge-stdout.log`
- **Error (stderr):** `C:\Users\spn\Documents\GitHub\Lab\logs\bridge-stderr.log`

Create the logs directory first:
```powershell
mkdir logs
```

### Exit Actions Tab:
- **Restart:** Application
- **Delay restart by:** 1000 ms

Click **Install service** when done.

## Step 3: Start the Service

```powershell
# Start the service
nssm start JA5003Bridge

# Check status
nssm status JA5003Bridge

# View logs (if configured)
Get-Content -Path logs\bridge-stdout.log -Tail 50 -Wait
```

## Step 4: Verify Bridge is Running

1. Open your browser and navigate to: `http://localhost:8787`
   - You should see: "JA5003 WS Bridge running"

2. Check diagnostics in the app: `http://localhost:5173/__diag`
   - Scale WS Bridge should show **Connected** with a green badge

3. Test WebSocket connection:
   ```powershell
   # Simple test with curl (if installed)
   curl http://127.0.0.1:8787
   ```

## Managing the Service

### View Service Status
```powershell
nssm status JA5003Bridge
```

### Stop Service
```powershell
nssm stop JA5003Bridge
```

### Restart Service
```powershell
nssm restart JA5003Bridge
```

### Edit Service Configuration
```powershell
nssm edit JA5003Bridge
```

### Remove Service
```powershell
# Stop first
nssm stop JA5003Bridge

# Remove
nssm remove JA5003Bridge confirm
```

## Alternative: PowerShell Script Installation

Use the provided script for automated installation:

```powershell
# Run as Administrator
pnpm run scale:install-bridge
```

This will:
1. Check for NSSM
2. Install the service with recommended settings
3. Start the service
4. Display status

## Troubleshooting

### Service won't start
1. Check Node.js is installed and in PATH:
   ```powershell
   node --version
   ```

2. Check startup directory is correct:
   ```powershell
   nssm edit JA5003Bridge
   ```
   Navigate to Application tab and verify paths.

3. Check environment variables:
   ```powershell
   nssm edit JA5003Bridge
   ```
   Navigate to Environment tab.

4. View logs:
   ```powershell
   Get-Content logs\bridge-stderr.log -Tail 50
   ```

### Port already in use
- The bridge will auto-increment ports (8787 → 8788 → 8789...)
- Check actual port in stdout log:
   ```powershell
   Get-Content logs\bridge-stdout.log | Select-String "Bridge on ws"
   ```
- Update app configuration if port changed

### Scale not detected (JA_PORT=AUTO)
1. Check COM ports in Device Manager
2. Try specific port:
   ```powershell
   nssm edit JA5003Bridge
   ```
   Set `JA_PORT=COM3` (or your specific port)

3. Restart service:
   ```powershell
   nssm restart JA5003Bridge
   ```

### Service crashes repeatedly
- Check Node.js version: `node --version` (should be v18+)
- Verify project dependencies are installed: `pnpm install`
- Check logs for errors: `Get-Content logs\bridge-stderr.log -Tail 100`

### Lock file conflicts
If you see "Lock file exists" errors:
1. Stop the service: `nssm stop JA5003Bridge`
2. Delete lock file: `Remove-Item .bridge.lock`
3. Start service: `nssm start JA5003Bridge`

## Service Logs

The bridge runner logs to:
- **Console output:** `logs/bridge-stdout.log`
- **Error output:** `logs/bridge-stderr.log`

View live logs:
```powershell
# Stdout (normal operation)
Get-Content logs\bridge-stdout.log -Tail 50 -Wait

# Stderr (errors only)
Get-Content logs\bridge-stderr.log -Tail 50 -Wait
```

Rotate logs periodically to prevent disk space issues:
```powershell
# Archive old logs
Rename-Item logs\bridge-stdout.log "logs\bridge-stdout-$(Get-Date -Format 'yyyyMMdd').log"
Rename-Item logs\bridge-stderr.log "logs\bridge-stderr-$(Get-Date -Format 'yyyyMMdd').log"

# Restart service to create new logs
nssm restart JA5003Bridge
```

## Monitoring Service Health

### Windows Event Viewer
1. Open Event Viewer (`eventvwr.msc`)
2. Navigate to: Windows Logs → Application
3. Filter by source: `JA5003Bridge`

### Diagnostics Page
- Navigate to `http://localhost:5173/__diag`
- Check "Scale WS Bridge" status:
  - **Green:** Connected, receiving data (< 5s old)
  - **Amber:** Connected but stale data (≥ 5s old)
  - **Red:** Disconnected

### PowerShell Health Check Script
```powershell
# Check if service is running and port is open
$status = nssm status JA5003Bridge
Write-Host "Service Status: $status"

$port = 8787
$connection = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue
if ($connection.TcpTestSucceeded) {
    Write-Host "Port $port is OPEN" -ForegroundColor Green
} else {
    Write-Host "Port $port is CLOSED" -ForegroundColor Red
}
```

## Security Considerations

1. **Localhost Only:** The bridge binds to `127.0.0.1` by default (local only)
2. **No Authentication:** WebSocket has no auth - only accept connections from localhost
3. **Firewall:** Ensure Windows Firewall doesn't block Node.js if needed
4. **Service Account:** Service runs as Local System by default (can change via NSSM)

To run as a specific user:
```powershell
nssm edit JA5003Bridge
# Navigate to "Log on" tab
# Select "This account" and enter credentials
```

## Updating the Bridge Code

When you update the bridge scripts:

1. Stop the service:
   ```powershell
   nssm stop JA5003Bridge
   ```

2. Update your code (git pull, etc.)

3. Install dependencies if needed:
   ```powershell
   pnpm install
   ```

4. Start the service:
   ```powershell
   nssm start JA5003Bridge
   ```

The service will automatically use the updated code.

## Uninstallation

To completely remove the bridge service:

```powershell
# Stop the service
nssm stop JA5003Bridge

# Remove the service
nssm remove JA5003Bridge confirm

# Optional: Remove logs
Remove-Item -Recurse -Force logs

# Optional: Remove lock file
Remove-Item .bridge.lock
```

## Support

For issues:
1. Check logs: `logs/bridge-stderr.log`
2. Check diagnostics: `http://localhost:5173/__diag`
3. Verify COM port in Device Manager
4. Test manual bridge start: `pnpm run bridge:start`
5. Check NSSM documentation: https://nssm.cc/usage

## Summary

✅ **Pros of running as a service:**
- Starts automatically on boot
- Runs even when user is logged out
- Auto-restarts on crash (via NSSM + bridge-runner)
- Centralized logs
- Professional production setup

⚠️ **For development:** Use `pnpm run dev:with-bridge` instead (easier to debug)

**Production deployment:** Install as service using this guide

