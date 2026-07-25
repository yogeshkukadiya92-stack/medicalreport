const baseUrl = (process.env.MEDIVAULT_BASE_URL || "").replace(/\/$/, "");
const workerToken = process.env.MEDIVAULT_WORKER_TOKEN || "";
const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const ollamaModel = process.env.OLLAMA_MODEL || "qwen3-vl:2b";
const pollIntervalMs = Math.max(2_000, Number(process.env.WORKER_POLL_INTERVAL_MS) || 5_000);
const workerEndpoint = `${baseUrl}/api/body-composition/analysis-worker`;
let stopping = false;

if (!baseUrl || !workerToken) {
  console.error("MEDIVAULT_BASE_URL and MEDIVAULT_WORKER_TOKEN are required.");
  process.exit(1);
}

const requiredNames = [
  "Height", "Weight", "BMI", "PBF", "Skeletal Muscle Mass", "Body Fat Mass",
  "Total Body Water", "Protein", "Minerals", "InBody Score", "Basal Metabolic Rate",
  "Waist-Hip Ratio", "Visceral Fat Level", "Obesity Degree", "Target Weight",
  "Weight Control", "Fat Control", "Muscle Control",
];
const segmentalNames = [
  "Right Arm Lean", "Left Arm Lean", "Trunk Lean", "Right Leg Lean", "Left Leg Lean",
  "Right Arm Fat", "Left Arm Fat", "Trunk Fat", "Right Leg Fat", "Left Leg Fat",
];
const allMetricNames = [...requiredNames, ...segmentalNames];
const metricGroups = Array.from(
  { length: Math.ceil(allMetricNames.length / 4) },
  (_, index) => allMetricNames.slice(index * 4, index * 4 + 4),
);
const responseSchema = {
  type: "object",
  properties: {
    markers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "string" },
          range: { type: "string" },
          status: { type: "string", enum: ["Normal", "High", "Low", "Watch"] },
        },
        required: ["name", "value", "range", "status"],
      },
    },
  },
  required: ["markers"],
};

function sleep(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function extractJson(content) {
  const text = String(content || "").replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Ollama did not return a JSON object.");
  return JSON.parse(text.slice(start, end + 1));
}

async function workerRequest(payload) {
  return fetch(workerEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${workerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function analyzeGroup(job, images, names) {
  const prompt = [
    "Read these pages from a BMI/body composition machine report.",
    "Return only JSON with a markers array.",
    "markers must be an array of {name,value,range,status}.",
    "status must be Normal, High, Low, or Watch.",
    "Extract current main results exactly, including units. Ignore old history rows when a current result is visible.",
    `Extract only these fields when visible: ${names.join(", ")}.`,
    "Never invent a value. Omit unreadable fields.",
  ].join("\n");
  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format: responseSchema,
      messages: [{ role: "user", content: prompt, images }],
      model: ollamaModel,
      options: { num_predict: 2048, temperature: 0 },
      stream: false,
      think: false,
    }),
  });
  if (!response.ok) {
    throw new Error(`Ollama ${response.status}: ${(await response.text()).slice(0, 240)}`);
  }
  const completion = await response.json();
  return extractJson(completion?.message?.content || completion?.message?.thinking);
}

async function analyze(job) {
  const images = (job.imageDataUrls || []).map((url) => url.slice(url.indexOf(",") + 1));
  const parts = [];
  for (const names of metricGroups) {
    parts.push(await analyzeGroup(job, images, names));
  }
  const markers = parts.flatMap((part) => Array.isArray(part.markers) ? part.markers : []);
  const uniqueMarkers = [...new Map(markers.map((marker) => [marker.name, marker])).values()];
  return {
    title: job.title || "BMI & Body Composition",
    category: "Body Composition",
    summary: "Values extracted locally from the uploaded body composition report. Professional verification required.",
    markers: uniqueMarkers,
    aiConfidence: 86,
  };
}

async function runJob(job) {
  try {
    const result = await analyze(job);
    const response = await workerRequest({
      action: "complete",
      id: job.id,
      leaseToken: job.leaseToken,
      result,
    });
    if (!response.ok) throw new Error(`Result upload failed (${response.status}).`);
    console.log(`Completed ${job.id} with ${Array.isArray(result.markers) ? result.markers.length : 0} values.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Local analysis failed.";
    console.error(`Failed ${job.id}: ${message}`);
    await workerRequest({
      action: "fail",
      error: message,
      id: job.id,
      leaseToken: job.leaseToken,
    }).catch(() => null);
  }
}

async function main() {
  console.log(`MediVault local analyzer started with ${ollamaModel}.`);
  while (!stopping) {
    try {
      const response = await workerRequest({ action: "claim" });
      if (response.status === 204) {
        await sleep(pollIntervalMs);
        continue;
      }
      if (!response.ok) {
        throw new Error(`Worker API ${response.status}: ${(await response.text()).slice(0, 200)}`);
      }
      const payload = await response.json();
      if (payload?.job) await runJob(payload.job);
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Worker polling failed.");
      await sleep(Math.max(pollIntervalMs, 10_000));
    }
  }
}

process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });
await main();
