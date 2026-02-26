import { Injectable } from '@nestjs/common';

type RequestMetric = { timestampMs: number; statusCode: number };

@Injectable()
export class ObservabilityService {
  private readonly requestMetrics: RequestMetric[] = [];

  recordRequest(statusCode: number, timestampMs = Date.now()) {
    this.requestMetrics.push({ statusCode, timestampMs });
    this.prune(timestampMs);
  }

  getRequestSummary(windowMinutes: number) {
    const now = Date.now();
    this.prune(now, windowMinutes);
    const cutoff = now - windowMinutes * 60_000;
    const inWindow = this.requestMetrics.filter((metric) => metric.timestampMs >= cutoff);
    const totalRequests = inWindow.length;
    const errorRequests = inWindow.filter((metric) => metric.statusCode >= 500).length;

    return {
      totalRequests,
      errorRequests,
    };
  }

  private prune(nowMs: number, windowMinutes = 60) {
    const cutoff = nowMs - windowMinutes * 60_000;
    while (this.requestMetrics.length > 0 && this.requestMetrics[0].timestampMs < cutoff) {
      this.requestMetrics.shift();
    }
  }
}
