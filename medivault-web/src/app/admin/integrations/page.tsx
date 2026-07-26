"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
import { AdminEmpty, AdminError, AdminPageHeader, AdminSkeleton, StatusPill } from "@/app/admin/_components/admin-ui";

type ApiKeyRow = {
  active: boolean;
  createdAt: string;
  id: string;
  lastUsedAt?: string;
  name: string;
  scopes: string[];
  tokenPrefix: string;
};

type WebhookRow = {
  active: boolean;
  createdAt: string;
  events: string[];
  failureCount: number;
  id: string;
  lastDeliveryAt?: string;
  lastDeliveryStatus?: number;
  name: string;
  url: string;
};

type DeliveryRow = {
  createdAt: string;
  error?: string;
  event: string;
  id: string;
  status: number;
  success: boolean;
  webhookId: string;
};

type IntegrationPayload = {
  apiKeys: ApiKeyRow[];
  availableEvents: string[];
  availableScopes: string[];
  deliveries: DeliveryRow[];
  webhooks: WebhookRow[];
};

const domainDetails = [
  {
    title: "Lab API",
    description: "Reports, values and publication data.",
    endpoint: "GET /api/integrations/v1/lab/reports",
    scopes: ["lab.read", "lab.write"],
  },
  {
    title: "Nutrition API",
    description: "Client intake and nutrition CRM sync.",
    endpoint: "GET/POST /api/integrations/v1/nutrition/clients",
    scopes: ["nutrition.read", "nutrition.write"],
  },
  {
    title: "Body composition API",
    description: "Verified scans, BMI, fat and muscle values.",
    endpoint: "GET /api/integrations/v1/body-composition/scans",
    scopes: ["body_composition.read", "body_composition.write"],
  },
];

function formatDate(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function AdminIntegrationsPage() {
  const { session, status } = useAuth();
  const [data, setData] = useState<IntegrationPayload | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revealedSecret, setRevealedSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiForm, setApiForm] = useState({ name: "", scopes: ["lab.read"] });
  const [webhookForm, setWebhookForm] = useState({ events: ["lab.report.published"], name: "", url: "" });

  const load = useCallback(async () => {
    if (status === "loading" || !session?.access_token) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/integrations", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Integrations could not be loaded.");
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Integrations could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, status]);

  useEffect(() => { load(); }, [load]);

  async function request(method: string, body?: unknown, query = "") {
    if (!session?.access_token) return null;
    const response = await fetch(`/api/admin/integrations${query}`, {
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      method,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "Integration action failed.");
    setData(result);
    return result;
  }

  async function createApiKey(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");
    setRevealedSecret("");
    try {
      const result = await request("POST", { kind: "api_key", ...apiForm });
      setRevealedSecret(result?.createdToken || "");
      setMessage("API key created. Copy it now; MediVault will not show it again.");
      setApiForm({ name: "", scopes: ["lab.read"] });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "API key could not be created.");
    } finally {
      setIsSaving(false);
    }
  }

  async function createWebhook(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");
    setRevealedSecret("");
    try {
      const result = await request("POST", { kind: "webhook", ...webhookForm });
      setRevealedSecret(result?.createdSecret || "");
      setMessage("Webhook connected. Copy the signing secret now.");
      setWebhookForm({ events: ["lab.report.published"], name: "", url: "" });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Webhook could not be connected.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggle(kind: "api_key" | "webhook", id: string, active: boolean) {
    try {
      await request("PATCH", { active, id, kind });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Integration could not be updated.");
    }
  }

  async function remove(kind: "api_key" | "webhook", id: string) {
    try {
      await request("DELETE", undefined, `?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Integration could not be removed.");
    }
  }

  async function testWebhook(id: string) {
    if (!session?.access_token) return;
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/integrations/test", {
        body: JSON.stringify({ id }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Test delivery failed.");
      setMessage(`Test delivered successfully with HTTP ${result.status}.`);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Test delivery failed.");
      await load();
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Developer platform"
        title="API & Webhooks"
        description="Securely connect external apps to Lab, Nutrition and Body Composition data with scoped API keys and signed event delivery."
        actions={<button type="button" onClick={load} className="h-10 rounded-md border border-[#cdded9] bg-white px-4 text-[11px] font-black text-[#31504a]">Refresh</button>}
      />

      {error ? <div className="mt-4"><AdminError message={error} onRetry={load} /></div> : null}
      {message ? <div className="mt-4 rounded-md border border-[#a8ded2] bg-[#eafaf6] px-4 py-3 text-[11px] font-bold text-[#086757]">{message}</div> : null}
      {revealedSecret ? (
        <div className="mt-3 rounded-md border border-[#d8c887] bg-[#fff8dc] p-4">
          <p className="text-[10px] font-black uppercase text-[#735d00]">Shown once</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 overflow-x-auto rounded bg-white px-3 py-2 text-[11px] font-bold text-[#263b36]">{revealedSecret}</code>
            <button type="button" onClick={() => navigator.clipboard.writeText(revealedSecret)} className="h-9 rounded-md bg-[#173f38] px-4 text-[10px] font-black text-white">Copy secret</button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {domainDetails.map((domain) => (
          <section key={domain.title} className="rounded-md border border-[#dbe6e3] bg-white p-4">
            <p className="text-[12px] font-black text-[#15352f]">{domain.title}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#71817d]">{domain.description}</p>
            <code className="mt-3 block overflow-x-auto rounded bg-[#edf5f3] px-3 py-2 text-[9px] font-bold text-[#31504a]">{domain.endpoint}</code>
            <div className="mt-3 flex flex-wrap gap-1.5">{domain.scopes.map((scope) => <StatusPill key={scope} tone="neutral">{scope}</StatusPill>)}</div>
          </section>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">Create API key</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Give each external app only the permissions it needs.</p></div>
          <form onSubmit={createApiKey} className="space-y-4 p-4">
            <label className="block"><span className="text-[10px] font-black uppercase text-[#667873]">Integration name</span><input required value={apiForm.name} onChange={(event) => setApiForm((current) => ({ ...current, name: event.target.value }))} placeholder="Example: Clinic mobile app" className="mt-1.5 h-10 w-full rounded-md border border-[#d5e2de] px-3 text-[12px] font-bold" /></label>
            <div><p className="text-[10px] font-black uppercase text-[#667873]">Permissions</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{(data?.availableScopes || []).map((scope) => <label key={scope} className="flex min-h-10 items-center gap-2 rounded-md border border-[#dce7e4] px-3 text-[10px] font-bold"><input type="checkbox" checked={apiForm.scopes.includes(scope)} onChange={() => setApiForm((current) => ({ ...current, scopes: toggleValue(current.scopes, scope) }))} />{scope}</label>)}</div></div>
            <button disabled={isSaving} className="h-10 rounded-md bg-[#0b6f61] px-4 text-[11px] font-black text-white disabled:opacity-50">Generate API key</button>
          </form>
        </section>

        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">Connect webhook</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">MediVault signs every JSON delivery with HMAC-SHA256.</p></div>
          <form onSubmit={createWebhook} className="space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="text-[10px] font-black uppercase text-[#667873]">Webhook name</span><input required value={webhookForm.name} onChange={(event) => setWebhookForm((current) => ({ ...current, name: event.target.value }))} placeholder="Example: n8n production" className="mt-1.5 h-10 w-full rounded-md border border-[#d5e2de] px-3 text-[12px] font-bold" /></label>
              <label className="block"><span className="text-[10px] font-black uppercase text-[#667873]">HTTPS endpoint</span><input required type="url" value={webhookForm.url} onChange={(event) => setWebhookForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://example.com/webhook" className="mt-1.5 h-10 w-full rounded-md border border-[#d5e2de] px-3 text-[12px] font-bold" /></label>
            </div>
            <div><p className="text-[10px] font-black uppercase text-[#667873]">Events</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{(data?.availableEvents || []).map((event) => <label key={event} className="flex min-h-10 items-center gap-2 rounded-md border border-[#dce7e4] px-3 text-[10px] font-bold"><input type="checkbox" checked={webhookForm.events.includes(event)} onChange={() => setWebhookForm((current) => ({ ...current, events: toggleValue(current.events, event) }))} />{event}</label>)}</div></div>
            <button disabled={isSaving} className="h-10 rounded-md bg-[#173f38] px-4 text-[11px] font-black text-white disabled:opacity-50">Connect webhook</button>
          </form>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">API keys</h2></div>
          {isLoading && !data ? <AdminSkeleton rows={3} /> : data?.apiKeys.length ? <div className="divide-y divide-[#edf2f1]">{data.apiKeys.map((key) => <div key={key.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[12px] font-black">{key.name}</p><p className="mt-1 font-mono text-[9px] text-[#677974]">{key.tokenPrefix}...</p></div><StatusPill tone={key.active ? "green" : "neutral"}>{key.active ? "Active" : "Disabled"}</StatusPill></div><div className="mt-3 flex flex-wrap gap-1.5">{key.scopes.map((scope) => <StatusPill key={scope} tone="neutral">{scope}</StatusPill>)}</div><p className="mt-3 text-[9px] font-semibold text-[#7a8985]">Last used {formatDate(key.lastUsedAt)}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => toggle("api_key", key.id, !key.active)} className="h-8 rounded border border-[#cfded9] px-3 text-[9px] font-black">{key.active ? "Disable" : "Enable"}</button><button type="button" onClick={() => remove("api_key", key.id)} className="h-8 rounded border border-[#efc6bc] px-3 text-[9px] font-black text-[#b44e38]">Revoke</button></div></div>)}</div> : <AdminEmpty title="No API keys" description="Generate a scoped key for the first external application." />}
        </section>

        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">Connected webhooks</h2></div>
          {isLoading && !data ? <AdminSkeleton rows={3} /> : data?.webhooks.length ? <div className="divide-y divide-[#edf2f1]">{data.webhooks.map((webhook) => <div key={webhook.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[12px] font-black">{webhook.name}</p><p className="mt-1 truncate text-[9px] font-semibold text-[#677974]">{webhook.url}</p></div><StatusPill tone={webhook.active ? "green" : "neutral"}>{webhook.active ? "Live" : "Paused"}</StatusPill></div><div className="mt-3 flex flex-wrap gap-1.5">{webhook.events.map((event) => <StatusPill key={event} tone="neutral">{event}</StatusPill>)}</div><p className="mt-3 text-[9px] font-semibold text-[#7a8985]">Last delivery {formatDate(webhook.lastDeliveryAt)} · HTTP {webhook.lastDeliveryStatus || "--"} · {webhook.failureCount} failures</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => testWebhook(webhook.id)} className="h-8 rounded bg-[#e8f7f3] px-3 text-[9px] font-black text-[#087766]">Send test</button><button type="button" onClick={() => toggle("webhook", webhook.id, !webhook.active)} className="h-8 rounded border border-[#cfded9] px-3 text-[9px] font-black">{webhook.active ? "Pause" : "Resume"}</button><button type="button" onClick={() => remove("webhook", webhook.id)} className="h-8 rounded border border-[#efc6bc] px-3 text-[9px] font-black text-[#b44e38]">Delete</button></div></div>)}</div> : <AdminEmpty title="No webhooks connected" description="Add an HTTPS endpoint to receive signed MediVault events." />}
        </section>
      </div>

      <section className="mt-4 rounded-md border border-[#dbe6e3] bg-white">
        <div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">Recent deliveries</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Latest webhook attempts across every connected dashboard.</p></div>
        {data?.deliveries.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-[#f5f9f8] text-[9px] font-black uppercase text-[#71817d]"><tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">HTTP</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Delivery ID</th></tr></thead><tbody className="divide-y divide-[#edf2f1]">{data.deliveries.map((delivery) => <tr key={delivery.id} className="text-[10px] font-semibold"><td className="px-4 py-3 font-black">{delivery.event}</td><td className="px-4 py-3">{formatDate(delivery.createdAt)}</td><td className="px-4 py-3">{delivery.status || "--"}</td><td className="px-4 py-3"><StatusPill tone={delivery.success ? "green" : "critical"}>{delivery.success ? "Delivered" : "Failed"}</StatusPill>{delivery.error ? <p className="mt-1 max-w-[260px] truncate text-[8px] text-[#b44e38]">{delivery.error}</p> : null}</td><td className="px-4 py-3 font-mono text-[8px]">{delivery.id}</td></tr>)}</tbody></table></div> : <AdminEmpty title="No delivery attempts" description="Webhook test and live event deliveries will be recorded here." />}
      </section>
    </AdminShell>
  );
}
