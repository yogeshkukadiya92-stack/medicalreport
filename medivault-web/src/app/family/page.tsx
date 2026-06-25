"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAppData } from "@/components/app-data-provider";
import { Icon, MobileShell } from "@/components/mobile-shell";

const emptyForm = { name: "", relation: "", age: "", bloodGroup: "" };

export default function FamilyPage() {
  const { activeMemberId, addMember, familyMembers, reports, setActiveMemberId, updateMember } = useAppData();
  const [form, setForm] = useState(emptyForm);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const editingMember = useMemo(
    () => familyMembers.find((member) => member.id === editingMemberId) ?? null,
    [editingMemberId, familyMembers],
  );

  useEffect(() => {
    if (!editingMember) {
      setForm(emptyForm);
      return;
    }

    setForm({
      name: editingMember.name,
      relation: editingMember.relation,
      age: editingMember.age ? String(editingMember.age) : "",
      bloodGroup: editingMember.bloodGroup,
    });
  }, [editingMember]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    if (editingMember) {
      updateMember(editingMember.id, {
        name,
        relation: form.relation.trim() || "Family",
        age: form.age ? Number(form.age) : 0,
        bloodGroup: form.bloodGroup.trim() || "Unknown",
      });
      setMessage(`${name} updated.`);
    } else {
      addMember(name, form.relation.trim() || "Family");
      setMessage(`${name} added to your family vault.`);
    }

    setEditingMemberId(null);
    setForm(emptyForm);
  }

  function beginEdit(memberId: string) {
    setEditingMemberId(memberId);
    setMessage("");
    setActiveMemberId(memberId);
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

        {familyMembers.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-[#c5d8d3] bg-white p-5 text-center">
            <p className="text-[16px] font-black text-[#162523]">No family members yet</p>
            <p className="mt-2 text-[13px] text-[#65716f]">Add the first person to start using reports and analytics.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {familyMembers.map((member) => {
              const memberReports = reports.filter((report) => report.memberId === member.id);
              const isActive = activeMemberId === member.id;
              return (
                <div
                  key={member.id}
                  className={`rounded-lg border p-4 text-left ${
                    isActive ? "border-[#0a7d6e] bg-[#102323] text-white" : "border-[#e2ebe8] bg-white text-[#162523]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button className="min-w-0 flex-1 text-left" onClick={() => setActiveMemberId(member.id)}>
                      <p className="text-[16px] font-black">{member.name}</p>
                      <p className={`mt-1 text-[12px] ${isActive ? "text-[#aee7d9]" : "text-[#7b8986]"}`}>
                        {member.relation} - {member.age || "Age not set"} - {member.bloodGroup}
                      </p>
                    </button>
                    <div className="text-right">
                      <p className="text-[22px] font-black">{member.score}</p>
                      <p className={`text-[11px] font-bold ${isActive ? "text-[#aee7d9]" : "text-[#7b8986]"}`}>
                        {memberReports.length} reports
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => beginEdit(member.id)}
                      className={`h-9 rounded-md text-[12px] font-bold ${
                        isActive ? "bg-white/12 text-white" : "bg-[#e8f7f2] text-[#087766]"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMemberId(member.id)}
                      className={`h-9 rounded-md text-[12px] font-bold ${
                        isActive ? "bg-white text-[#102323]" : "border border-[#dce9e5] text-[#52605d]"
                      }`}
                    >
                      Use member
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-[#e2ebe8] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-black text-[#162523]">{editingMember ? "Edit family member" : "Add family member"}</h2>
            {editingMember ? (
              <button type="button" onClick={() => setEditingMemberId(null)} className="text-[12px] font-bold text-[#087766]">
                New member
              </button>
            ) : null}
          </div>
          <label className="mt-4 block">
            <span className="text-[12px] font-bold text-[#52605d]">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] px-4 text-[14px] font-bold"
              placeholder="Family member name"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-[12px] font-bold text-[#52605d]">Relation</span>
            <input
              value={form.relation}
              onChange={(event) => setForm((current) => ({ ...current, relation: event.target.value }))}
              className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] px-4 text-[14px] font-bold"
              placeholder="Father, spouse, child"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[12px] font-bold text-[#52605d]">Age</span>
              <input
                type="number"
                min="0"
                value={form.age}
                onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
                className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] px-4 text-[14px] font-bold"
                placeholder="45"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold text-[#52605d]">Blood group</span>
              <input
                value={form.bloodGroup}
                onChange={(event) => setForm((current) => ({ ...current, bloodGroup: event.target.value }))}
                className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] px-4 text-[14px] font-bold"
                placeholder="B+"
              />
            </label>
          </div>
          {message ? <p className="mt-3 rounded-lg bg-[#eaf9f2] p-3 text-[13px] font-bold text-[#087766]">{message}</p> : null}
          <button className="mt-4 h-12 w-full rounded-lg bg-[#0a7d6e] text-[14px] font-bold text-white">
            {editingMember ? "Save changes" : "Add member"}
          </button>
        </form>
      </section>
    </MobileShell>
  );
}
