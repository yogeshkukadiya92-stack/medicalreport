"use client";

import { useEffect, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import type { LabBooking, LabBookingStatus } from "@/lib/vault-types";

const statuses: Array<{ label: string; value: LabBookingStatus }> = [
  { label: "Confirm", value: "confirmed" },
  { label: "Collected", value: "sample_collected" },
  { label: "Ready", value: "report_ready" },
  { label: "Cancel", value: "cancelled" },
];

function statusClass(status: LabBookingStatus) {
  if (status === "requested") return "bg-[#fff7d8] text-[#8a6500]";
  if (status === "cancelled") return "bg-[#fff0ec] text-[#ba563d]";
  if (status === "report_ready") return "bg-[#eaf9f2] text-[#087766]";
  return "bg-[#eef5ff] text-[#4167a8]";
}

export default function LabBookingsPage() {
  const { isConfigured, session, status } = useAuth();
  const [bookings, setBookings] = useState<LabBooking[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadBookings() {
    if (!isConfigured || status === "loading" || !session?.access_token) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/lab/bookings", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "Bookings could not be loaded.");
        return;
      }
      setBookings(result?.bookings ?? []);
    } catch {
      setError("Bookings could not be loaded. Refresh after sign-in and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [isConfigured, session?.access_token, status]);

  async function updateStatus(booking: LabBooking, nextStatus: LabBookingStatus) {
    if (!session?.access_token) return;
    const previous = booking;
    setBookings((current) => current.map((item) => (item.id === booking.id ? { ...item, status: nextStatus } : item)));
    const response = await fetch(`/api/lab/bookings/${booking.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!response.ok) {
      setBookings((current) => current.map((item) => (item.id === booking.id ? previous : item)));
      setError("Booking status could not be updated.");
    }
  }

  return (
    <LabShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-bold text-[#087766]">Collection and visits</p>
          <h1 className="mt-1 text-[28px] font-black text-[#101c1c]">Bookings</h1>
        </div>
        <button onClick={loadBookings} className="h-10 rounded-lg border border-[#dce9e5] px-4 text-[12px] font-bold text-[#087766]">
          Refresh
        </button>
      </div>

      {error ? <div className="mt-5 rounded-lg border border-[#ffd6ca] bg-[#fff0ec] p-4 text-[13px] font-bold text-[#ba563d]">{error}</div> : null}

      <section className="mt-5 rounded-lg border border-[#e2ebe8] bg-white">
        <div className="grid gap-3 border-b border-[#edf3f1] p-4 md:grid-cols-[1fr_170px_150px_260px]">
          <p className="text-[12px] font-black uppercase text-[#7b8986]">Client</p>
          <p className="text-[12px] font-black uppercase text-[#7b8986]">Schedule</p>
          <p className="text-[12px] font-black uppercase text-[#7b8986]">Status / pay</p>
          <p className="text-[12px] font-black uppercase text-[#7b8986]">Actions</p>
        </div>
        <div className="divide-y divide-[#edf3f1]">
          {bookings.length ? (
            bookings.map((booking) => (
              <div key={booking.id} className="grid gap-3 p-4 md:grid-cols-[1fr_170px_150px_260px] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-black text-[#102323]">{booking.clientName}</p>
                  <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{booking.clientPhone} - {booking.serviceName}</p>
                  <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{booking.collectionType === "home_collection" ? "Home collection" : "Lab visit"}</p>
                  {booking.address ? <p className="mt-2 text-[12px] leading-5 text-[#65716f]">{booking.address}</p> : null}
                </div>
                <div>
                  <p className="text-[13px] font-black text-[#102323]">{booking.preferredDate}</p>
                  <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{booking.preferredTime}</p>
                </div>
                <div>
                  <span className={`w-fit rounded-md px-2 py-1 text-[11px] font-bold capitalize ${statusClass(booking.status)}`}>{booking.status.replace(/_/g, " ")}</span>
                  <p className="mt-2 text-[11px] font-bold text-[#65716f]">
                    {booking.paymentStatus === "paid" ? `Paid ${booking.paymentCurrency || ""} ${booking.paymentAmount ? booking.paymentAmount / 100 : ""}` : "Pay at lab"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((item) => (
                    <button key={item.value} onClick={() => updateStatus(booking, item.value)} disabled={booking.status === item.value} className="h-9 rounded-md border border-[#dce9e5] px-3 text-[11px] font-bold text-[#087766] disabled:opacity-45">
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-5 text-[13px] font-bold text-[#6f7f7c]">{isLoading ? "Loading bookings..." : "No bookings yet."}</div>
          )}
        </div>
      </section>
    </LabShell>
  );
}
