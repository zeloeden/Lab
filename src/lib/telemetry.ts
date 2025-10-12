export type TelemetryPayload = Record<string, any>;

export const telemetry = {
  emit(event: string, payload: TelemetryPayload) {
    try {
      // Hook for future wiring; for now, log to console
      // eslint-disable-next-line no-console
      console.debug('[telemetry]', event, payload);
    } catch {}
  }
};


