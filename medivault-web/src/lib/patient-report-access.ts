import type { Db } from "mongodb";
import { normalizePhone } from "@/lib/lab-utils";

// A phone typed into a family profile is contact information, not proof that
// this account owns that person's laboratory reports.
export async function accountPatientPhone(db: Db, userId: string) {
  const account = await db.collection<{ id: string; phone?: string; accountStatus?: string }>("authUsers")
    .findOne({ id: userId }, { projection: { _id: 0, phone: 1, accountStatus: 1 } });
  if (!account || account.accountStatus === "suspended") return "";
  const phone = normalizePhone(account.phone ?? "");
  return phone.length >= 8 ? phone : "";
}
