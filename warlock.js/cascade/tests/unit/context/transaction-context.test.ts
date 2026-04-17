import { beforeEach, describe, expect, it } from "vitest";
import { databaseTransactionContext } from "../../../src/context/database-transaction-context";

describe("DatabaseTransactionContext", () => {
  beforeEach(() => {
    // Clear context before each test
    databaseTransactionContext.clear();
  });

  describe("getSession()", () => {
    it("should return undefined when not set", () => {
      const result = databaseTransactionContext.getSession();
      expect(result).toBeUndefined();
    });

    it("should return session after being set", () => {
      const mockSession = { id: "tx-123", active: true };
      databaseTransactionContext.setSession(mockSession);

      const result = databaseTransactionContext.getSession();
      expect(result).toBe(mockSession);
    });

    it("should return typed session with generic", () => {
      interface CustomSession {
        transactionId: string;
        startTime: number;
      }

      const mockSession: CustomSession = {
        transactionId: "tx-456",
        startTime: Date.now(),
      };

      databaseTransactionContext.setSession(mockSession);

      const result = databaseTransactionContext.getSession<CustomSession>();
      expect(result?.transactionId).toBe("tx-456");
      expect(result?.startTime).toBeDefined();
    });
  });

  describe("setSession()", () => {
    it("should store transaction session", () => {
      const session = { id: "abc", timestamp: 123456 };
      databaseTransactionContext.setSession(session);

      expect(databaseTransactionContext.getSession()).toBe(session);
    });

    it("should overwrite previous session", () => {
      databaseTransactionContext.setSession({ id: "first" });
      databaseTransactionContext.setSession({ id: "second" });

      const result = databaseTransactionContext.getSession() as any;
      expect(result.id).toBe("second");
    });

    it("should handle null session", () => {
      databaseTransactionContext.setSession(null);
      expect(databaseTransactionContext.getSession()).toBeNull();
    });
  });

  describe("exit()", () => {
    it("should clear the context", () => {
      databaseTransactionContext.setSession({ id: "tx-789" });
      expect(databaseTransactionContext.getSession()).toBeDefined();

      databaseTransactionContext.exit();

      expect(databaseTransactionContext.getSession()).toBeUndefined();
    });

    it("should be safe to call multiple times", () => {
      databaseTransactionContext.setSession({ id: "tx" });
      databaseTransactionContext.exit();
      databaseTransactionContext.exit();

      expect(databaseTransactionContext.getSession()).toBeUndefined();
    });
  });

  describe("buildStore()", () => {
    it("should return correct initial state", () => {
      const store = databaseTransactionContext.buildStore();

      expect(store).toEqual({ session: undefined });
    });
  });

  describe("context isolation", () => {
    it("should maintain separate transaction contexts", async () => {
      const txOperation1 = async () => {
        return databaseTransactionContext.run({ session: { id: "tx-1" } }, async () => {
          return databaseTransactionContext.getSession() as any;
        });
      };

      const txOperation2 = async () => {
        return databaseTransactionContext.run({ session: { id: "tx-2" } }, async () => {
          return databaseTransactionContext.getSession() as any;
        });
      };

      const [result1, result2] = await Promise.all([txOperation1(), txOperation2()]);

      expect(result1.id).toBe("tx-1");
      expect(result2.id).toBe("tx-2");
    });
  });
});
