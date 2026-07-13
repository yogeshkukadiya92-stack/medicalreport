export type NutritionAdminClient = {
  bodyEntries?: Array<{
    bmi?: string;
    bodyFat?: string;
    date?: string;
    muscleMass?: string;
    visceralFat?: string;
    weight?: string;
  }>;
  dietPlans?: Array<{ createdAt?: string; goal?: string; summary?: string }>;
  followUpDate?: string;
  goal?: string;
  name?: string;
  packageName?: string;
  paymentStatus?: string;
  phone?: string;
  shareLogs?: Array<{ createdAt?: string }>;
  status?: string;
};

const nutritionStorageKey = "medivault-nutrition-dashboard-v1";

function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function readNutritionAdminClients(): NutritionAdminClient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(nutritionStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { clients?: NutritionAdminClient[] };
    return Array.isArray(parsed.clients) ? parsed.clients : [];
  } catch {
    return [];
  }
}

export function findNutritionAdminClient(phone: string) {
  const normalized = phoneDigits(phone);
  return readNutritionAdminClients().find((client) => phoneDigits(client.phone || "") === normalized) ?? null;
}
