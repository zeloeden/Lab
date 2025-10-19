# Quick Start Guide

## 🚀 Running the App with Scale Bridge

### Option 1: Combined Dev Script (Recommended)
Start both Vite dev server and scale bridge together:

```bash
pnpm run dev:with-bridge
```

**What it does:**
- Starts Vite on port 5173 (opens browser automatically)
- Starts scale bridge on ws://127.0.0.1:8787
- Shows colored output: cyan for vite, magenta for bridge
- Stops both when you press Ctrl+C

### Option 2: Resilient Runner (Production-like)
Uses the auto-restart bridge runner:

```bash
pnpm run dev:with-bridge:runner
```

**What it does:**
- Starts resilient bridge runner (auto-restarts on crash)
- Starts Vite with mount verification
- Green output for bridge, blue for web

### Option 3: Separate Processes
Run in separate terminals for more control:

```bash
# Terminal 1: Start bridge
pnpm run scale:bridge:auto

# Terminal 2: Start app
pnpm run dev
```

---

## ⚙️ Scale Bridge Configuration

### In the App (Settings)
1. Navigate to **Settings → Scale Settings**
2. Select **Mode: Local Bridge (WS)**
3. Set **Bridge URL:** `ws://127.0.0.1:8787`
4. Click **Ping** to test connection
5. Status should show 🟢 **Connected**

### Bridge Modes

| Script | Mode | Polling | Best For |
|--------|------|---------|----------|
| `scale:bridge:auto` | Soft (P) | 500ms | Development (default) |
| `scale:bridge:soft` | Soft (P) | 500ms | COM3 specific |
| `scale:bridge:cont` | Continuous | 1000ms | Production |
| `bridge:start` | Auto-restart | 500ms | Production (resilient) |

---

## 🐛 Troubleshooting

### Port 8787 Already in Use (EADDRINUSE)

**Option 1: Kill existing Node processes (Windows)**
```powershell
taskkill /IM node.exe /F
```

**Option 2: Use different port**
```bash
# Set WS_PORT environment variable
cross-env JA_WS_PORT=8790 pnpm run scale:bridge:auto
```

Then update Settings → Bridge URL to `ws://127.0.0.1:8790`

**Option 3: Let bridge auto-increment**
The bridge will automatically try ports 8787, 8788, 8789... (up to 10 attempts)
Check the console output to see which port it bound to.

### Bridge Won't Start

1. **Check Node.js version:**
   ```bash
   node --version  # Should be v18+
   ```

2. **Check COM port:**
   - Open Device Manager → Ports (COM & LPT)
   - Note the COM port number (e.g., COM3, COM4)
   - Update script if needed: `JA_PORT=COM4`

3. **Check bridge logs:**
   ```bash
   # Run bridge directly to see errors
   node scripts/ja5003_ws_bridge.js
   ```

4. **Try AUTO port detection:**
   ```bash
   cross-env JA_PORT=AUTO pnpm run scale:bridge:auto
   ```

### Scale Not Detected (AUTO mode)

1. Verify scale is connected and powered on
2. Check USB cable
3. Try specific port instead of AUTO:
   ```bash
   cross-env JA_PORT=COM3 pnpm run scale:bridge:auto
   ```

### Bridge Crashes Repeatedly

1. Check Node.js version (v18+ required)
2. Reinstall dependencies:
   ```bash
   pnpm install
   ```
3. Check serial port permissions (Linux/Mac)
4. Use resilient runner:
   ```bash
   pnpm run dev:with-bridge:runner
   ```

---

## 📊 Diagnostics

### Check System Status
Navigate to: `http://localhost:5173/__diag`

**What to check:**
- ✅ Network: Online
- ✅ Database (Dexie): Connected
- ✅ Scale WS Bridge: 🟢 Connected
- ✅ Bridge URL: ws://127.0.0.1:8787
- ✅ Last packet: < 5s ago

### Bridge Status Badges

| Color | Meaning |
|-------|---------|
| 🟢 Green | Connected, receiving fresh data (< 5s) |
| 🟡 Amber | Connected, but data is stale (≥ 5s) |
| 🔴 Red | Disconnected |

### Console Logs

**Bridge logs show:**
```
[debug] Available ports: [ 'COM3', 'COM4' ]
[serial] OPENED COM3
✓ JA5003 WS Bridge on ws://127.0.0.1:8787
```

**Vite logs show:**
```
VITE v5.4.20  ready in 342 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🎯 Common Workflows

### Development (No Scale)
```bash
pnpm run dev
```
Just run the app. Settings will show bridge disconnected (expected).

### Development (With Scale)
```bash
pnpm run dev:with-bridge
```
Starts both app and bridge. Scale readings appear in real-time.

### Testing E2E (With Mock Scale)
```bash
pnpm test:e2e
```
Uses mock scale server on port 9878 (automatic).

### Production (Windows Service)
```bash
# Install service (one time)
pnpm run scale:install-bridge

# Start service
nssm start JA5003Bridge

# Run app
pnpm run dev
```
Bridge runs as background service, survives reboots.

---

## 🔑 Environment Variables

### Bridge Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `JA_FORCE_OPEN` | 0 | Use direct SerialPort (1=yes) |
| `JA_PORT` | COM3 | Serial port or "AUTO" |
| `JA_BAUD` | 9600 | Baud rate |
| `JA_CONTINUOUS` | 0 | Enable continuous mode |
| `JA_POLL_CMDS` | P | Poll commands (comma-separated) |
| `JA_SI_MS` | 500 | Polling interval (ms) |
| `JA_WS_PORT` | 8787 | WebSocket port |
| `JA_WS_HOST` | 127.0.0.1 | WebSocket host |

### Example: Custom Configuration
```bash
cross-env JA_PORT=COM4 JA_BAUD=19200 JA_SI_MS=250 pnpm run scale:bridge:auto
```

---

## 📚 Scripts Reference

| Script | Description |
|--------|-------------|
| `dev` | Start Vite dev server only |
| `dev:with-bridge` | Start Vite + bridge (cyan/magenta) |
| `dev:with-bridge:runner` | Start Vite + resilient runner |
| `scale:bridge:auto` | Start bridge with AUTO port |
| `scale:bridge:soft` | Start bridge with COM3 (soft mode) |
| `scale:bridge:cont` | Start bridge with COM3 (continuous) |
| `bridge:start` | Start resilient runner |
| `scale:ensure` | Ensure bridge running (background) |
| `test:e2e` | Run E2E tests (includes mock scale) |

---

## ✅ Quick Checklist

Before starting development:
- [ ] Node.js v18+ installed
- [ ] Dependencies installed (`pnpm install`)
- [ ] Scale connected (if using hardware)
- [ ] No other Node processes on port 8787

To start coding:
```bash
pnpm run dev:with-bridge
```

Then:
- [ ] Navigate to http://localhost:5173
- [ ] Go to Settings → Scale Settings
- [ ] Select "Local Bridge (WS)"
- [ ] Verify 🟢 Connected badge
- [ ] Start weighing!

---

## 🎉 Tips

1. **First time setup?** Use `dev:with-bridge` - it's the easiest
2. **Bridge keeps crashing?** Use `dev:with-bridge:runner` for auto-restart
3. **Testing without hardware?** Just run `pnpm run dev` and ignore bridge warnings
4. **Production deployment?** Install as Windows Service (see `docs/BRIDGE_SERVICE_INSTALLATION.md`)
5. **Port conflicts?** The bridge auto-increments, just check console for actual port

---

**Need more help?**
- Check diagnostics: `/__diag`
- Read docs: `BRIDGE_IMPLEMENTATION_SUMMARY.md`
- Service setup: `docs/BRIDGE_SERVICE_INSTALLATION.md`
- QR flow: `UNIVERSAL_QR_IMPLEMENTATION.md`

