import { randomUUID } from 'node:crypto';

/**
 * Identity verification abstraction. In production this is a HOSTED flow
 * (Hyperverge/Onfido): the user completes document + liveness + face match on
 * the provider's page, and we receive a webhook. We store ONLY status +
 * reference — never document images (DPDP minimization).
 */

export interface IdvSession {
  sessionRef: string;
  redirectUrl: string;
}

export interface IdvResult {
  sessionRef: string;
  assertedAgeGte18: boolean;
  faceMatch: boolean;
  passed: boolean;
  rejectionReason?: string;
}

export interface IdvProvider {
  createSession(userId: string): Promise<IdvSession>;
  /** Validates provider webhook and normalises result. */
  parseWebhook(payload: unknown): IdvResult;
}

export class MockIdvProvider implements IdvProvider {
  async createSession(userId: string): Promise<IdvSession> {
    const sessionRef = `idv_${randomUUID()}`;
    // Dev: immediately resolvable via the mock webhook endpoint.
    return { sessionRef, redirectUrl: `/mock-idv?session=${sessionRef}&user=${userId}` };
  }

  parseWebhook(payload: unknown): IdvResult {
    const p = payload as Partial<IdvResult> & { sessionRef?: string };
    return {
      sessionRef: p.sessionRef ?? 'unknown',
      assertedAgeGte18: Boolean(p.assertedAgeGte18),
      faceMatch: Boolean(p.faceMatch),
      passed: Boolean(p.passed),
      rejectionReason: p.rejectionReason,
    };
  }
}

export function getIdvProvider(): IdvProvider {
  // Real provider adapter swapped in here when IDV_MOCK=false.
  return new MockIdvProvider();
}
