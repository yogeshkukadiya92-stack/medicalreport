import Link from "next/link";
import { Icon, MobileShell } from "@/components/mobile-shell";

export default function Upload() {
  return (
    <MobileShell>
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#6f7f7c]">New document</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight text-[#101c1c]">Upload report</h1>
          </div>
          <Link
            href="/dashboard"
            className="grid h-11 w-11 place-items-center rounded-lg border border-[#dce9e5] bg-white text-[#223230]"
            aria-label="Dashboard"
          >
            <Icon name="home" className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-6 rounded-lg border border-dashed border-[#91cfc2] bg-[#f7fbfa] p-5 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-[#e8f7f2] text-[#087766]">
            <Icon name="upload" className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-[18px] font-bold text-[#162523]">Add a medical report</h2>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-5 text-[#65716f]">
            Choose a PDF or photo. OCR and extraction can be connected in the next feature phase.
          </p>
          <button className="mt-5 h-12 w-full rounded-lg bg-[#0a7d6e] text-[14px] font-bold text-white shadow-[0_12px_30px_rgba(10,125,110,0.2)]">
            Select file
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {["PDF reports", "Lab photos", "Doctor prescriptions"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-[#e2ebe8] bg-white p-4">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#f1f6f4] text-[#087766]">
                <Icon name="reports" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#162523]">{item}</p>
                <p className="mt-1 text-[12px] text-[#7b8986]">Ready for secure storage</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
