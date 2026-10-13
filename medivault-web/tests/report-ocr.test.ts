import assert from "node:assert/strict";
import test from "node:test";
import { recognizeReportPages } from "../src/lib/report-ocr";

test("stalled recognition returns on deadline even if cleanup never resolves", async () => {
  let terminated = false;
  const worker = {
    recognize: () => new Promise<never>(() => {}),
    terminate: () => { terminated = true; return new Promise<never>(() => {}); },
  };
  await assert.rejects(recognizeReportPages([Buffer.from("image")], 20, async () => worker), /timed out/);
  assert.equal(terminated, true);
});

test("worker initialized after deadline is terminated without recognizing", async () => {
  let terminated = false;
  let recognized = false;
  let finish: (worker: never) => void = () => {};
  const pending = new Promise<never>((resolve) => { finish = resolve; });
  await assert.rejects(recognizeReportPages([Buffer.from("image")], 20, () => pending), /timed out/);
  finish({
    recognize: async () => { recognized = true; return { data: { text: "unused" } }; },
    terminate: async () => { terminated = true; },
  } as never);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(terminated, true);
  assert.equal(recognized, false);
});
