# Observability (Logs, Metrics, Tracing)

This step sets a baseline for production visibility. Start with logging, then add metrics and tracing.

## Logging (Phase 1)

- Use structured JSON logs.
- Include request id, service name, status code, and latency.
- Avoid logging secrets or PII.
- Services write logs to `apps/<service>/logs/*.log` for Promtail.

## Metrics (Phase 2)

- Expose a `/metrics` endpoint per service (Prometheus format).
- Track request duration, status codes, and error rates.

## Tracing (Phase 3)

- Use OpenTelemetry for distributed tracing.
- Propagate trace context through the API gateway.
- Export traces to a collector (e.g., OTEL Collector, Jaeger).

## Minimal Local Stack (Beginner Friendly)

This uses a simple Grafana stack that works well locally:

- Prometheus (metrics)
- Grafana (dashboards)
- Loki (logs)
- Promtail (log shipping)

### Compose Files

- `docker-compose.observability.yml` (Grafana stack)

### Start the stack

```bash
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.observability.yml up --build
```

### Access

- Grafana: `http://localhost:3006` (admin/admin on first run)
- Prometheus: `http://localhost:9090`
- Loki: `http://localhost:3100`
