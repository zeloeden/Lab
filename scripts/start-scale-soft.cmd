@echo off
set JA_FORCE_OPEN=1
set JA_PORT=COM3
set JA_BAUD=9600
set JA_CONTINUOUS=0
set JA_POLL_CMDS=P
set JA_SI_MS=500
echo Starting JA5003 WS Bridge (soft print mode) on ws://127.0.0.1:8787 ...
pnpm run scale:bridge

