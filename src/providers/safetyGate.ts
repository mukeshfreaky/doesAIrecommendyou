/**
 * Hard Live-API Safety Gate for Development & Budget Protection.
 * Enforces:
 * 1. AI_LIVE_ENABLED=true required for any real external AI provider calls.
 * 2. Strict development budget cap (AI_MAX_LIVE_CALLS, default: 10).
 * 3. MockProvider calls are NEVER counted toward the live limit.
 */

let liveCallCount = 0;

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxCalls: number;
}

export function checkAndIncrementLiveCall(providerId: string): SafetyCheckResult {
  const liveEnabled = process.env.AI_LIVE_ENABLED === "true";
  const maxCalls = parseInt(process.env.AI_MAX_LIVE_CALLS || "10", 10);

  if (!liveEnabled) {
    return {
      allowed: false,
      reason: `Live AI calls are disabled (AI_LIVE_ENABLED is not set to 'true'). Set AI_LIVE_ENABLED=true in .env.local to authorize live API calls.`,
      currentCount: liveCallCount,
      maxCalls,
    };
  }

  if (liveCallCount >= maxCalls) {
    return {
      allowed: false,
      reason: `Live AI safety limit reached (${liveCallCount}/${maxCalls} live calls). Refusing additional live calls to protect development budget.`,
      currentCount: liveCallCount,
      maxCalls,
    };
  }

  liveCallCount++;
  return {
    allowed: true,
    currentCount: liveCallCount,
    maxCalls,
  };
}

export function getLiveCallCount(): number {
  return liveCallCount;
}

export function resetLiveCallCount(): void {
  liveCallCount = 0;
}

