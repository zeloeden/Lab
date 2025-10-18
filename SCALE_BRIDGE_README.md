# JA5003 Scale Bridge Setup Guide

This guide covers the enhanced JA5003 WebSocket bridge with auto-start capabilities, single-instance protection, and improved reliability.

## Features

### Bridge Enhancements
- ✅ **Auto-port selection** - Automatically finds and uses available serial ports (set `JA_PORT=AUTO`)
- ✅ **Port auto-increment** - If port 8787 is in use, automatically tries 8788, 8789, etc.
- ✅ **Single instance guard** - Prevents multiple bridge instances with lock file protection
- ✅ **Ping/pong heartbeat** - WebSocket connections have 15s heartbeat to detect dead clients
- ✅ **Stream health monitoring** - Warns if no data received for 10s in CONTINUOUS mode
- ✅ **Graceful shutdown** - Cleanup on SIGINT/SIGTERM

### Auto-Start Utility
- ✅ **Background process** - Spawns bridge as detached process that survives app restarts
- ✅ **Port detection** - Checks if bridge is already running before starting
- ✅ **Lock file checking** - Verifies existing instances via PID and lock file

## Quick Start

### Option 1: Manual Bridge Start (Recommended for Development)

```bash
# Start bridge with auto port detection
pnpm run scale:bridge:auto

# Or with specific port
pnpm run scale:bridge:soft
# or
pnpm run scale:bridge:cont
```

### Option 2: Auto-Start Utility

```bash
# Ensure bridge is running (starts if not already running)
pnpm run scale:ensure
```

This will:
1. Check if port 8787 is in use
2. Check for existing bridge lock file
3. Start bridge as background process if needed
4. Exit without starting if bridge is already running

### Option 3: Run as Windows Service

```bash
# Install as service using NSSM
pnpm run scale:install-bridge
```

See `IMPLEMENTATION_SUMMARY.md` for service installation details.

## Configuration

### Environment Variables

**Bridge Connection:**
- `JA_WS_PORT` - WebSocket port (default: 8787)
- `JA_WS_HOST` - Host to bind (default: 127.0.0.1)
- `JA_ALLOW_MULTIPLE` - Allow multiple bridge instances (default: false)

**Serial Port:**
- `JA_PORT` - Serial port path or "AUTO" for auto-detection (default: COM3)
- `JA_BAUD` - Baud rate (default: 9600)
- `JA_FORCE_OPEN=1` - Use direct SerialPort instead of JA5003Serial wrapper

**Polling & Continuous Mode:**
- `JA_CONTINUOUS=1` - Enable continuous mode (default: 1)
- `JA_SI_MS` - Polling interval in ms (default: 1000, min: 250)
- `JA_POLL_CMDS` - Comma-separated poll commands (default: "SI")

**Auto-Tare:**
- `JA_AUTO_TARE=1` - Enable automatic tare (default: 0)
- `JA_STABLE_EPS` - Stability epsilon in grams (default: 0.02)
- `JA_STABLE_MS` - Stability duration in ms (default: 1500)
- `JA_TARE_WINDOW` - Weight window for auto-tare in grams (default: 0.05)
- `JA_TARE_COOLDOWN_MS` - Cooldown between tares in ms (default: 3000)

## Using in Settings

The app's Settings page automatically adapts based on selected mode:

### Browser Serial Mode
- **Disabled:** Bridge URL, Ping, Reconnect buttons
- **Hint:** "Web Serial works only in Chrome/Edge. Firefox/Safari not supported."

### Local Bridge (WS) Mode
- **Disabled:** Serial Connect, Pick JA5003, COM settings
- **Hint:** "Run the bridge: node scripts/ja5003_ws_bridge.js (or pnpm run scale:bridge:soft)."

### Warning
- Red banner appears if both Browser Serial and WS Bridge are active simultaneously

## Diagnostics

Visit `/__diag` in your browser to check:
- App version
- Online status
- Dexie database availability
- **WebSocket bridge connectivity**
- Last scale message received

## Troubleshooting

### Bridge won't start
1. Check if another instance is running: `pnpm run scale:ensure`
2. Check lock file: `%TEMP%\ja5003_ws_bridge.lock` (Windows) or `/tmp/ja5003_ws_bridge.lock` (Linux/Mac)
3. Manually remove lock file if stale
4. Check if port 8787 is in use: `netstat -an | findstr 8787` (Windows) or `lsof -i :8787` (Mac/Linux)

### "Port already in use" (EADDRINUSE)
- The bridge will automatically try ports 8788, 8789, etc. (up to 10 attempts)
- Check the console output for the actual port it bound to
- Update `JA_WS_PORT` in your environment if needed

### Scale not responding
1. Check COM port in Device Manager (Windows)
2. Try `JA_PORT=AUTO` to auto-detect
3. Verify baud rate (usually 9600 for JA5003)
4. Check cables and power
5. Look for "[stream-health]" warnings in bridge console

### Multiple instances
- By default, only one bridge instance is allowed
- Set `JA_ALLOW_MULTIPLE=1` to override (not recommended)
- Each instance will use a different port

## Integration with E2E Tests

The E2E test suite includes a mock scale server:
- Runs on `ws://127.0.0.1:9878`
- Sends fake weight readings every 500ms
- Responds to PING, TARE, SI commands
- Automatically started/stopped by Playwright global setup/teardown

Run tests:
```bash
pnpm test:e2e
pnpm test:e2e:ui  # Interactive UI mode
```

## Architecture

```
┌─────────────┐         WebSocket          ┌──────────────┐
│   Browser   │◄─────────────────────────►│   Bridge     │
│   (React)   │   ws://127.0.0.1:8787      │  (Node.js)   │
└─────────────┘                            └──────┬───────┘
                                                   │
                                             SerialPort
                                                   │
                                             ┌─────▼──────┐
                                             │  JA5003    │
                                             │   Scale    │
                                             └────────────┘
```

**Bridge Features:**
- Single WebSocket server serves multiple browser clients
- Broadcasts all serial data to all connected clients
- Accepts text commands from any client
- Heartbeat keeps connections alive
- Lock file prevents duplicate instances

## Scripts Reference

| Script | Description |
|--------|-------------|
| `scale:ensure` | Auto-start bridge if not running (background) |
| `scale:bridge` | Start bridge (foreground, blocks terminal) |
| `scale:bridge:auto` | Start with AUTO port detection |
| `scale:bridge:soft` | Start in soft/print mode (P command polling) |
| `scale:bridge:cont` | Start in continuous mode (SI, S, P polling) |
| `scale:install-bridge` | Install as Windows service via NSSM |

## License

MIT

