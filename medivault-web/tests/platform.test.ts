import assert from "node:assert/strict";
import test from "node:test";
import { ensureBootstrapAdminWorkspace } from "../src/lib/auth-server";
import { billingMetrics } from "../src/lib/billing-rules";
import { validatePasswordStrength } from "../src/lib/auth-policy";
import { parseHl7Oru } from "../src/lib/hl7";
import { hasLabPermission } from "../src/lib/normalized-health";
import { createShareToken, hashShareToken } from "../src/lib/secure-share";

test("owner admin can recover a missing dashboard workspace", async () => {
  const updates: Array<{ collection: string; filter: unknown; update: unknown }> = [];
  const db = {
    collection(name: string) {
      return {
        async updateOne(filter: unknown, update: unknown) {
          updates.push({ collection: name, filter, update });
        },
      };
    },
  };
  const now = new Date().toISOString();
  const ownerEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || "yogeshkukadiya92@gmail.com").trim().toLowerCase();

  await ensureBootstrapAdminWorkspace(db as never, {
    createdAt: now,
    email: ownerEmail,
    id: "existing-owner-user",
    updatedAt: now,
  });

  assert.deepEqual(updates.map((item) => item.collection), ["labs", "labUsers"]);
  assert.deepEqual(updates[1]?.filter, {
    labId: updates[0] && (updates[0].filter as { id: string }).id,
    userId: "existing-owner-user",
  });
  assert.deepEqual(
    (updates[1]?.update as { $set: { workspaceAccess: string[] } }).$set.workspaceAccess,
    ["lab", "nutrition", "body_composition", "patient_app"],
  );
});

test("secure share tokens are random and hashes are stable", () => {
  const first = createShareToken();
  const second = createShareToken();
  assert.notEqual(first.token, second.token);
  assert.equal(first.tokenHash, hashShareToken(first.token));
  assert.equal(first.token.length >= 40, true);
});

test("auth password policy rejects weak credentials", () => {
  assert.match(validatePasswordStrength("123456"), /8 characters/);
  assert.match(validatePasswordStrength("abcdefgh"), /letter and one number/);
  assert.equal(validatePasswordStrength("Health123"), "");
});

test("RBAC honors explicit deny before role and explicit allow", () => {
  assert.equal(hasLabPermission("lab_admin", "reports:publish"), true);
  assert.equal(hasLabPermission("lab_admin", "reports:publish", { deny: ["reports:publish"] }), false);
  assert.equal(hasLabPermission("collector", "reports:verify", { allow: ["reports:verify"] }), true);
});

test("billing excludes void/refunded invoices from outstanding totals", () => {
  assert.deepEqual(billingMetrics([
    { amount: 100, status: "paid" },
    { amount: 80.25, status: "issued" },
    { amount: 25, status: "void" },
    { amount: 15, status: "refunded" },
    { amount: Number.NaN, status: "issued" },
  ]), {
    invoiceCount: 5,
    outstandingAmount: 80.25,
    paidAmount: 100,
    totalAmount: 195.25,
  });
});

test("HL7 ORU parser extracts patient, report and observations", () => {
  const message = [
    "MSH|^~\\&|ANALYZER|LAB|MEDIVAULT|CLINIC|20260727103000||ORU^R01|MSG-1001|P|2.5.1",
    "PID|1||P100||Patel^Meera||||||||+919876543210",
    "OBR|1|ORDER-1|ACC-1|CBC^Complete Blood Count|||20260727100000",
    "OBX|1|NM|718-7^Hemoglobin||12.4|g/dL|12-16|N|||F",
    "OBX|2|NM|6690-2^WBC Count||12500|cells/uL|4000-11000|H|||F",
  ].join("\r");
  const result = parseHl7Oru(message);
  assert.equal(result.messageControlId, "MSG-1001");
  assert.equal(result.clientName, "Meera Patel");
  assert.equal(result.reportType, "Complete Blood Count");
  assert.equal(result.observations.length, 2);
  assert.equal(result.observations[1].status, "High");
});

test("HL7 parser rejects non-ORU payloads", () => {
  assert.throws(() => parseHl7Oru([
    "MSH|^~\\&|A|B|C|D|20260727||ADT^A01|MSG-2|P|2.5",
    "PID|1||P1||Patel^Meera",
    "OBR|1|||CBC^CBC",
  ].join("\r")), /Only HL7 ORU/);
});
