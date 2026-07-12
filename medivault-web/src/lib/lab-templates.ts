import type { LabTemplate } from "@/lib/vault-types";

export const labTemplates: LabTemplate[] = [
  {
    id: "cbc",
    name: "CBC",
    category: "Blood",
    tests: [
      { name: "Hemoglobin", unit: "g/dL", referenceRange: "13.0-17.0" },
      { name: "RBC Count", unit: "million/uL", referenceRange: "4.5-5.9" },
      { name: "WBC Count", unit: "cells/uL", referenceRange: "4000-11000" },
      { name: "Platelets", unit: "lakh/uL", referenceRange: "1.5-4.5" },
      { name: "Hematocrit", unit: "%", referenceRange: "40-50" },
      { name: "MCV", unit: "fL", referenceRange: "80-100" },
      { name: "MCH", unit: "pg", referenceRange: "27-33" },
      { name: "MCHC", unit: "g/dL", referenceRange: "32-36" },
    ],
  },
  {
    id: "lipid",
    name: "Lipid Profile",
    category: "Cardiac",
    tests: [
      { name: "Total Cholesterol", unit: "mg/dL", referenceRange: "< 200" },
      { name: "LDL Cholesterol", unit: "mg/dL", referenceRange: "< 100" },
      { name: "HDL Cholesterol", unit: "mg/dL", referenceRange: "> 40" },
      { name: "Triglycerides", unit: "mg/dL", referenceRange: "< 150" },
      { name: "VLDL", unit: "mg/dL", referenceRange: "5-40" },
      { name: "Cholesterol/HDL Ratio", unit: "ratio", referenceRange: "< 5" },
    ],
  },
  {
    id: "thyroid",
    name: "Thyroid",
    category: "Endocrine",
    tests: [
      { name: "TSH", unit: "uIU/mL", referenceRange: "0.4-4.0" },
      { name: "T3", unit: "ng/dL", referenceRange: "80-200" },
      { name: "T4", unit: "ug/dL", referenceRange: "5.0-12.0" },
      { name: "Free T3", unit: "pg/mL", referenceRange: "2.3-4.2" },
      { name: "Free T4", unit: "ng/dL", referenceRange: "0.8-1.8" },
    ],
  },
  {
    id: "diabetes",
    name: "Diabetes",
    category: "Metabolic",
    tests: [
      { name: "Fasting Blood Sugar", unit: "mg/dL", referenceRange: "70-100" },
      { name: "Postprandial Blood Sugar", unit: "mg/dL", referenceRange: "70-140" },
      { name: "Random Blood Sugar", unit: "mg/dL", referenceRange: "70-140" },
      { name: "HbA1c", unit: "%", referenceRange: "4.0-5.6" },
      { name: "Insulin Fasting", unit: "uIU/mL", referenceRange: "2-25" },
    ],
  },
  {
    id: "body-composition",
    name: "BMI & Body Composition",
    category: "Body Metrics",
    tests: [
      { name: "Height", unit: "cm", referenceRange: "> 0" },
      { name: "Weight", unit: "kg", referenceRange: "> 0" },
      { name: "BMI", unit: "kg/m2", referenceRange: "18.5-24.9" },
      { name: "Body Fat", unit: "%", referenceRange: "10-25" },
      { name: "Skeletal Muscle", unit: "%", referenceRange: "30-45" },
      { name: "Muscle Mass", unit: "kg", referenceRange: "> 0" },
      { name: "Visceral Fat", unit: "level", referenceRange: "< 10" },
      { name: "Subcutaneous Fat", unit: "%", referenceRange: "8-20" },
      { name: "Body Water", unit: "%", referenceRange: "45-65" },
      { name: "Bone Mass", unit: "kg", referenceRange: "> 0" },
      { name: "Basal Metabolic Rate", unit: "kcal", referenceRange: "> 0" },
      { name: "Metabolic Age", unit: "years", referenceRange: "> 0" },
      { name: "Protein", unit: "%", referenceRange: "16-20" },
      { name: "Body Score", unit: "score", referenceRange: "70-100" },
    ],
  },
  {
    id: "vitamin",
    name: "Vitamin",
    category: "Nutrition",
    tests: [
      { name: "Vitamin D", unit: "ng/mL", referenceRange: "30-100" },
      { name: "Vitamin B12", unit: "pg/mL", referenceRange: "200-900" },
      { name: "Folate", unit: "ng/mL", referenceRange: "3-17" },
      { name: "Ferritin", unit: "ng/mL", referenceRange: "30-400" },
      { name: "Calcium", unit: "mg/dL", referenceRange: "8.5-10.5" },
    ],
  },
  {
    id: "liver",
    name: "Liver",
    category: "Organ Function",
    tests: [
      { name: "SGPT/ALT", unit: "U/L", referenceRange: "7-56" },
      { name: "SGOT/AST", unit: "U/L", referenceRange: "10-40" },
      { name: "Alkaline Phosphatase", unit: "U/L", referenceRange: "44-147" },
      { name: "Total Bilirubin", unit: "mg/dL", referenceRange: "0.1-1.2" },
      { name: "Direct Bilirubin", unit: "mg/dL", referenceRange: "0.0-0.3" },
      { name: "Albumin", unit: "g/dL", referenceRange: "3.5-5.0" },
    ],
  },
  {
    id: "kidney",
    name: "Kidney",
    category: "Organ Function",
    tests: [
      { name: "Creatinine", unit: "mg/dL", referenceRange: "0.6-1.3" },
      { name: "Urea", unit: "mg/dL", referenceRange: "15-40" },
      { name: "Blood Urea Nitrogen", unit: "mg/dL", referenceRange: "7-20" },
      { name: "Uric Acid", unit: "mg/dL", referenceRange: "3.5-7.2" },
      { name: "eGFR", unit: "mL/min/1.73m2", referenceRange: "> 60" },
    ],
  },
  {
    id: "urine",
    name: "Urine",
    category: "Urinalysis",
    tests: [
      { name: "Protein", unit: "", referenceRange: "Negative" },
      { name: "Glucose", unit: "", referenceRange: "Negative" },
      { name: "Ketones", unit: "", referenceRange: "Negative" },
      { name: "pH", unit: "", referenceRange: "4.5-8.0" },
      { name: "Specific Gravity", unit: "", referenceRange: "1.005-1.030" },
      { name: "RBC", unit: "/HPF", referenceRange: "0-2" },
      { name: "WBC", unit: "/HPF", referenceRange: "0-5" },
    ],
  },
  {
    id: "custom",
    name: "Custom",
    category: "Custom",
    tests: [],
  },
];

export function getLabTemplate(templateId: string) {
  return labTemplates.find((template) => template.id === templateId) ?? labTemplates[0];
}
