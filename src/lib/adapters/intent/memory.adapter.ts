import type { IntentPort, TransactionIntent } from "../../ports/intent.port";

const TTL_MS = 300_000;

class MemoryIntentAdapter implements IntentPort {
  private intents = new Map<string, TransactionIntent>();

  async store(intent: TransactionIntent): Promise<void> {
    this.intents.set(intent.intentId, intent);
  }

  async get(intentId: string): Promise<TransactionIntent | null> {
    const intent = this.intents.get(intentId) ?? null;
    if (!intent) return null;
    if (Date.now() > intent.expiresAt) {
      this.intents.delete(intentId);
      return null;
    }
    return intent;
  }

  async consume(intentId: string): Promise<TransactionIntent | null> {
    const intent = await this.get(intentId);
    if (!intent) return null;
    this.intents.delete(intentId);
    return intent;
  }
}

export const memoryIntentAdapter = new MemoryIntentAdapter();
