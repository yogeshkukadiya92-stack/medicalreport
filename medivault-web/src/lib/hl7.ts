export type Hl7Observation = {
  name: string;
  referenceRange: string;
  status: "Normal" | "High" | "Low" | "Watch";
  unit: string;
  value: string;
};

export type Hl7OruMessage = {
  accessionNumber: string;
  clientName: string;
  clientPhone: string;
  messageControlId: string;
  observations: Hl7Observation[];
  reportDate: string;
  reportType: string;
};

function component(value = "", index = 0) {
  return value.split("^")[index]?.trim() || "";
}

function hl7Date(value = "") {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8) return new Date().toISOString().slice(0, 10);
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function marker(flag = ""): Hl7Observation["status"] {
  const normalized = flag.toUpperCase();
  if (normalized.includes("H")) return "High";
  if (normalized.includes("L")) return "Low";
  if (normalized === "N") return "Normal";
  return "Watch";
}

export function parseHl7Oru(raw: string): Hl7OruMessage {
  const segments = raw.replace(/\r\n/g, "\r").replace(/\n/g, "\r")
    .split("\r").map((line) => line.trim()).filter(Boolean);
  const fields = (name: string) => segments.find((line) => line.startsWith(`${name}|`))?.split("|") ?? [];
  const msh = fields("MSH");
  const pid = fields("PID");
  const obr = fields("OBR");
  if (!msh.length || !pid.length || !obr.length) {
    throw new Error("HL7 ORU message must include MSH, PID and OBR segments.");
  }
  const messageType = component(msh[8]);
  if (!messageType.startsWith("ORU")) throw new Error("Only HL7 ORU result messages are supported.");
  const observations = segments.filter((line) => line.startsWith("OBX|")).map((line) => {
    const obx = line.split("|");
    return {
      name: component(obx[3], 1) || component(obx[3]) || "Observation",
      referenceRange: obx[7]?.trim() || "",
      status: marker(obx[8]),
      unit: component(obx[6], 1) || component(obx[6]),
      value: obx[5]?.trim() || "",
    };
  }).filter((item) => item.value);
  if (!observations.length) throw new Error("HL7 message does not contain usable OBX values.");
  const family = component(pid[5]);
  const given = component(pid[5], 1);
  return {
    accessionNumber: component(obr[3]) || component(obr[2]),
    clientName: [given, family].filter(Boolean).join(" ") || "HL7 Patient",
    clientPhone: component(pid[13]),
    messageControlId: msh[9]?.trim() || "",
    observations,
    reportDate: hl7Date(obr[7] || msh[6]),
    reportType: component(obr[4], 1) || component(obr[4]) || "Laboratory Report",
  };
}
