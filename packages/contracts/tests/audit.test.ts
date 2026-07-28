import { describe, expect, it } from "vitest";
import { AuditEventSchema } from "../src/index.js";

describe("AuditEventSchema", () => {
  it("accepts the minimum traceable audit event", () => {
    expect(
      AuditEventSchema.safeParse({
        timestamp: "2026-07-28T12:00:00.000Z",
        actor: "local.admin",
        action: "settings.update",
        resourceType: "settings",
        resourceId: "dashboard",
        permission: "settings.write",
        outcome: "success",
        requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
      }).success,
    ).toBe(true);
  });

  it("rejects arbitrary actor and action values", () => {
    expect(
      AuditEventSchema.safeParse({
        timestamp: "2026-07-28T12:00:00.000Z",
        actor: "Admin User",
        action: "changed everything",
        resourceType: "settings",
        outcome: "success",
      }).success,
    ).toBe(false);
  });
});
