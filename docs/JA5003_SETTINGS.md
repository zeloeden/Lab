# JA5003 Scale – Recommended Settings for Auto Print

These settings make the scale stream readings automatically (no need to press PRINT) and work best with the app/bridge.

## Menu Targets (names may vary slightly by firmware)

- Print mode: set to Continuous (often shown as `CONT 1` or `Con`)
  - Purpose: makes the device emit lines repeatedly.
- Stable only: ON (often shown as `STA 1` or an `ST` indicator)
  - Purpose: only prints when stable; turn OFF if you want every line.
- Baud rate: 9600, 8 data bits, no parity, 1 stop bit (9600 8N1)
  - Handshake/flow control: None.
- Units: grams (g)
  - Avoid surprises from kg/mg.
- Line ending/format: include `ST` when stable and numeric value with unit (e.g. `+000.123 g`).

## Notes

- Our bridge/driver also sends on connect: `C`, `Q`, `CONT 1`, `STA 1` with light pacing to ensure continuous output even if the menu isn’t set.
- If you prefer non‑stable streaming, turn Stable only OFF (or set `STA 0`).
- If the device stops talking, toggle Continuous via the `C` command or reapply the sequence above.

## Troubleshooting

- If the app stops receiving after switching tabs, simply switch back; the bridge will reconnect.
- If needed, press MENU → PRINT and confirm the `CONT`/`STA` settings above.
