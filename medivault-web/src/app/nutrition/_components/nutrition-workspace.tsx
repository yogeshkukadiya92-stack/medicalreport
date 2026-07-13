"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthSetupRequired, SessionLoading } from "@/components/auth-gate";
import { useAppData } from "@/components/app-data-provider";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/mobile-shell";

type BodyEntry = {
  id: string;
  date: string;
  weight: string;
  bmi: string;
  bodyFat: string;
  muscleMass: string;
  visceralFat: string;
  bmr: string;
  notes: string;
};

type MealSlot = {
  id: string;
  time: string;
  meal: string;
  quantity: string;
  notes: string;
};

type DietPlan = {
  id: string;
  createdAt: string;
  goal: string;
  language: "English" | "Gujarati" | "Hindi";
  meals: MealSlot[];
  summary: string;
};

type CustomTemplate = {
  id: string;
  createdAt: string;
  meals: MealSlot[];
  note: string;
  title: string;
  updatedAt: string;
};

type ShareLog = {
  id: string;
  channel: "WhatsApp";
  createdAt: string;
  planId: string;
  summary: string;
};

type NutritionClient = {
  id: string;
  activityLevel: string;
  age: string;
  allergies: string;
  conditions: string;
  name: string;
  phone: string;
  foodPreference: string;
  gender: string;
  goal: string;
  height: string;
  packageName: string;
  paymentStatus: "Paid" | "Pending" | "Trial";
  status: "Active" | "New" | "Follow-up" | "Paused";
  targetWeight: string;
  targetFat: string;
  followUpDate: string;
  notes: string;
  bodyEntries: BodyEntry[];
  dietPlans: DietPlan[];
  shareLogs: ShareLog[];
};

type NutritionStore = {
  clients: NutritionClient[];
  customTemplates: CustomTemplate[];
  selectedClientId: string;
};

type PdfSettings = {
  clinicName: string;
  footerNote: string;
  includeBodyMetrics: boolean;
  nutritionistName: string;
  title: string;
};

const storageKey = "medivault-nutrition-dashboard-v1";

export type NutritionSection = "dashboard" | "clients" | "body-composition" | "diet-builder" | "follow-ups" | "templates";

const sectionRoutes: Array<{ href: string; key: NutritionSection; label: string }> = [
  { href: "/nutrition", key: "dashboard", label: "Dashboard" },
  { href: "/nutrition/clients", key: "clients", label: "Clients" },
  { href: "/nutrition/body-composition", key: "body-composition", label: "Body composition" },
  { href: "/nutrition/diet-builder", key: "diet-builder", label: "Diet builder" },
  { href: "/nutrition/follow-ups", key: "follow-ups", label: "Follow-ups" },
  { href: "/nutrition/templates", key: "templates", label: "Templates" },
];

const sectionCopy: Record<NutritionSection, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: "Command center",
    title: "Nutrition dashboard",
    description: "Manage nutrition clients, body-composition history, goal tracking, diet plans and one-click WhatsApp sharing from one workspace.",
  },
  clients: {
    eyebrow: "Client CRM",
    title: "Nutrition clients",
    description: "Search, add, segment and select clients by mobile number, goal, status and follow-up priority.",
  },
  "body-composition": {
    eyebrow: "Progress tracking",
    title: "Body composition",
    description: "Track weight, BMI, fat, muscle, visceral fat and linked patient-app scan history with clear trend graphs.",
  },
  "diet-builder": {
    eyebrow: "Plan studio",
    title: "Diet builder",
    description: "Build structured meal plans, save versions, and share the latest plan to WhatsApp in one click.",
  },
  "follow-ups": {
    eyebrow: "Retention desk",
    title: "Follow-ups",
    description: "See due clients, plan history, notes and next actions so no nutrition client slips from the schedule.",
  },
  templates: {
    eyebrow: "Reusable protocols",
    title: "Nutrition templates",
    description: "Keep ready-to-use meal frameworks for fat loss, muscle gain, diabetic-friendly and maintenance plans.",
  },
};

const mealTemplate: MealSlot[] = [
  { id: "wake", time: "Early morning", meal: "Warm water + light movement", quantity: "1 glass", notes: "Keep routine consistent." },
  { id: "breakfast", time: "Breakfast", meal: "Protein breakfast", quantity: "1 plate", notes: "Add fiber and avoid sugary drinks." },
  { id: "mid", time: "Mid-meal", meal: "Fruit / nuts", quantity: "1 serving", notes: "Choose seasonal option." },
  { id: "lunch", time: "Lunch", meal: "Balanced thali", quantity: "1 plate", notes: "Protein + vegetables + controlled carbs." },
  { id: "evening", time: "Evening", meal: "Tea snack", quantity: "1 serving", notes: "Avoid fried snacks." },
  { id: "dinner", time: "Dinner", meal: "Light dinner", quantity: "1 plate", notes: "Finish 2-3 hours before sleep." },
];

const planTemplates: Array<{ title: string; note: string; tone: string; meals: MealSlot[] }> = [
  {
    title: "Fat loss",
    note: "High protein, controlled carbs, walking target, weekly scan review.",
    tone: "bg-[#eaf9f2] text-[#087766]",
    meals: mealTemplate.map((meal) => ({ ...meal, id: `${meal.id}-fat-loss` })),
  },
  {
    title: "Muscle gain",
    note: "Calorie surplus, protein per meal, training-day carbs, sleep check.",
    tone: "bg-[#eef4ff] text-[#315da8]",
    meals: [
      { id: "gain-1", time: "Breakfast", meal: "Paneer/tofu bhurji + roti", quantity: "1 plate", notes: "Add curd if tolerated." },
      { id: "gain-2", time: "Post workout", meal: "Protein shake / milk + banana", quantity: "1 serving", notes: "Use after training." },
      { id: "gain-3", time: "Lunch", meal: "Dal, rice, sabji, salad", quantity: "1 large plate", notes: "Add ghee within target." },
      { id: "gain-4", time: "Evening", meal: "Nuts + fruit", quantity: "1 bowl", notes: "Keep protein consistent." },
      { id: "gain-5", time: "Dinner", meal: "Protein + carbs + vegetables", quantity: "1 plate", notes: "Do not skip dinner." },
    ],
  },
  {
    title: "Diabetic friendly",
    note: "Low GI meals, timing discipline, fiber first and glucose-aware swaps.",
    tone: "bg-[#fff8dc] text-[#8a6500]",
    meals: [
      { id: "dm-1", time: "Breakfast", meal: "Moong chilla / besan chilla", quantity: "2 pieces", notes: "No sweet tea." },
      { id: "dm-2", time: "Mid-meal", meal: "Buttermilk / nuts", quantity: "1 serving", notes: "Avoid juice." },
      { id: "dm-3", time: "Lunch", meal: "Salad first, dal, sabji, 2 rotli", quantity: "1 plate", notes: "Control rice portion." },
      { id: "dm-4", time: "Evening", meal: "Sprouts / roasted chana", quantity: "1 bowl", notes: "No fried snack." },
      { id: "dm-5", time: "Dinner", meal: "Light protein dinner", quantity: "1 plate", notes: "Walk 10 min after meal." },
    ],
  },
  {
    title: "Gujarati home plan",
    note: "Rotli/sabji/dal portions, evening snack controls and local food swaps.",
    tone: "bg-[#eaf9f2] text-[#087766]",
    meals: [
      { id: "guj-1", time: "Breakfast", meal: "Thepla + curd / poha with sprouts", quantity: "1 plate", notes: "Less oil." },
      { id: "guj-2", time: "Lunch", meal: "2 rotli, dal, sabji, salad", quantity: "1 thali", notes: "Protein first." },
      { id: "guj-3", time: "Evening", meal: "Tea + roasted chana", quantity: "1 serving", notes: "Avoid farsan daily." },
      { id: "guj-4", time: "Dinner", meal: "Khichdi + kadhi + salad", quantity: "1 bowl", notes: "Early dinner." },
    ],
  },
  {
    title: "Weight gain",
    note: "Higher calorie home meals, protein each sitting and easy add-ons.",
    tone: "bg-[#eef4ff] text-[#315da8]",
    meals: [
      { id: "wg-1", time: "Breakfast", meal: "Stuffed paratha / paneer sandwich", quantity: "1 plate", notes: "Add curd or milk." },
      { id: "wg-2", time: "Mid-meal", meal: "Banana shake / dry fruit milk", quantity: "1 glass", notes: "No skipped snack." },
      { id: "wg-3", time: "Lunch", meal: "Dal, rice, sabji, salad, curd", quantity: "1 large thali", notes: "Add ghee within digestion comfort." },
      { id: "wg-4", time: "Evening", meal: "Peanut chikki / nuts + fruit", quantity: "1 serving", notes: "Carry to work." },
      { id: "wg-5", time: "Dinner", meal: "Paneer/tofu + roti + vegetables", quantity: "1 plate", notes: "Protein first." },
      { id: "wg-6", time: "Bedtime", meal: "Milk / soy milk", quantity: "1 cup", notes: "Use if tolerated." },
    ],
  },
  {
    title: "Jain plan",
    note: "Jain-friendly protein, controlled portions and practical office snacks.",
    tone: "bg-[#fff8dc] text-[#8a6500]",
    meals: [
      { id: "jain-1", time: "Breakfast", meal: "Besan chilla / dhokla + curd", quantity: "1 plate", notes: "Avoid excess chutney." },
      { id: "jain-2", time: "Mid-meal", meal: "Fruit / roasted makhana", quantity: "1 serving", notes: "Seasonal fruit." },
      { id: "jain-3", time: "Lunch", meal: "2 rotli, dal, Jain sabji, salad", quantity: "1 thali", notes: "Protein portion fixed." },
      { id: "jain-4", time: "Evening", meal: "Buttermilk + roasted chana", quantity: "1 serving", notes: "No farsan daily." },
      { id: "jain-5", time: "Dinner", meal: "Moong dal khichdi / paneer sabji", quantity: "1 plate", notes: "Early dinner." },
    ],
  },
  {
    title: "PCOS/thyroid support",
    note: "Protein-first meals, fiber, steady timings and low-sugar swaps.",
    tone: "bg-[#f5eeff] text-[#6d3fa0]",
    meals: [
      { id: "pcos-1", time: "Breakfast", meal: "Moong chilla + curd", quantity: "2 pieces", notes: "No sweet tea." },
      { id: "pcos-2", time: "Mid-meal", meal: "Nuts / seeds + fruit", quantity: "1 small bowl", notes: "Keep portion measured." },
      { id: "pcos-3", time: "Lunch", meal: "Salad, dal, sabji, 2 rotli", quantity: "1 thali", notes: "Avoid refined flour." },
      { id: "pcos-4", time: "Evening", meal: "Sprouts / protein snack", quantity: "1 bowl", notes: "Walk after snack if possible." },
      { id: "pcos-5", time: "Dinner", meal: "Soup + paneer/tofu + vegetables", quantity: "1 plate", notes: "Light dinner." },
    ],
  },
  {
    title: "High protein office",
    note: "Office-friendly portable meals with simple protein anchors.",
    tone: "bg-[#eaf9f2] text-[#087766]",
    meals: [
      { id: "office-1", time: "Breakfast", meal: "Overnight oats / paneer wrap", quantity: "1 serving", notes: "Prepare previous night." },
      { id: "office-2", time: "Office snack", meal: "Greek curd / sprouts / roasted chana", quantity: "1 box", notes: "Carry from home." },
      { id: "office-3", time: "Lunch", meal: "Home thali with extra dal/paneer", quantity: "1 box", notes: "Limit fried items." },
      { id: "office-4", time: "Evening", meal: "Tea + protein snack", quantity: "1 serving", notes: "No biscuits daily." },
      { id: "office-5", time: "Dinner", meal: "Protein + sabji + controlled carbs", quantity: "1 plate", notes: "Finish early." },
    ],
  },
];

const goalOptions = ["Fat loss", "Muscle gain", "Weight gain", "Diabetes control", "PCOS/thyroid care", "Maintenance"];
const foodPreferenceOptions = ["Gujarati vegetarian", "Vegetarian", "Jain", "Eggitarian", "Non-vegetarian", "Vegan", "Diabetic-friendly"];
const activityOptions = ["Desk work", "Light walking", "Moderate walking", "Gym 3-4 days", "Heavy training", "Shift work"];
const genderOptions = ["Male", "Female", "Other"];
const packageOptions = ["Trial consultation", "4 week plan", "8 week plan", "12 week transformation", "Maintenance plan"];
const conditionOptions = ["No known medical condition", "Diabetes", "Thyroid", "BP", "PCOS", "Cholesterol", "Anemia", "Vitamin deficiency", "Uric acid", "Liver support", "Kidney support", "Inflammation", "Acidity", "Joint pain"];
const allergyOptions = ["None", "Milk", "Gluten", "Peanuts", "Soy", "Egg", "Seafood"];
const quickNoteOptions = ["Diet followed well", "Low water intake", "Outside food this week", "Workout missed", "Craving at night", "Weight improving", "Needs stricter portions"];
const intakePresets = [
  {
    label: "Fat loss office",
    patch: {
      activityLevel: "Desk work",
      foodPreference: "Gujarati vegetarian",
      goal: "Fat loss with muscle maintenance",
      packageName: "12 week transformation",
      status: "Active" as const,
      targetFat: "18",
    },
  },
  {
    label: "Muscle gain",
    patch: {
      activityLevel: "Gym 3-4 days",
      foodPreference: "Vegetarian",
      goal: "Muscle gain",
      packageName: "8 week plan",
      status: "Active" as const,
    },
  },
  {
    label: "Diabetes care",
    patch: {
      activityLevel: "Light walking",
      conditions: "Diabetes",
      foodPreference: "Diabetic-friendly",
      goal: "Diabetes control",
      packageName: "Maintenance plan",
      status: "Active" as const,
    },
  },
];

const starterClients: NutritionClient[] = [
  {
    id: "client-demo-1",
    activityLevel: "Moderate walking, desk work",
    age: "24",
    allergies: "None",
    conditions: "No known medical condition",
    foodPreference: "Gujarati vegetarian",
    gender: "Male",
    height: "168",
    name: "Yogesh",
    phone: "9825344428",
    goal: "Fat loss with muscle maintenance",
    packageName: "12 week transformation",
    paymentStatus: "Paid",
    status: "Active",
    targetWeight: "72",
    targetFat: "18",
    followUpDate: "",
    notes: "Prefers Gujarati diet, office routine.",
    bodyEntries: [
      { id: "body-1", date: "2026-07-01", weight: "78.2", bmi: "27.1", bodyFat: "28.4", muscleMass: "32.2", visceralFat: "11", bmr: "1620", notes: "Initial scan" },
      { id: "body-2", date: "2026-07-12", weight: "76.8", bmi: "26.5", bodyFat: "27.2", muscleMass: "32.8", visceralFat: "10", bmr: "1640", notes: "Improving" },
    ],
    dietPlans: [],
    shareLogs: [],
  },
];

const emptyCustomTemplates: CustomTemplate[] = [];

const emptyEntry = (): BodyEntry => ({
  id: `body-${Date.now()}`,
  date: new Date().toISOString().slice(0, 10),
  weight: "",
  bmi: "",
  bodyFat: "",
  muscleMass: "",
  visceralFat: "",
  bmr: "",
  notes: "",
});

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

function numberFromText(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function metricName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function conditionFromMarker(name: string) {
  const metric = metricName(name);
  if (/(hba1c|glucose|sugar|insulin)/.test(metric)) return "Diabetes";
  if (/(tsh|freet3|freet4|thyroid|^t3$|^t4$)/.test(metric)) return "Thyroid";
  if (/(cholesterol|ldl|hdl|triglycerides|vldl|lipid)/.test(metric)) return "Cholesterol";
  if (/(hemoglobin|haemoglobin|ferritin|iron|rbc|mcv|mch|mchc)/.test(metric)) return "Anemia";
  if (/(vitamind|vitaminb12|folate|calcium)/.test(metric)) return "Vitamin deficiency";
  if (/uricacid/.test(metric)) return "Uric acid";
  if (/(sgpt|sgot|alt|ast|bilirubin|alkalinephosphatase|albumin)/.test(metric)) return "Liver support";
  if (/(creatinine|urea|bloodureanitrogen|bun|egfr)/.test(metric)) return "Kidney support";
  if (/(crp|esr)/.test(metric)) return "Inflammation";
  if (/(bodyfat|visceralfat|bmi)/.test(metric)) return "Body composition";
  return "";
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function compactDate(value: string) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(parsed);
}

function trendPath(values: number[]) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 168 : 16 + (index / (values.length - 1)) * 304;
      const y = 120 - ((value - min) / spread) * 82;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function metricLabel(key: string) {
  const labels: Record<string, string> = {
    bmi: "BMI",
    bodyFat: "Body fat",
    muscleMass: "Muscle mass",
    weight: "Weight",
  };
  return labels[key] ?? key;
}

function fileSafeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "diet-plan";
}

function wrapText(text: string, maxChars: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function toggleCsvValue(current: string, value: string) {
  if (value === "None" || value === "No known medical condition") return value;
  const values = current
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && item !== "None" && item !== "No known medical condition");
  const exists = values.includes(value);
  return exists ? values.filter((item) => item !== value).join(", ") : [...values, value].join(", ");
}

function normalizeClient(client: Partial<NutritionClient>): NutritionClient {
  return {
    id: client.id || nextId("nutrition-client"),
    activityLevel: client.activityLevel || "",
    age: client.age || "",
    allergies: client.allergies || "",
    bodyEntries: Array.isArray(client.bodyEntries) ? client.bodyEntries : [],
    conditions: client.conditions || "",
    dietPlans: Array.isArray(client.dietPlans) ? client.dietPlans : [],
    followUpDate: client.followUpDate || "",
    foodPreference: client.foodPreference || "",
    gender: client.gender || "",
    goal: client.goal || "Body composition improvement",
    height: client.height || "",
    name: client.name || "Client",
    notes: client.notes || "",
    packageName: client.packageName || "",
    paymentStatus: client.paymentStatus || "Trial",
    phone: client.phone || "",
    shareLogs: Array.isArray(client.shareLogs) ? client.shareLogs : [],
    status: client.status || "New",
    targetFat: client.targetFat || "",
    targetWeight: client.targetWeight || "",
  };
}

function normalizeTemplate(template: Partial<CustomTemplate>): CustomTemplate {
  const now = new Date().toISOString();
  return {
    id: template.id || nextId("template"),
    createdAt: template.createdAt || now,
    meals: Array.isArray(template.meals) ? template.meals : [],
    note: template.note || "",
    title: template.title || "Custom template",
    updatedAt: template.updatedAt || now,
  };
}

export function NutritionWorkspace({ section = "dashboard" }: { section?: NutritionSection }) {
  const router = useRouter();
  const { familyMembers, reports } = useAppData();
  const { isConfigLoading, isConfigured, status } = useAuth();
  const [store, setStore] = useState<NutritionStore>({ clients: starterClients, customTemplates: emptyCustomTemplates, selectedClientId: starterClients[0]?.id ?? "" });
  const [isLoaded, setIsLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [clientForm, setClientForm] = useState({ goal: "", name: "", phone: "" });
  const [entryForm, setEntryForm] = useState<BodyEntry>(emptyEntry);
  const [planSummary, setPlanSummary] = useState("High protein, controlled carbs, daily walk, and weekly body composition review.");
  const [planLanguage, setPlanLanguage] = useState<DietPlan["language"]>("English");
  const [mealRows, setMealRows] = useState<MealSlot[]>(mealTemplate);
  const [pdfMessage, setPdfMessage] = useState("");
  const [pdfSettings, setPdfSettings] = useState<PdfSettings>({
    clinicName: "MediVault Nutrition",
    footerNote: "This plan is prepared for nutrition coaching and should be adjusted if medical symptoms, allergies, pregnancy, or doctor restrictions apply.",
    includeBodyMetrics: true,
    nutritionistName: "",
    title: "Personalized Diet Plan",
  });

  useEffect(() => {
    if (isConfigured && status === "unauthenticated") {
      const nextPath = sectionRoutes.find((item) => item.key === section)?.href ?? "/nutrition";
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [isConfigured, router, section, status]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as NutritionStore;
        if (Array.isArray(parsed.clients)) {
          const clients = parsed.clients.map(normalizeClient);
          const customTemplates = Array.isArray(parsed.customTemplates) ? parsed.customTemplates.map(normalizeTemplate) : [];
          setStore({ clients, customTemplates, selectedClientId: parsed.selectedClientId || clients[0]?.id || "" });
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(store));
  }, [isLoaded, store]);

  if (isConfigLoading) return <SessionLoading />;
  if (!isConfigured && process.env.NODE_ENV === "production") return <AuthSetupRequired surface="nutrition dashboard" />;
  if (isConfigured && (status === "loading" || status === "unauthenticated")) return <SessionLoading />;

  const selectedClient = store.clients.find((client) => client.id === store.selectedClientId) ?? store.clients[0] ?? null;
  const selectedPhone = normalizePhone(selectedClient?.phone ?? "");
  const linkedMembers = familyMembers.filter((member) => normalizePhone(member.phone ?? "") === selectedPhone && selectedPhone.length >= 8);
  const linkedReports = reports.filter((report) => linkedMembers.some((member) => member.id === report.memberId));
  const linkedBodyPoints = linkedReports.flatMap((report) =>
    report.markers
      .filter((marker) => ["weight", "bmi", "bodyfat", "musclemass", "skeletalmuscle", "visceralfat", "basalmetabolicrate"].includes(metricName(marker.name)))
      .map((marker) => ({
        date: report.date,
        name: marker.name,
        source: "Client app",
        value: numberFromText(marker.value),
      }))
      .filter((point): point is { date: string; name: string; source: string; value: number } => typeof point.value === "number" && Number.isFinite(point.value)),
  );
  const autoMedicalTags = Array.from(
    linkedReports
      .flatMap((report) =>
        report.markers.flatMap((marker) => {
          const condition = conditionFromMarker(marker.name);
          if (!condition || condition === "Body composition" || marker.status === "Normal") return [];
          return [{
            condition,
            date: report.date,
            markerName: marker.name,
            status: marker.status,
            value: marker.value,
          }];
        }),
      )
      .reduce((map, tag) => {
        const current = map.get(tag.condition);
        if (!current || Date.parse(tag.date) >= Date.parse(current.date)) map.set(tag.condition, tag);
        return map;
      }, new Map<string, { condition: string; date: string; markerName: string; status: string; value: string }>())
      .values(),
  );
  const latestLinkedBodyDate = linkedBodyPoints.reduce((latest, point) => (!latest || Date.parse(point.date) > Date.parse(latest) ? point.date : latest), "");
  const linkedBodySnapshot = linkedBodyPoints
    .filter((point) => point.date === latestLinkedBodyDate)
    .reduce((snapshot, point) => {
      const metric = metricName(point.name);
      if (metric === "weight") snapshot.weight = String(point.value);
      if (metric === "bmi") snapshot.bmi = String(point.value);
      if (metric === "bodyfat") snapshot.bodyFat = String(point.value);
      if (metric === "musclemass" || metric === "skeletalmuscle") snapshot.muscleMass = String(point.value);
      if (metric === "visceralfat") snapshot.visceralFat = String(point.value);
      if (metric === "basalmetabolicrate") snapshot.bmr = String(point.value);
      return snapshot;
    }, { bmr: "", bmi: "", bodyFat: "", muscleMass: "", visceralFat: "", weight: "" });

  const clientsFiltered = store.clients.filter((client) => {
    const needle = query.trim().toLowerCase();
    return !needle || `${client.name} ${client.phone} ${client.goal} ${client.status}`.toLowerCase().includes(needle);
  });
  const activeClients = store.clients.filter((client) => client.status === "Active").length;
  const followUps = store.clients.filter((client) => client.status === "Follow-up" || (client.followUpDate && client.followUpDate <= new Date().toISOString().slice(0, 10))).length;
  const latestEntry = selectedClient?.bodyEntries.at(-1);
  const selectedPlan = selectedClient?.dietPlans[0] ?? null;
  const copy = sectionCopy[section];
  const showOverview = section === "dashboard";
  const showClientDirectory = section === "dashboard" || section === "clients";
  const showClientContext = section !== "templates";
  const showBodyComposition = section === "dashboard" || section === "body-composition";
  const showDietBuilder = section === "dashboard" || section === "diet-builder";
  const showFollowUps = section === "follow-ups";
  const showTemplates = section === "templates";
  const dueClients = store.clients.filter((client) => client.status === "Follow-up" || (client.followUpDate && client.followUpDate <= new Date().toISOString().slice(0, 10)));

  function updateSelectedClient(patch: Partial<NutritionClient>) {
    if (!selectedClient) return;
    setStore((current) => ({
      ...current,
      clients: current.clients.map((client) => (client.id === selectedClient.id ? { ...client, ...patch } : client)),
    }));
  }

  function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = clientForm.name.trim();
    const phone = clientForm.phone.trim();
    if (!name || normalizePhone(phone).length < 8) return;
    const nextClient: NutritionClient = {
      id: nextId("nutrition-client"),
      activityLevel: "",
      age: "",
      allergies: "",
      conditions: "",
      foodPreference: "",
      gender: "",
      height: "",
      name,
      phone,
      goal: clientForm.goal.trim() || "Body composition improvement",
      packageName: "",
      paymentStatus: "Trial",
      status: "New",
      targetWeight: "",
      targetFat: "",
      followUpDate: "",
      notes: "",
      bodyEntries: [],
      dietPlans: [],
      shareLogs: [],
    };
    setStore((current) => ({ ...current, clients: [nextClient, ...current.clients], selectedClientId: nextClient.id }));
    setClientForm({ goal: "", name: "", phone: "" });
  }

  function addBodyEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient) return;
    const nextEntry = { ...entryForm, id: nextId("body") };
    updateSelectedClient({ bodyEntries: [...selectedClient.bodyEntries, nextEntry] });
    setEntryForm(emptyEntry());
  }

  function updateMeal(id: string, patch: Partial<MealSlot>) {
    setMealRows((current) => current.map((meal) => (meal.id === id ? { ...meal, ...patch } : meal)));
  }

  function saveDietPlan() {
    if (!selectedClient) return;
    const nextPlan: DietPlan = {
      id: nextId("diet-plan"),
      createdAt: new Date().toISOString(),
      goal: selectedClient.goal,
      language: planLanguage,
      meals: mealRows,
      summary: planSummary,
    };
    updateSelectedClient({ dietPlans: [nextPlan, ...selectedClient.dietPlans], status: "Active" });
  }

  function whatsappText(plan: DietPlan | null) {
    if (!selectedClient || !plan) return "";
    const meals = plan.meals.map((meal) => `${meal.time}: ${meal.meal} (${meal.quantity})${meal.notes ? ` - ${meal.notes}` : ""}`).join("\n");
    return [
      `Hello ${selectedClient.name},`,
      `Your diet plan for ${plan.goal}:`,
      "",
      meals,
      "",
      `Notes: ${plan.summary}`,
      "",
      "Please follow this until your next follow-up.",
    ].join("\n");
  }

  const whatsappUrl = selectedClient && selectedPlan
    ? `https://wa.me/91${normalizePhone(selectedClient.phone)}?text=${encodeURIComponent(whatsappText(selectedPlan))}`
    : "";

  function shareLatestPlan() {
    if (!selectedClient || !selectedPlan || !whatsappUrl) return;
    const nextLog: ShareLog = {
      id: nextId("share"),
      channel: "WhatsApp",
      createdAt: new Date().toISOString(),
      planId: selectedPlan.id,
      summary: selectedPlan.summary,
    };
    updateSelectedClient({ shareLogs: [nextLog, ...selectedClient.shareLogs] });
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  function applyTemplate(template: (typeof planTemplates)[number]) {
    setMealRows(template.meals.map((meal) => ({ ...meal, id: nextId("meal") })));
    setPlanSummary(template.note);
    router.push("/nutrition/diet-builder");
  }

  function applyCustomTemplate(template: CustomTemplate) {
    setMealRows(template.meals.map((meal) => ({ ...meal, id: nextId("meal") })));
    setPlanSummary(template.note);
    router.push("/nutrition/diet-builder");
  }

  function saveCurrentAsTemplate() {
    const title = window.prompt("Template name", selectedClient ? `${selectedClient.goal} template` : "Custom diet template");
    if (!title?.trim()) return;
    const now = new Date().toISOString();
    const nextTemplate: CustomTemplate = {
      id: nextId("template"),
      createdAt: now,
      meals: mealRows.map((meal) => ({ ...meal, id: nextId("meal") })),
      note: planSummary,
      title: title.trim(),
      updatedAt: now,
    };
    setStore((current) => ({ ...current, customTemplates: [nextTemplate, ...current.customTemplates] }));
  }

  function updateCustomTemplate(templateId: string, patch: Partial<Pick<CustomTemplate, "meals" | "note" | "title">>) {
    setStore((current) => ({
      ...current,
      customTemplates: current.customTemplates.map((template) =>
        template.id === templateId ? { ...template, ...patch, updatedAt: new Date().toISOString() } : template,
      ),
    }));
  }

  function saveBuilderIntoTemplate(templateId: string) {
    updateCustomTemplate(templateId, {
      meals: mealRows.map((meal) => ({ ...meal, id: nextId("meal") })),
      note: planSummary,
    });
  }

  function deleteCustomTemplate(templateId: string) {
    setStore((current) => ({ ...current, customTemplates: current.customTemplates.filter((template) => template.id !== templateId) }));
  }

  async function downloadDietPdf() {
    if (!selectedClient) return;
    setPdfMessage("Creating PDF...");
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const accent = rgb(0.04, 0.49, 0.43);
    const dark = rgb(0.06, 0.14, 0.14);
    const muted = rgb(0.38, 0.45, 0.43);
    const light = rgb(0.93, 0.97, 0.95);
    const border = rgb(0.82, 0.9, 0.87);
    const draftPlan: DietPlan = selectedPlan ?? {
      id: "draft",
      createdAt: new Date().toISOString(),
      goal: selectedClient.goal,
      language: planLanguage,
      meals: mealRows,
      summary: planSummary,
    };

    let page = pdf.addPage([595, 842]);
    let y = 790;
    const margin = 42;
    const pageWidth = page.getWidth();

    function addPageIfNeeded(nextHeight = 52) {
      if (y - nextHeight > 48) return;
      page = pdf.addPage([595, 842]);
      y = 790;
    }

    function text(value: string, x: number, size = 10, font = regular, color = dark) {
      page.drawText(value, { x, y, size, font, color });
    }

    function labelValue(label: string, value: string, x: number, width: number) {
      page.drawRectangle({ x, y: y - 34, width, height: 44, color: light, borderColor: border, borderWidth: 0.8 });
      page.drawText(label.toUpperCase(), { x: x + 10, y: y - 4, size: 7, font: bold, color: muted });
      page.drawText(value || "--", { x: x + 10, y: y - 22, size: 11, font: bold, color: dark });
    }

    page.drawRectangle({ x: 0, y: 770, width: pageWidth, height: 72, color: rgb(0.03, 0.25, 0.21) });
    page.drawText(pdfSettings.clinicName || "MediVault Nutrition", { x: margin, y: 812, size: 12, font: bold, color: rgb(0.55, 0.96, 0.87) });
    page.drawText(pdfSettings.title || "Personalized Diet Plan", { x: margin, y: 786, size: 24, font: bold, color: rgb(1, 1, 1) });
    page.drawText(`Prepared for ${selectedClient.name}`, { x: margin, y: 764, size: 11, font: regular, color: rgb(0.82, 0.92, 0.89) });
    y = 728;

    labelValue("Client", selectedClient.name, margin, 150);
    labelValue("Mobile", selectedClient.phone, margin + 162, 128);
    labelValue("Goal", selectedClient.goal, margin + 302, 208);
    y -= 64;
    labelValue("Preference", selectedClient.foodPreference || "Not set", margin, 150);
    labelValue("Conditions", selectedClient.conditions || "None noted", margin + 162, 170);
    labelValue("Allergies", selectedClient.allergies || "None noted", margin + 344, 166);
    y -= 72;

    if (pdfSettings.includeBodyMetrics) {
      page.drawText("Body composition snapshot", { x: margin, y, size: 14, font: bold, color: dark });
      y -= 24;
      labelValue("Weight", latestWeight ? `${latestWeight} kg` : "--", margin, 108);
      labelValue("BMI", calculatedBmi ? calculatedBmi.toFixed(1) : "--", margin + 120, 82);
      labelValue("Body fat", latestBodyFat ? `${latestBodyFat} %` : "--", margin + 214, 92);
      labelValue("Muscle", latestMuscleMass ? `${latestMuscleMass} kg` : "--", margin + 318, 92);
      labelValue("Protein target", estimatedProtein ? `${estimatedProtein} g/day` : "--", margin + 422, 88);
      y -= 74;
    }

    page.drawText("Meal plan", { x: margin, y, size: 15, font: bold, color: dark });
    page.drawText(`Language: ${draftPlan.language}`, { x: pageWidth - 150, y: y + 2, size: 9, font: bold, color: accent });
    y -= 24;

    draftPlan.meals.forEach((meal, index) => {
      const notes = meal.notes ? ` - ${meal.notes}` : "";
      const lines = wrapText(`${meal.meal} (${meal.quantity})${notes}`, 72);
      const rowHeight = Math.max(44, 22 + lines.length * 12);
      addPageIfNeeded(rowHeight + 10);
      page.drawRectangle({ x: margin, y: y - rowHeight + 8, width: pageWidth - margin * 2, height: rowHeight, color: index % 2 ? rgb(1, 1, 1) : light, borderColor: border, borderWidth: 0.6 });
      page.drawText(meal.time || "Meal", { x: margin + 10, y: y - 12, size: 10, font: bold, color: accent });
      lines.forEach((line, lineIndex) => {
        page.drawText(line, { x: margin + 132, y: y - 12 - lineIndex * 12, size: 10, font: regular, color: dark });
      });
      y -= rowHeight + 8;
    });

    addPageIfNeeded(110);
    page.drawText("Instructions", { x: margin, y, size: 14, font: bold, color: dark });
    y -= 18;
    wrapText(draftPlan.summary, 92).forEach((line) => {
      text(line, margin, 10, regular, dark);
      y -= 14;
    });
    y -= 10;
    if (pdfSettings.nutritionistName) {
      page.drawText(`Nutritionist: ${pdfSettings.nutritionistName}`, { x: margin, y, size: 10, font: bold, color: accent });
      y -= 16;
    }
    wrapText(pdfSettings.footerNote, 92).forEach((line) => {
      text(line, margin, 8, regular, muted);
      y -= 11;
    });

    const bytes = await pdf.save();
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileSafeName(selectedClient.name)}-${fileSafeName(draftPlan.goal)}-diet-plan.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setPdfMessage("PDF download started.");
  }

  function metricSeries(metricKey: keyof Pick<BodyEntry, "weight" | "bmi" | "bodyFat" | "muscleMass">) {
    const bodyEntryPoints = selectedClient?.bodyEntries
      .map((entry) => ({ date: entry.date, source: "Dashboard", value: numberFromText(String(entry[metricKey] ?? "")) }))
      .filter((point): point is { date: string; source: string; value: number } => typeof point.value === "number" && Number.isFinite(point.value)) ?? [];
    const linkedNames: Record<typeof metricKey, string[]> = {
      bmi: ["bmi"],
      bodyFat: ["bodyfat"],
      muscleMass: ["musclemass", "skeletalmuscle"],
      weight: ["weight"],
    };
    const linked = linkedBodyPoints
      .filter((point) => linkedNames[metricKey].includes(metricName(point.name)))
      .map((point) => ({ date: point.date, source: point.source, value: point.value }));
    return [...bodyEntryPoints, ...linked].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  }

  const graphMetrics = (["weight", "bmi", "bodyFat", "muscleMass"] as const).map((key) => {
    const points = metricSeries(key);
    const values = points.map((point) => point.value);
    return {
      key,
      label: metricLabel(key),
      latest: points.at(-1),
      path: trendPath(values),
      points,
    };
  });
  const latestMetricValue = (key: "weight" | "bmi" | "bodyFat" | "muscleMass") => graphMetrics.find((metric) => metric.key === key)?.latest?.value ?? null;
  const latestWeight = latestMetricValue("weight") ?? numberFromText(latestEntry?.weight ?? "");
  const latestBmi = latestMetricValue("bmi") ?? numberFromText(latestEntry?.bmi ?? "");
  const latestBodyFat = latestMetricValue("bodyFat") ?? numberFromText(latestEntry?.bodyFat ?? "");
  const latestMuscleMass = latestMetricValue("muscleMass") ?? numberFromText(latestEntry?.muscleMass ?? "");
  const latestBodyRecordDate = graphMetrics.flatMap((metric) => metric.latest ? [metric.latest.date] : []).sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? latestEntry?.date ?? "";
  const targetWeight = numberFromText(selectedClient?.targetWeight ?? "");
  const heightCm = numberFromText(selectedClient?.height ?? "");
  const calculatedBmi = latestBmi ?? (latestWeight && heightCm ? latestWeight / ((heightCm / 100) ** 2) : null);
  const estimatedCalories = latestWeight ? Math.round(latestWeight * 28) : null;
  const estimatedProtein = latestWeight ? Math.round(latestWeight * 1.6) : null;
  const weightGap = latestWeight && targetWeight ? Number((latestWeight - targetWeight).toFixed(1)) : null;

  return (
    <main className="min-h-screen bg-[#eef5f2] text-[#102323]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-white/20 bg-[#073f35] p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-[236px] lg:border-b-0">
          <Link href="/nutrition" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#16c7a7] text-[#062f2a]">
              <Icon name="trend" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[15px] font-black">MediVault Nutrition</span>
              <span className="text-[11px] font-bold text-white/55">Diet & body composition CRM</span>
            </span>
          </Link>
          <nav className="mt-5 grid grid-cols-2 gap-2 lg:block lg:space-y-1">
            {sectionRoutes.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`flex h-9 items-center rounded-md px-3 text-[12px] font-bold ${section === item.key ? "bg-white text-[#073f35]" : "text-white/76 hover:bg-white/10 hover:text-white"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 rounded-lg border border-white/12 bg-white/8 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8ff4df]">Today</p>
            <p className="mt-1 text-[18px] font-black">{todayLabel()}</p>
            <p className="mt-1 text-[11px] font-semibold text-white/58">{followUps} follow-up items need attention</p>
          </div>
          <Link href="/dashboard" className="mt-3 flex h-9 items-center justify-center rounded-md border border-white/15 text-[11px] font-bold text-white/70 hover:bg-white/10">
            Patient app
          </Link>
        </aside>

        <section className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6">
          <header className="flex flex-col gap-3 border-b border-[#d4e3df] pb-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0a7d6e]">{copy.eyebrow}</p>
              <h1 className="mt-1 text-[28px] font-black tracking-[-0.02em] text-[#102323]">{copy.title}</h1>
              <p className="mt-1 max-w-2xl text-[13px] font-semibold text-[#65716f]">
                {copy.description}
              </p>
            </div>
            <form onSubmit={addClient} className="grid gap-2 rounded-lg border border-[#dce9e5] bg-white p-2 sm:grid-cols-[1fr_0.8fr_1fr_auto]">
              <input value={clientForm.name} onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Client name" />
              <input value={clientForm.phone} onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Mobile number" />
              <input value={clientForm.goal} onChange={(event) => setClientForm((current) => ({ ...current, goal: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Goal" />
              <button className="h-10 rounded-md bg-[#0a7d6e] px-4 text-[12px] font-black text-white">Add client</button>
            </form>
          </header>

          {showOverview ? <div id="dashboard" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Clients", store.clients.length, "Total tracked"],
              ["Active", activeClients, "Currently in plan"],
              ["Follow-ups", followUps, "Due or flagged"],
              ["Linked records", linkedBodyPoints.length, "From client app"],
            ].map(([label, value, caption]) => (
              <section key={label} className="rounded-lg border border-[#dce9e5] bg-white p-4">
                <p className="text-[10px] font-black uppercase text-[#74837f]">{label}</p>
                <p className="mt-2 text-[30px] font-black text-[#102323]">{value}</p>
                <p className="mt-1 text-[11px] font-bold text-[#7b8986]">{caption}</p>
              </section>
            ))}
          </div> : null}

          <div className={`mt-4 grid gap-4 ${showClientDirectory ? "xl:grid-cols-[320px_minmax(0,1fr)]" : ""}`}>
            {showClientDirectory ? <section id="clients" className="rounded-lg border border-[#dce9e5] bg-white">
              <div className="border-b border-[#e7efed] p-4">
                <h2 className="text-[15px] font-black">Clients</h2>
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-3 h-10 w-full rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Search name, mobile, goal" />
              </div>
              <div className="max-h-[720px] divide-y divide-[#e7efed] overflow-y-auto">
                {clientsFiltered.map((client) => (
                  <button key={client.id} onClick={() => setStore((current) => ({ ...current, selectedClientId: client.id }))} className={`w-full p-4 text-left ${selectedClient?.id === client.id ? "bg-[#e8f7f2]" : "hover:bg-[#f8fbfa]"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-black">{client.name}</p>
                      <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-[#087766]">{client.status}</span>
                    </div>
                    <p className="mt-1 text-[12px] font-bold text-[#65716f]">{client.phone}</p>
                    <p className="mt-2 line-clamp-2 text-[12px] text-[#7b8986]">{client.goal}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded bg-[#f1f6f4] px-2 py-1 text-[9px] font-black text-[#52605d]">{client.paymentStatus || "Trial"}</span>
                      {client.packageName ? <span className="rounded bg-[#f1f6f4] px-2 py-1 text-[9px] font-black text-[#52605d]">{client.packageName}</span> : null}
                      {client.followUpDate ? <span className="rounded bg-[#fff8dc] px-2 py-1 text-[9px] font-black text-[#8a6500]">Next {compactDate(client.followUpDate)}</span> : null}
                    </div>
                  </button>
                ))}
              </div>
            </section> : null}

            {selectedClient && showClientContext ? (
              <div className="min-w-0 space-y-4">
                <section className="rounded-lg border border-[#dce9e5] bg-white p-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[24px] font-black">{selectedClient.name}</h2>
                        <span className="rounded-md bg-[#e8f7f2] px-2 py-1 text-[11px] font-black text-[#087766]">{selectedClient.status}</span>
                      </div>
                      <p className="mt-1 text-[13px] font-bold text-[#65716f]">{selectedClient.phone} · {selectedClient.goal}</p>
                      <p className="mt-2 text-[12px] text-[#7b8986]">
                        {linkedMembers.length ? `${linkedMembers.length} client-app profile linked by mobile number.` : "No client-app profile matched yet. Use the same mobile number to reflect body-composition records."}
                      </p>
                    </div>
                    {whatsappUrl ? (
                      <button type="button" onClick={shareLatestPlan} className="inline-flex h-10 items-center justify-center rounded-md bg-[#0a7d6e] px-4 text-[12px] font-black text-white">
                        Share diet on WhatsApp
                      </button>
                    ) : (
                      <span className="inline-flex h-10 items-center justify-center rounded-md border border-[#dce9e5] px-4 text-[12px] font-black text-[#65716f]">Save plan to share</span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="block"><span className="text-[10px] font-black uppercase text-[#74837f]">Target weight</span><input value={selectedClient.targetWeight} onChange={(event) => updateSelectedClient({ targetWeight: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="kg" /></label>
                    <label className="block"><span className="text-[10px] font-black uppercase text-[#74837f]">Target fat</span><input value={selectedClient.targetFat} onChange={(event) => updateSelectedClient({ targetFat: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="%" /></label>
                    <label className="block"><span className="text-[10px] font-black uppercase text-[#74837f]">Follow-up date</span><input type="date" value={selectedClient.followUpDate} onChange={(event) => updateSelectedClient({ followUpDate: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" /></label>
                    <label className="block"><span className="text-[10px] font-black uppercase text-[#74837f]">Status</span><select value={selectedClient.status} onChange={(event) => updateSelectedClient({ status: event.target.value as NutritionClient["status"] })} className="mt-1 h-10 w-full rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold"><option>Active</option><option>New</option><option>Follow-up</option><option>Paused</option></select></label>
                  </div>
                  <div className="mt-3 rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#74837f]">Fast intake</span>
                      {intakePresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => updateSelectedClient(preset.patch)}
                          className="h-8 rounded-md border border-[#b8d4cc] bg-white px-3 text-[11px] font-black text-[#0a7d6e]"
                        >
                          {preset.label}
                        </button>
                      ))}
                      {[7, 14, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => updateSelectedClient({ followUpDate: addDays(days), status: "Follow-up" })}
                          className="h-8 rounded-md bg-[#e8f7f2] px-3 text-[11px] font-black text-[#087766]"
                        >
                          Follow-up {days}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="grid gap-2 rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-3 sm:grid-cols-2 xl:grid-cols-3">
                      <input value={selectedClient.age} onChange={(event) => updateSelectedClient({ age: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Age" />
                      <select value={selectedClient.gender} onChange={(event) => updateSelectedClient({ gender: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                        <option value="">Gender</option>
                        {selectedClient.gender && !genderOptions.includes(selectedClient.gender) ? <option>{selectedClient.gender}</option> : null}
                        {genderOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                      <input value={selectedClient.height} onChange={(event) => updateSelectedClient({ height: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Height cm" />
                      <select value={selectedClient.goal} onChange={(event) => updateSelectedClient({ goal: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                        <option value="">Goal</option>
                        {selectedClient.goal && !goalOptions.includes(selectedClient.goal) ? <option>{selectedClient.goal}</option> : null}
                        {goalOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                      <select value={selectedClient.foodPreference} onChange={(event) => updateSelectedClient({ foodPreference: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                        <option value="">Food preference</option>
                        {selectedClient.foodPreference && !foodPreferenceOptions.includes(selectedClient.foodPreference) ? <option>{selectedClient.foodPreference}</option> : null}
                        {foodPreferenceOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                      <select value={selectedClient.activityLevel} onChange={(event) => updateSelectedClient({ activityLevel: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                        <option value="">Activity level</option>
                        {selectedClient.activityLevel && !activityOptions.includes(selectedClient.activityLevel) ? <option>{selectedClient.activityLevel}</option> : null}
                        {activityOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                      <select value={selectedClient.paymentStatus} onChange={(event) => updateSelectedClient({ paymentStatus: event.target.value as NutritionClient["paymentStatus"] })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                        <option>Trial</option><option>Paid</option><option>Pending</option>
                      </select>
                      <select value={selectedClient.packageName} onChange={(event) => updateSelectedClient({ packageName: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                        <option value="">Package / program</option>
                        {selectedClient.packageName && !packageOptions.includes(selectedClient.packageName) ? <option>{selectedClient.packageName}</option> : null}
                        {packageOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                      <input value={selectedClient.packageName} onChange={(event) => updateSelectedClient({ packageName: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Custom package" />
                      <input value={selectedClient.conditions} onChange={(event) => updateSelectedClient({ conditions: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Medical conditions" />
                      <input value={selectedClient.allergies} onChange={(event) => updateSelectedClient({ allergies: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Allergies" />
                      {autoMedicalTags.length ? (
                        <div className="sm:col-span-2 xl:col-span-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0a7d6e]">Auto from reports</p>
                            <button
                              type="button"
                              onClick={() => {
                                const existing = selectedClient.conditions.split(",").map((item) => item.trim()).filter(Boolean);
                                const merged = Array.from(new Set([...existing.filter((item) => item !== "No known medical condition"), ...autoMedicalTags.map((tag) => tag.condition)]));
                                updateSelectedClient({ conditions: merged.join(", ") });
                              }}
                              className="h-7 rounded-md bg-[#e8f7f2] px-2.5 text-[10px] font-black text-[#087766]"
                            >
                              Apply all
                            </button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {autoMedicalTags.map((tag) => {
                              const isActive = selectedClient.conditions.split(",").map((item) => item.trim()).includes(tag.condition);
                              return (
                                <button
                                  key={`${tag.condition}-${tag.markerName}`}
                                  type="button"
                                  onClick={() => updateSelectedClient({ conditions: toggleCsvValue(selectedClient.conditions, tag.condition) })}
                                  className={`rounded-md px-2.5 py-1.5 text-left text-[10px] font-black ${isActive ? "bg-[#0a7d6e] text-white" : "border border-[#b8d4cc] bg-white text-[#0a7d6e]"}`}
                                  title={`${tag.markerName}: ${tag.value} (${tag.status})`}
                                >
                                  {tag.condition} · {tag.markerName} {tag.status}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : linkedReports.length ? (
                        <div className="rounded-md bg-[#f1f6f4] px-3 py-2 text-[11px] font-bold text-[#65716f] sm:col-span-2 xl:col-span-3">
                          Linked reports found, but no abnormal nutrition tags detected.
                        </div>
                      ) : null}
                      <div className="sm:col-span-2 xl:col-span-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#74837f]">Tap medical tags</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {conditionOptions.map((option) => {
                            const isActive = selectedClient.conditions.split(",").map((item) => item.trim()).includes(option);
                            return (
                              <button key={option} type="button" onClick={() => updateSelectedClient({ conditions: toggleCsvValue(selectedClient.conditions, option) })} className={`h-8 rounded-md px-2.5 text-[10px] font-black ${isActive ? "bg-[#0a7d6e] text-white" : "border border-[#dce9e5] bg-white text-[#52605d]"}`}>
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="sm:col-span-2 xl:col-span-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#74837f]">Tap allergy tags</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {allergyOptions.map((option) => {
                            const isActive = selectedClient.allergies.split(",").map((item) => item.trim()).includes(option);
                            return (
                              <button key={option} type="button" onClick={() => updateSelectedClient({ allergies: toggleCsvValue(selectedClient.allergies, option) })} className={`h-8 rounded-md px-2.5 text-[10px] font-black ${isActive ? "bg-[#0a7d6e] text-white" : "border border-[#dce9e5] bg-white text-[#52605d]"}`}>
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#e2ebe8] bg-[#102323] p-3 text-white">
                      {[
                        ["BMI", calculatedBmi ? calculatedBmi.toFixed(1) : latestEntry?.bmi || "--"],
                        ["Wt gap", weightGap !== null ? `${weightGap} kg` : "--"],
                        ["Body fat", latestBodyFat ? `${latestBodyFat} %` : "--"],
                        ["Muscle", latestMuscleMass ? `${latestMuscleMass} kg` : "--"],
                        ["Calories", estimatedCalories ? `${estimatedCalories}` : "--"],
                        ["Protein", estimatedProtein ? `${estimatedProtein} g` : "--"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-md bg-white/8 p-2">
                          <p className="text-[9px] font-black uppercase text-white/50">{label}</p>
                          <p className="mt-1 text-[18px] font-black">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {showBodyComposition ? <section id="body-composition" className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="rounded-lg border border-[#dce9e5] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[15px] font-black">Body composition progress</h2>
                        <p className="mt-1 text-[11px] font-bold text-[#74837f]">Dashboard entries plus linked patient app scan data.</p>
                      </div>
                      <span className="rounded-md bg-[#f1f6f4] px-2 py-1 text-[11px] font-black text-[#65716f]">{latestBodyRecordDate ? compactDate(latestBodyRecordDate) : "No scan"}</span>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {graphMetrics.map((metric) => (
                        <div key={metric.key} className="rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-black">{metric.label}</p>
                            <p className="text-[12px] font-black text-[#087766]">{metric.latest ? metric.latest.value : "--"}</p>
                          </div>
                          <svg className="mt-2 h-[132px] w-full" viewBox="0 0 336 140" role="img" aria-label={`${metric.label} progress graph`}>
                            <path d="M16 120H320" stroke="#dce9e5" strokeWidth="2" />
                            <path d="M16 78H320" stroke="#e7efed" strokeWidth="1.5" strokeDasharray="5 6" />
                            <path d="M16 38H320" stroke="#e7efed" strokeWidth="1.5" strokeDasharray="5 6" />
                            <path d={metric.path} fill="none" stroke="#0a7d6e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                            {metric.points.map((point, index) => {
                              const values = metric.points.map((item) => item.value);
                              const min = Math.min(...values);
                              const max = Math.max(...values);
                              const spread = max - min || 1;
                              const x = metric.points.length === 1 ? 168 : 16 + (index / (metric.points.length - 1)) * 304;
                              const y = 120 - ((point.value - min) / spread) * 82;
                              return <circle key={`${metric.key}-${index}`} cx={x} cy={y} r="4" fill="#ffffff" stroke={point.source === "Client app" ? "#ec795c" : "#0a7d6e"} strokeWidth="3" />;
                            })}
                          </svg>
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#879590]">
                            <span>{metric.points[0]?.date ?? "--"}</span><span>{metric.points.length} records</span><span>{metric.latest?.date ?? "--"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={addBodyEntry} className="rounded-lg border border-[#dce9e5] bg-white p-4">
                    <h2 className="text-[15px] font-black">Add scan</h2>
                    {latestLinkedBodyDate ? (
                      <div className="mt-3 rounded-lg border border-[#b8d4cc] bg-[#f7fffc] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#0a7d6e]">Linked body scan</p>
                            <p className="mt-1 text-[11px] font-bold text-[#65716f]">From patient app report · {compactDate(latestLinkedBodyDate)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEntryForm((current) => ({
                              ...current,
                              ...linkedBodySnapshot,
                              date: latestLinkedBodyDate,
                              notes: current.notes || "Imported from linked patient app body composition report",
                            }))}
                            className="h-8 rounded-md bg-[#0a7d6e] px-3 text-[10px] font-black text-white"
                          >
                            Import
                          </button>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-black text-[#102323]">
                          <span>Weight: {linkedBodySnapshot.weight || "--"}</span>
                          <span>BMI: {linkedBodySnapshot.bmi || "--"}</span>
                          <span>Fat: {linkedBodySnapshot.bodyFat || "--"}</span>
                          <span>Muscle: {linkedBodySnapshot.muscleMass || "--"}</span>
                          <span>Visceral: {linkedBodySnapshot.visceralFat || "--"}</span>
                          <span>BMR: {linkedBodySnapshot.bmr || "--"}</span>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      <input type="date" value={entryForm.date} onChange={(event) => setEntryForm((current) => ({ ...current, date: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" />
                      <input value={entryForm.weight} onChange={(event) => setEntryForm((current) => ({ ...current, weight: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Weight kg" />
                      <input value={entryForm.bmi} onChange={(event) => setEntryForm((current) => ({ ...current, bmi: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="BMI" />
                      <input value={entryForm.bodyFat} onChange={(event) => setEntryForm((current) => ({ ...current, bodyFat: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Body fat %" />
                      <input value={entryForm.muscleMass} onChange={(event) => setEntryForm((current) => ({ ...current, muscleMass: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Muscle mass kg" />
                      <input value={entryForm.visceralFat} onChange={(event) => setEntryForm((current) => ({ ...current, visceralFat: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Visceral fat" />
                      <input value={entryForm.bmr} onChange={(event) => setEntryForm((current) => ({ ...current, bmr: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="BMR kcal" />
                      <textarea value={entryForm.notes} onChange={(event) => setEntryForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-[72px] rounded-md border border-[#dce9e5] p-3 text-[12px] font-bold sm:col-span-2 xl:col-span-1" placeholder="Scan notes" />
                    </div>
                    <button className="mt-3 h-10 w-full rounded-md bg-[#102323] text-[12px] font-black text-white">Save scan</button>
                  </form>
                </section> : null}

                {showDietBuilder ? <section id="diet-builder" className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="rounded-lg border border-[#dce9e5] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-[15px] font-black">Diet builder</h2>
                        <p className="mt-1 text-[11px] font-bold text-[#74837f]">Dashboard-only plan, shareable by WhatsApp.</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <select
                          value=""
                          onChange={(event) => {
                            const template = planTemplates.find((item) => item.title === event.target.value);
                            if (template) applyTemplate(template);
                          }}
                          className="h-9 rounded-md border border-[#dce9e5] px-3 text-[11px] font-bold"
                          aria-label="Meal template"
                        >
                          <option value="">Meal template</option>
                          {planTemplates.map((template) => <option key={template.title} value={template.title}>{template.title}</option>)}
                        </select>
                        <select value={planLanguage} onChange={(event) => setPlanLanguage(event.target.value as DietPlan["language"])} className="h-9 rounded-md border border-[#dce9e5] px-3 text-[11px] font-bold">
                          <option>English</option><option>Gujarati</option><option>Hindi</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-black text-[#102323]">Quick meal templates</p>
                          <p className="mt-1 text-[11px] font-bold text-[#74837f]">Select a ready schedule, then edit meals, quantity and notes below.</p>
                        </div>
                        <button type="button" onClick={() => setMealRows(mealTemplate.map((meal) => ({ ...meal, id: nextId("meal") })))} className="h-8 rounded-md border border-[#b8d4cc] bg-white px-3 text-[11px] font-black text-[#0a7d6e]">Reset</button>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {planTemplates.slice(0, 8).map((template) => (
                          <button
                            key={template.title}
                            type="button"
                            onClick={() => applyTemplate(template)}
                            className="rounded-md border border-[#dce9e5] bg-white p-3 text-left hover:border-[#0a7d6e]"
                          >
                            <span className={`inline-flex rounded px-2 py-1 text-[9px] font-black ${template.tone}`}>{template.title}</span>
                            <span className="mt-2 block text-[11px] font-bold leading-5 text-[#65716f]">{template.note}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-lg border border-[#e2ebe8]">
                      <div className="hidden grid-cols-[0.7fr_1.2fr_0.8fr_1.2fr] gap-2 bg-[#f7faf9] p-2 text-[10px] font-black uppercase text-[#74837f] md:grid">
                        <span>Time</span><span>Meal</span><span>Quantity</span><span>Notes</span>
                      </div>
                      <div className="divide-y divide-[#e7efed]">
                        {mealRows.map((meal) => (
                          <div key={meal.id} className="grid gap-2 p-2 md:grid-cols-[0.7fr_1.2fr_0.8fr_1.2fr]">
                            <input value={meal.time} onChange={(event) => updateMeal(meal.id, { time: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" />
                            <input value={meal.meal} onChange={(event) => updateMeal(meal.id, { meal: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" />
                            <input value={meal.quantity} onChange={(event) => updateMeal(meal.id, { quantity: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" />
                            <input value={meal.notes} onChange={(event) => updateMeal(meal.id, { notes: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <textarea value={planSummary} onChange={(event) => setPlanSummary(event.target.value)} className="mt-3 min-h-[88px] w-full rounded-md border border-[#dce9e5] p-3 text-[12px] font-bold" placeholder="Plan summary and instructions" />
                    <div className="mt-3 rounded-lg border border-[#dce9e5] bg-[#fbfdfc] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-black text-[#102323]">Custom PDF</p>
                          <p className="mt-1 text-[11px] font-bold text-[#74837f]">Customize the printable diet plan before download.</p>
                        </div>
                        {pdfMessage ? <span className="rounded bg-white px-2 py-1 text-[10px] font-black text-[#087766]">{pdfMessage}</span> : null}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <input value={pdfSettings.title} onChange={(event) => setPdfSettings((current) => ({ ...current, title: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="PDF title" />
                        <input value={pdfSettings.clinicName} onChange={(event) => setPdfSettings((current) => ({ ...current, clinicName: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Clinic / brand name" />
                        <input value={pdfSettings.nutritionistName} onChange={(event) => setPdfSettings((current) => ({ ...current, nutritionistName: event.target.value }))} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Nutritionist name" />
                        <label className="flex h-10 items-center gap-2 rounded-md border border-[#dce9e5] bg-white px-3 text-[12px] font-bold text-[#52605d]">
                          <input type="checkbox" checked={pdfSettings.includeBodyMetrics} onChange={(event) => setPdfSettings((current) => ({ ...current, includeBodyMetrics: event.target.checked }))} />
                          Include body metrics
                        </label>
                        <textarea value={pdfSettings.footerNote} onChange={(event) => setPdfSettings((current) => ({ ...current, footerNote: event.target.value }))} className="min-h-[68px] rounded-md border border-[#dce9e5] p-3 text-[12px] font-bold sm:col-span-2" placeholder="Footer / disclaimer note" />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button type="button" onClick={saveDietPlan} className="h-10 rounded-md bg-[#0a7d6e] px-4 text-[12px] font-black text-white">Save diet plan</button>
                      <button type="button" onClick={downloadDietPdf} className="h-10 rounded-md bg-[#102323] px-4 text-[12px] font-black text-white">Download PDF</button>
                      <button type="button" onClick={saveCurrentAsTemplate} className="h-10 rounded-md border border-[#b8d4cc] px-4 text-[12px] font-black text-[#0a7d6e]">Save as template</button>
                      <button type="button" onClick={() => setMealRows((current) => [...current, { id: nextId("meal"), time: "Custom", meal: "", quantity: "", notes: "" }])} className="h-10 rounded-md border border-[#b8d4cc] px-4 text-[12px] font-black text-[#0a7d6e]">Add meal</button>
                    </div>
                    {store.customTemplates.length ? (
                      <div className="mt-3 rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-3">
                        <p className="text-[12px] font-black text-[#102323]">Saved templates</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          {store.customTemplates.slice(0, 4).map((template) => (
                            <div key={template.id} className="rounded-md border border-[#dce9e5] bg-white p-2">
                              <p className="truncate text-[12px] font-black">{template.title}</p>
                              <p className="mt-1 text-[10px] font-bold text-[#74837f]">{template.meals.length} meals · {compactDate(template.updatedAt)}</p>
                              <div className="mt-2 grid grid-cols-2 gap-1.5">
                                <button type="button" onClick={() => applyCustomTemplate(template)} className="h-8 rounded bg-[#0a7d6e] text-[10px] font-black text-white">Apply</button>
                                <button type="button" onClick={() => saveBuilderIntoTemplate(template.id)} className="h-8 rounded border border-[#b8d4cc] text-[10px] font-black text-[#0a7d6e]">Update</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-[#dce9e5] bg-white p-4">
                    <h2 className="text-[15px] font-black">Client notes</h2>
                    <textarea value={selectedClient.notes} onChange={(event) => updateSelectedClient({ notes: event.target.value })} className="mt-3 min-h-[118px] w-full rounded-md border border-[#dce9e5] p-3 text-[12px] font-bold" placeholder="Private nutritionist notes" />
                    <div className="mt-4 rounded-lg bg-[#f7fbfa] p-3">
                      <p className="text-[12px] font-black">Plan history</p>
                      <div className="mt-2 space-y-2">
                        {selectedClient.dietPlans.length ? selectedClient.dietPlans.slice(0, 4).map((plan) => (
                          <div key={plan.id} className="rounded-md border border-[#e2ebe8] bg-white p-2">
                            <p className="text-[11px] font-black">{compactDate(plan.createdAt)} · {plan.language}</p>
                            <p className="mt-1 line-clamp-2 text-[11px] text-[#65716f]">{plan.summary}</p>
                          </div>
                        )) : <p className="text-[12px] font-bold text-[#74837f]">No saved plans yet.</p>}
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg bg-[#fff] p-3 ring-1 ring-[#e2ebe8]">
                      <p className="text-[12px] font-black">WhatsApp share log</p>
                      <div className="mt-2 space-y-2">
                        {selectedClient.shareLogs.length ? selectedClient.shareLogs.slice(0, 4).map((log) => (
                          <div key={log.id} className="rounded-md border border-[#e2ebe8] bg-[#fbfdfc] p-2">
                            <p className="text-[11px] font-black">{compactDate(log.createdAt)} · {log.channel}</p>
                            <p className="mt-1 line-clamp-2 text-[11px] text-[#65716f]">{log.summary}</p>
                          </div>
                        )) : <p className="text-[12px] font-bold text-[#74837f]">No shared plans yet.</p>}
                      </div>
                    </div>
                  </div>
                </section> : null}

                {showFollowUps ? <section id="follow-ups" className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="rounded-lg border border-[#dce9e5] bg-white">
                    <div className="border-b border-[#e7efed] p-4">
                      <h2 className="text-[15px] font-black">Due follow-ups</h2>
                      <p className="mt-1 text-[11px] font-bold text-[#74837f]">Clients marked follow-up or with due dates till today.</p>
                    </div>
                    <div className="divide-y divide-[#e7efed]">
                      {dueClients.length ? dueClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => setStore((current) => ({ ...current, selectedClientId: client.id }))}
                          className="grid w-full gap-2 p-4 text-left hover:bg-[#f8fbfa] sm:grid-cols-[1fr_auto] sm:items-center"
                        >
                          <span>
                            <span className="block text-[13px] font-black">{client.name}</span>
                            <span className="mt-1 block text-[11px] font-bold text-[#65716f]">{client.goal}</span>
                          </span>
                          <span className="rounded-md bg-[#fff8dc] px-2 py-1 text-[10px] font-black text-[#8a6500]">{client.followUpDate || client.status}</span>
                        </button>
                      )) : <p className="p-5 text-[12px] font-bold text-[#74837f]">No due follow-ups right now.</p>}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#dce9e5] bg-white p-4">
                    <h2 className="text-[15px] font-black">Follow-up notes</h2>
                    <textarea value={selectedClient.notes} onChange={(event) => updateSelectedClient({ notes: event.target.value })} className="mt-3 min-h-[148px] w-full rounded-md border border-[#dce9e5] p-3 text-[12px] font-bold" placeholder="Call summary, adherence, next instruction" />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {quickNoteOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateSelectedClient({ notes: selectedClient.notes ? `${selectedClient.notes}; ${option}` : option })}
                          className="h-8 rounded-md border border-[#dce9e5] bg-[#fbfdfc] px-2.5 text-[10px] font-black text-[#52605d]"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => updateSelectedClient({ status: "Active" })} className="h-10 rounded-md bg-[#0a7d6e] text-[12px] font-black text-white">Mark active</button>
                      <button type="button" onClick={() => updateSelectedClient({ status: "Follow-up" })} className="h-10 rounded-md border border-[#b8d4cc] text-[12px] font-black text-[#0a7d6e]">Keep follow-up</button>
                    </div>
                  </div>
                </section> : null}
              </div>
            ) : showTemplates ? (
              <div className="space-y-4">
                <section className="rounded-lg border border-[#dce9e5] bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-[15px] font-black">Custom templates</h2>
                      <p className="mt-1 text-[11px] font-bold text-[#74837f]">Save from diet builder, edit here, and reuse anytime.</p>
                    </div>
                    <button type="button" onClick={saveCurrentAsTemplate} className="h-10 rounded-md bg-[#102323] px-4 text-[12px] font-black text-white">Create from builder</button>
                  </div>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {store.customTemplates.length ? store.customTemplates.map((template) => (
                      <article key={template.id} className="rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-3">
                        <input value={template.title} onChange={(event) => updateCustomTemplate(template.id, { title: event.target.value })} className="h-10 w-full rounded-md border border-[#dce9e5] bg-white px-3 text-[13px] font-black" placeholder="Template title" />
                        <textarea value={template.note} onChange={(event) => updateCustomTemplate(template.id, { note: event.target.value })} className="mt-2 min-h-[72px] w-full rounded-md border border-[#dce9e5] bg-white p-3 text-[12px] font-bold" placeholder="Template summary" />
                        <div className="mt-2 rounded-md bg-white p-2 text-[11px] font-bold text-[#65716f]">
                          {template.meals.length} meal slots · Updated {compactDate(template.updatedAt)}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <button type="button" onClick={() => applyCustomTemplate(template)} className="h-9 rounded-md bg-[#0a7d6e] text-[11px] font-black text-white">Apply</button>
                          <button type="button" onClick={() => saveBuilderIntoTemplate(template.id)} className="h-9 rounded-md border border-[#b8d4cc] text-[11px] font-black text-[#0a7d6e]">Update</button>
                          <button type="button" onClick={() => deleteCustomTemplate(template.id)} className="h-9 rounded-md border border-[#ffd6ca] text-[11px] font-black text-[#ba563d]">Delete</button>
                        </div>
                      </article>
                    )) : (
                      <div className="rounded-lg border border-dashed border-[#c5d8d3] bg-[#fbfdfc] p-5">
                        <p className="text-[13px] font-black">No custom templates yet.</p>
                        <p className="mt-1 text-[12px] font-bold text-[#74837f]">Go to Diet builder, edit meal rows, then save as template.</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                  {planTemplates.map((template) => (
                    <article key={template.title} className="rounded-lg border border-[#dce9e5] bg-white p-4">
                      <span className={`rounded-md px-2 py-1 text-[10px] font-black ${template.tone}`}>Built-in</span>
                      <h2 className="mt-4 text-[18px] font-black">{template.title}</h2>
                      <p className="mt-2 min-h-[58px] text-[12px] font-semibold leading-5 text-[#65716f]">{template.note}</p>
                      <div className="mt-3 rounded-md bg-[#f7fbfa] p-2 text-[11px] font-bold text-[#65716f]">
                        {template.meals.length} meal slots ready
                      </div>
                      <button type="button" onClick={() => applyTemplate(template)} className="mt-4 h-10 w-full rounded-md border border-[#b8d4cc] text-[12px] font-black text-[#0a7d6e]">
                        Use in diet builder
                      </button>
                    </article>
                  ))}
                </section>
              </div>
            ) : (
              <section className="rounded-lg border border-dashed border-[#c5d8d3] bg-white p-8 text-center">
                <h2 className="text-[18px] font-black">Add your first nutrition client</h2>
                <p className="mt-2 text-[13px] text-[#65716f]">Use name and mobile number to begin tracking body composition and diet plans.</p>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
