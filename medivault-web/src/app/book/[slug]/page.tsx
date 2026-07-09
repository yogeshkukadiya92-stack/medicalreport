"use client";

import { FormEvent, useEffect, useState } from "react";
import { use } from "react";
import type { LabService } from "@/lib/vault-types";

type PublicLab = {
  address?: string;
  id: string;
  name: string;
  phone?: string;
};

type PaymentConfig = {
  currency: string;
  enabled: boolean;
  keyId: string;
};

const emptyForm = {
  address: "",
  clientName: "",
  clientPhone: "",
  collectionType: "lab_visit",
  notes: "",
  paymentMethod: "pay_at_lab",
  preferredDate: "",
  preferredTime: "",
  serviceId: "",
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  amount: number;
  currency: string;
  description: string;
  handler: (response: RazorpayResponse) => void;
  key: string;
  name: string;
  order_id: string;
  prefill: {
    contact: string;
    name: string;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

export default function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [lab, setLab] = useState<PublicLab | null>(null);
  const [payment, setPayment] = useState<PaymentConfig>({ currency: "INR", enabled: false, keyId: "" });
  const [services, setServices] = useState<LabService[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadBookingPage() {
      try {
        const response = await fetch(`/api/booking/${slug}`);
        const result = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) {
          setError(result?.error ?? "Booking link could not be loaded.");
          return;
        }
        setLab(result?.lab ?? null);
        setPayment(result?.payment ?? { currency: "INR", enabled: false, keyId: "" });
        setServices(result?.services ?? []);
        setForm((current) => ({ ...current, serviceId: result?.services?.[0]?.id ?? "" }));
      } catch {
        if (!cancelled) setError("Booking link could not be loaded. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadBookingPage();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectedService = services.find((service) => service.id === form.serviceId);
  const canPayOnline = Boolean(payment.enabled && selectedService?.price && selectedService.price > 0);

  function loadRazorpayScript() {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function saveBooking(extra: Partial<typeof form> & { razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string } = {}) {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/booking/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...extra }),
      });
      const result = await response.json().catch(() => null);
      setIsSaving(false);
      if (!response.ok) {
        setError(result?.error ?? "Booking could not be submitted.");
        return;
      }
      setMessage(form.paymentMethod === "razorpay" ? "Payment received and booking request sent." : "Booking request sent. Lab team will confirm your slot.");
      setForm((current) => ({
        ...emptyForm,
        serviceId: current.serviceId,
      }));
    } catch {
      setIsSaving(false);
      setError("Booking could not be submitted. Please try again.");
    }
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.paymentMethod !== "razorpay") {
      await saveBooking({ paymentMethod: "pay_at_lab" });
      return;
    }

    if (!canPayOnline) {
      setError("Online payment is available only for priced services.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        setIsSaving(false);
        setError("Payment window could not be loaded. Please try Pay at lab or refresh.");
        return;
      }

      const orderResponse = await fetch(`/api/booking/${slug}/payment-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: form.serviceId }),
      });
      const order = await orderResponse.json().catch(() => null);
      if (!orderResponse.ok) {
        setIsSaving(false);
        setError(order?.error ?? "Payment order could not be created.");
        return;
      }

      const checkout = new window.Razorpay({
        amount: order.amount,
        currency: order.currency,
        description: selectedService?.name ?? "Lab booking",
        handler: async (response) => {
          await saveBooking({
            paymentMethod: "razorpay",
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        key: order.keyId,
        name: lab?.name ?? "MediVault Lab",
        order_id: order.orderId,
        prefill: {
          contact: form.clientPhone,
          name: form.clientName,
        },
      });
      setIsSaving(false);
      checkout.open();
    } catch {
      setIsSaving(false);
      setError("Payment could not be started. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#eef3f1] px-4 py-6 text-[#101c1c]">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-lg border border-[#dce9e5] bg-white p-5">
          <p className="text-[13px] font-bold text-[#087766]">Online lab booking</p>
          <h1 className="mt-2 text-[30px] font-black text-[#102323]">{isLoading ? "Loading lab..." : lab?.name ?? "Lab booking"}</h1>
          <div className="mt-3 grid gap-2 text-[13px] font-bold text-[#65716f] sm:grid-cols-2">
            <p>{lab?.phone || "Phone will be shared by lab"}</p>
            <p>{lab?.address || "Address will be shared after confirmation"}</p>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
          <form onSubmit={submitBooking} className="rounded-lg border border-[#dce9e5] bg-white p-5">
            <h2 className="text-[18px] font-black text-[#102323]">Book sample collection</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[12px] font-bold text-[#52605d]">Full name</span>
                <input required value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" />
              </label>
              <label className="block">
                <span className="text-[12px] font-bold text-[#52605d]">Phone number</span>
                <input required value={form.clientPhone} onChange={(event) => setForm((current) => ({ ...current, clientPhone: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="text-[12px] font-bold text-[#52605d]">Service</span>
              <select value={form.serviceId} onChange={(event) => setForm((current) => ({ ...current, serviceId: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold">
                <option value="">General lab booking</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[12px] font-bold text-[#52605d]">Preferred date</span>
                <input required type="date" value={form.preferredDate} onChange={(event) => setForm((current) => ({ ...current, preferredDate: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" />
              </label>
              <label className="block">
                <span className="text-[12px] font-bold text-[#52605d]">Preferred time</span>
                <input required type="time" value={form.preferredTime} onChange={(event) => setForm((current) => ({ ...current, preferredTime: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" />
              </label>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className={`rounded-lg border p-3 text-[13px] font-bold ${form.collectionType === "lab_visit" ? "border-[#0a7d6e] bg-[#eaf9f2] text-[#087766]" : "border-[#dce9e5] text-[#52605d]"}`}>
                <input type="radio" name="collectionType" value="lab_visit" checked={form.collectionType === "lab_visit"} onChange={(event) => setForm((current) => ({ ...current, collectionType: event.target.value }))} className="mr-2" />
                Visit lab
              </label>
              <label className={`rounded-lg border p-3 text-[13px] font-bold ${form.collectionType === "home_collection" ? "border-[#0a7d6e] bg-[#eaf9f2] text-[#087766]" : "border-[#dce9e5] text-[#52605d]"}`}>
                <input type="radio" name="collectionType" value="home_collection" checked={form.collectionType === "home_collection"} onChange={(event) => setForm((current) => ({ ...current, collectionType: event.target.value }))} className="mr-2" />
                Home collection
              </label>
            </div>
            {form.collectionType === "home_collection" ? (
              <label className="mt-3 block">
                <span className="text-[12px] font-bold text-[#52605d]">Collection address</span>
                <textarea required value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="mt-2 min-h-[86px] w-full rounded-lg border border-[#dce9e5] p-3 text-[13px] font-bold" />
              </label>
            ) : null}
            <label className="mt-3 block">
              <span className="text-[12px] font-bold text-[#52605d]">Notes</span>
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="mt-2 min-h-[76px] w-full rounded-lg border border-[#dce9e5] p-3 text-[13px] font-bold" placeholder="Fasting, prescription, landmark" />
            </label>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className={`rounded-lg border p-3 text-[13px] font-bold ${form.paymentMethod === "pay_at_lab" ? "border-[#0a7d6e] bg-[#eaf9f2] text-[#087766]" : "border-[#dce9e5] text-[#52605d]"}`}>
                <input type="radio" name="paymentMethod" value="pay_at_lab" checked={form.paymentMethod === "pay_at_lab"} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} className="mr-2" />
                Pay at lab
              </label>
              <label className={`rounded-lg border p-3 text-[13px] font-bold ${form.paymentMethod === "razorpay" ? "border-[#0a7d6e] bg-[#eaf9f2] text-[#087766]" : "border-[#dce9e5] text-[#52605d]"}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={form.paymentMethod === "razorpay"}
                  disabled={!canPayOnline}
                  onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                  className="mr-2"
                />
                Pay online
                <span className="mt-1 block text-[11px] text-[#7b8986]">{canPayOnline ? `${payment.currency} ${selectedService?.price}` : "Set service price + Razorpay keys"}</span>
              </label>
            </div>
            {message ? <p className="mt-3 rounded-lg bg-[#eaf9f2] p-3 text-[12px] font-bold text-[#087766]">{message}</p> : null}
            {error ? <p className="mt-3 rounded-lg bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]">{error}</p> : null}
            <button disabled={isSaving || isLoading} className="mt-4 h-12 w-full rounded-lg bg-[#0a7d6e] text-[14px] font-black text-white disabled:opacity-60">
              {isSaving ? "Submitting..." : "Request booking"}
            </button>
          </form>

          <section className="rounded-lg border border-[#dce9e5] bg-white p-5">
            <h2 className="text-[18px] font-black text-[#102323]">Available services</h2>
            <div className="mt-4 space-y-3">
              {services.length ? (
                services.map((service) => (
                  <div key={service.id} className="rounded-lg bg-[#f7fbfa] p-3">
                    <p className="text-[14px] font-black text-[#102323]">{service.name}</p>
                    <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{service.sampleType || "Sample"} - {service.homeCollection ? "Home collection available" : "Lab visit"}</p>
                    <p className="mt-2 text-[13px] font-black text-[#087766]">{service.price ? `Rs. ${service.price}` : "Price at lab"}</p>
                  </div>
                ))
              ) : (
                <p className="text-[13px] font-bold text-[#6f7f7c]">General booking is available.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
