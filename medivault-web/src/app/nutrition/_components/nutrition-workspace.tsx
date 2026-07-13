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
  selectedClientId: string;
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

export function NutritionWorkspace({ section = "dashboard" }: { section?: NutritionSection }) {
  const router = useRouter();
  const { familyMembers, reports } = useAppData();
  const { isConfigLoading, isConfigured, status } = useAuth();
  const [store, setStore] = useState<NutritionStore>({ clients: starterClients, selectedClientId: starterClients[0]?.id ?? "" });
  const [isLoaded, setIsLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [clientForm, setClientForm] = useState({ goal: "", name: "", phone: "" });
  const [entryForm, setEntryForm] = useState<BodyEntry>(emptyEntry);
  const [planSummary, setPlanSummary] = useState("High protein, controlled carbs, daily walk, and weekly body composition review.");
  const [planLanguage, setPlanLanguage] = useState<DietPlan["language"]>("English");
  const [mealRows, setMealRows] = useState<MealSlot[]>(mealTemplate);

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
          setStore({ clients, selectedClientId: parsed.selectedClientId || clients[0]?.id || "" });
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
    setStore((current) => ({ clients: [nextClient, ...current.clients], selectedClientId: nextClient.id }));
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
  const latestWeight = numberFromText(latestEntry?.weight ?? "");
  const targetWeight = numberFromText(selectedClient?.targetWeight ?? "");
  const heightCm = numberFromText(selectedClient?.height ?? "");
  const calculatedBmi = latestWeight && heightCm ? latestWeight / ((heightCm / 100) ** 2) : null;
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
                  <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="grid gap-2 rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-3 sm:grid-cols-2 xl:grid-cols-3">
                      <input value={selectedClient.age} onChange={(event) => updateSelectedClient({ age: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Age" />
                      <input value={selectedClient.gender} onChange={(event) => updateSelectedClient({ gender: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Gender" />
                      <input value={selectedClient.height} onChange={(event) => updateSelectedClient({ height: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Height cm" />
                      <input value={selectedClient.foodPreference} onChange={(event) => updateSelectedClient({ foodPreference: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Food preference" />
                      <input value={selectedClient.activityLevel} onChange={(event) => updateSelectedClient({ activityLevel: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Activity level" />
                      <select value={selectedClient.paymentStatus} onChange={(event) => updateSelectedClient({ paymentStatus: event.target.value as NutritionClient["paymentStatus"] })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                        <option>Trial</option><option>Paid</option><option>Pending</option>
                      </select>
                      <input value={selectedClient.packageName} onChange={(event) => updateSelectedClient({ packageName: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold sm:col-span-2" placeholder="Package / program" />
                      <input value={selectedClient.conditions} onChange={(event) => updateSelectedClient({ conditions: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Medical conditions" />
                      <input value={selectedClient.allergies} onChange={(event) => updateSelectedClient({ allergies: event.target.value })} className="h-10 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold" placeholder="Allergies" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#e2ebe8] bg-[#102323] p-3 text-white">
                      {[
                        ["BMI", calculatedBmi ? calculatedBmi.toFixed(1) : latestEntry?.bmi || "--"],
                        ["Wt gap", weightGap !== null ? `${weightGap} kg` : "--"],
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
                      <span className="rounded-md bg-[#f1f6f4] px-2 py-1 text-[11px] font-black text-[#65716f]">{latestEntry ? compactDate(latestEntry.date) : "No scan"}</span>
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
                      <select value={planLanguage} onChange={(event) => setPlanLanguage(event.target.value as DietPlan["language"])} className="h-9 rounded-md border border-[#dce9e5] px-3 text-[11px] font-bold">
                        <option>English</option><option>Gujarati</option><option>Hindi</option>
                      </select>
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
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button type="button" onClick={saveDietPlan} className="h-10 rounded-md bg-[#0a7d6e] px-4 text-[12px] font-black text-white">Save diet plan</button>
                      <button type="button" onClick={() => setMealRows((current) => [...current, { id: nextId("meal"), time: "Custom", meal: "", quantity: "", notes: "" }])} className="h-10 rounded-md border border-[#b8d4cc] px-4 text-[12px] font-black text-[#0a7d6e]">Add meal</button>
                    </div>
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
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => updateSelectedClient({ status: "Active" })} className="h-10 rounded-md bg-[#0a7d6e] text-[12px] font-black text-white">Mark active</button>
                      <button type="button" onClick={() => updateSelectedClient({ status: "Follow-up" })} className="h-10 rounded-md border border-[#b8d4cc] text-[12px] font-black text-[#0a7d6e]">Keep follow-up</button>
                    </div>
                  </div>
                </section> : null}
              </div>
            ) : showTemplates ? (
              <section className="grid gap-4 xl:grid-cols-3">
                {planTemplates.map((template) => (
                  <article key={template.title} className="rounded-lg border border-[#dce9e5] bg-white p-4">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-black ${template.tone}`}>Template</span>
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
