"use client";

import { FormEvent, useState } from "react";
import { useAppData } from "@/components/app-data-provider";
import { Icon, MobileShell } from "@/components/mobile-shell";

export default function FamilyPage() {
  const { activeMemberId, addMember, familyMembers, reports, setActiveMemberId } = useAppData();
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    addMember(name, relation);
    setMessage(`${name.trim()} added to your family vault.`);
    setName("");
    setRelation("");
  }

  return (
    <MobileShell>
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#6f7f7c]">Family vault</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight text-[#101c1c]">Members</h1>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-[#dce9e5] bg-white text-[#223230]">
            <Icon name="family" className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {familyMembers.map((member) => {
            const memberReports = reports.filter((report) => report.memberId === member.id);
            return (
              <button
                key={member.id}
                onClick={() => setActiveMemberId(member.id)}
                className={`w-full rounded-lg border p-4 text-left ${
                  activeMemberId === member.id ? "border-[#0a7d6e] bg-[#102323] text-white" : "border-[#e2ebe8] bg-white text-[#162523]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[16px] font-black">{member.name}</p>
                    <p className={`mt-1 text-[12px] ${activeMemberId === member.id ? "text-[#aee7d9]" : "text-[#7b8986]"}`}>
                      {member.relation} - {member.age || "Age not set"} - {member.bloodGroup}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[22px] font-black">{member.score}</p>
                    <p className={`text-[11px] font-bold ${activeMemberId === member.id ? "text-[#aee7d9]" : "text-[#7b8986]"}`}>
                      {memberReports.length} reports
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-[#e2ebe8] bg-white p-4">
          <h2 className="text-[16px] font-black text-[#162523]">Add family member</h2>
          <label className="mt-4 block">
            <span className="text-[12px] font-bold text-[#52605d]">Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] px-4 text-[14px] font-bold" placeholder="Family member name" />
          </label>
          <label className="mt-3 block">
            <span className="text-[12px] font-bold text-[#52605d]">Relation</span>
            <input value={relation} onChange={(event) => setRelation(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] px-4 text-[14px] font-bold" placeholder="Father, spouse, child" />
          </label>
          {message ? <p className="mt-3 rounded-lg bg-[#eaf9f2] p-3 text-[13px] font-bold text-[#087766]">{message}</p> : null}
          <button className="mt-4 h-12 w-full rounded-lg bg-[#0a7d6e] text-[14px] font-bold text-white">Add member</button>
        </form>
      </section>
    </MobileShell>
  );
}
