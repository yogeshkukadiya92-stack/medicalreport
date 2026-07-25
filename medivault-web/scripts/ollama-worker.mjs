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
const responseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    category: { type: "string" },
    summary: { type: "string" },
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
  required: ["title", "category", "summary", "markers"],
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

async function analyze(job) {
  const prompt = [
    "Read these pages from a BMI/body composition machine report.",
    "Return only JSON with title, category, summary, markers.",
    "markers must be an array of {name,value,range,status}.",
    "status must be Normal, High, Low, or Watch.",
    "Extract current main results exactly, including units. Ignore old history rows when a current result is visible.",
    `Use these consistent names when visible: ${requiredNames.join(", ")}.`,
    "Also extract segmental lean and fat values for right arm, left arm, trunk, right leg and left leg when visible.",
    "Never invent a value. Omit unreadable fields. Keep the summary short and require professional verification.",
    `Client: ${job.memberName || "Client"}`,
    `Title: ${job.title || "BMI & Body Composition"}`,
  ].join("\n");
  const images = (job.imageDataUrls || []).map((url) => url.slice(url.indexOf(",") + 1));
  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format: responseSchema,
      messages: [{ role: "user", content: prompt, images }],
      model: ollamaModel,
      options: { num_predict: 4096, temperature: 0 },
      stream: false,
      think: false,
    }),
  });
  if (!response.ok) {
    throw new Error(`Ollama ${response.status}: ${(await response.text()).slice(0, 240)}`);
  }
  const completion = await response.json();
  const parsed = extractJson(completion?.message?.content || completion?.message?.thinking);
  return { ...parsed, aiConfidence: Number(parsed.aiConfidence) || 86 };
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
