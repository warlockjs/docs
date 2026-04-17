import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModelEvents, globalModelEvents } from "../../../src/events/model-events";
import { Model } from "../../../src/model/model";
import { RegisterModel } from "../../../src/model/register-model";

// Mock QueryBuilder since events use it
const mockQueryBuilder = {
  where: vi.fn(),
};

@RegisterModel()
class TestUser extends Model {
  static table = "test_users";
}

describe("Model Events System", () => {
  beforeEach(() => {
    // Clear global events before each test
    globalModelEvents.clear();
  });

  describe("ModelEvents Class", () => {
    it("should register and trigger listeners", async () => {
      const events = new ModelEvents<TestUser>();
      const listener = vi.fn();

      events.on("saving", listener);
      await events.emit("saving", new TestUser(), { mode: "insert" });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should remove listeners with off()", async () => {
      const events = new ModelEvents<TestUser>();
      const listener = vi.fn();

      events.on("saving", listener);
      events.off("saving", listener);
      await events.emit("saving", new TestUser(), { mode: "insert" });

      expect(listener).not.toHaveBeenCalled();
    });

    it("should support once() listeners", async () => {
      const events = new ModelEvents<TestUser>();
      const listener = vi.fn();

      events.once("saving", listener);

      await events.emit("saving", new TestUser(), {});
      await events.emit("saving", new TestUser(), {});

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should return unsubscribe function from on()", async () => {
      const events = new ModelEvents<TestUser>();
      const listener = vi.fn();

      const unsubscribe = events.on("saving", listener);
      unsubscribe();

      await events.emit("saving", new TestUser(), {});
      expect(listener).not.toHaveBeenCalled();
    });

    it("should clear all listeners", async () => {
      const events = new ModelEvents<TestUser>();
      const listener = vi.fn();

      events.on("saving", listener);
      events.clear();

      await events.emit("saving", new TestUser(), {});
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("Model Integration", () => {
    it("should allow registering instance events", async () => {
      const user = new TestUser();
      const listener = vi.fn();

      user.on("saving", listener);
      await user.emitEvent("saving", { mode: "insert" });

      expect(listener).toHaveBeenCalledWith(user, { mode: "insert" });
    });

    it("should allow registering once events on instance", async () => {
      const user = new TestUser();
      const listener = vi.fn();

      user.once("saving", listener);
      await user.emitEvent("saving", {});
      await user.emitEvent("saving", {});

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should allow deregistering instance events", async () => {
      const user = new TestUser();
      const listener = vi.fn();

      user.on("saving", listener);
      user.off("saving", listener);
      await user.emitEvent("saving", {});

      expect(listener).not.toHaveBeenCalled();
    });

    it("should trigger global model events", async () => {
      const listener = vi.fn();
      globalModelEvents.on("saving", listener);

      const user = new TestUser();
      await user.emitEvent("saving", { global: true });

      expect(listener).toHaveBeenCalledWith(user, { global: true });
    });

    it("should trigger both instance and global events", async () => {
      const instanceListener = vi.fn();
      const globalListener = vi.fn();

      globalModelEvents.on("saving", globalListener);

      const user = new TestUser();
      user.on("saving", instanceListener);

      await user.emitEvent("saving", {});

      expect(instanceListener).toHaveBeenCalled();
      expect(globalListener).toHaveBeenCalled();
    });
  });

  describe("Convenience Methods", () => {
    it("should have convenience methods for standard events in ModelEvents", async () => {
      const events = new ModelEvents<TestUser>();
      const listeners = {
        saving: vi.fn(),
        saved: vi.fn(),
        creating: vi.fn(),
        created: vi.fn(),
        updating: vi.fn(),
        updated: vi.fn(),
        deleting: vi.fn(),
        deleted: vi.fn(),
      };

      events.onSaving(listeners.saving);
      events.onSaved(listeners.saved);
      events.onCreating(listeners.creating);
      events.onCreated(listeners.created);
      events.onUpdating(listeners.updating);
      events.onUpdated(listeners.updated);
      events.onDeleting(listeners.deleting);
      events.onDeleted(listeners.deleted);

      await events.emit("saving", new TestUser(), {});
      await events.emit("saved", new TestUser(), {});
      await events.emit("creating", new TestUser(), {});
      await events.emit("created", new TestUser(), {});
      await events.emit("updating", new TestUser(), {});
      await events.emit("updated", new TestUser(), {});
      await events.emit("deleting", new TestUser(), {});
      await events.emit("deleted", new TestUser(), {});

      expect(listeners.saving).toHaveBeenCalled();
      expect(listeners.saved).toHaveBeenCalled();
      expect(listeners.creating).toHaveBeenCalled();
      expect(listeners.created).toHaveBeenCalled();
      expect(listeners.updating).toHaveBeenCalled();
      expect(listeners.updated).toHaveBeenCalled();
      expect(listeners.deleting).toHaveBeenCalled();
      expect(listeners.deleted).toHaveBeenCalled();
    });
  });

  describe("Model Query Scopes", () => {
    it("should add and remove global scopes", () => {
      const scope = vi.fn();
      const scopeName = "active";

      TestUser.addGlobalScope(scopeName, scope);
      expect(TestUser.globalScopes.has(scopeName)).toBe(true);

      TestUser.removeGlobalScope(scopeName);
      expect(TestUser.globalScopes.has(scopeName)).toBe(false);
    });

    it("should add and remove local scopes", () => {
      const scope = vi.fn();
      const scopeName = "latest";

      TestUser.addScope(scopeName, scope);
      expect(TestUser.localScopes.has(scopeName)).toBe(true);

      TestUser.removeScope(scopeName);
      expect(TestUser.localScopes.has(scopeName)).toBe(false);
    });
  });
});
