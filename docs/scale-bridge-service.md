# JA5003 WebSocket Bridge as Windows Service

Use NSSM to run the Node bridge on boot so the lab never forgets to start it.

## Steps

1. Install NSSM
   - Download NSSM and place `nssm.exe` in PATH.

2. Install service
   - Service name: `LAB-ScaleBridge`
   - Application: `C:\Program Files\nodejs\node.exe`
   - Arguments: `C:\path\to\repo\scripts\ja5003_ws_bridge.js`
   - Startup: `Automatic (Delayed Start)`

3. Set environment (Environment tab)
   - `JA_FORCE_OPEN=1`
   - `JA_PORT=COM3`
   - `JA_BAUD=9600`
   - `JA_CONTINUOUS=0`
   - `JA_POLL_CMDS=P`
   - `JA_SI_MS=500`
   - Optional stability:
     - `JA_AUTO_TARE=1`
     - `JA_STABLE_EPS=0.02`
     - `JA_STABLE_MS=1500`
     - `JA_TARE_WINDOW=0.05`
     - `JA_TARE_COOLDOWN_MS=3000`

4. Start service
   - `nssm start LAB-ScaleBridge`

5. Validate
   - Open `ws://127.0.0.1:8787` with the app or `wscat`.


