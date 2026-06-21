# MediVault AI Extraction System

> **Purpose**: Convert raw OCR text from medical reports into structured, validated JSON
> **Model**: Claude 3.5 Sonnet (Claude Vision for images)
> **Status**: Production-Ready
> **Version**: 1.0
> **Date**: June 2026

---

## Table of Contents

1. [System Prompt](#1-system-prompt)
2. [User Prompt Template](#2-user-prompt-template)
3. [JSON Schema](#3-json-schema)
4. [TypeScript Interfaces](#4-typescript-interfaces)
5. [Example Input](#5-example-input)
6. [Example Output](#6-example-output)
7. [Confidence Scoring Rules](#7-confidence-scoring-rules)
8. [Parameter Normalization](#8-parameter-normalization)
9. [Unit Handling Rules](#9-unit-handling-rules)
10. [Status Inference Logic](#10-status-inference-logic)
11. [Validation Rules](#11-validation-rules)
12. [Error Handling](#12-error-handling)
13. [Retry Strategy](#13-retry-strategy)
14. [Low-Confidence Flagging](#14-low-confidence-flagging)
15. [Implementation Guide](#15-implementation-guide)

---

## 1. System Prompt

```
You are a medical document OCR and data extraction specialist. Your task is to extract structured data from medical reports with high accuracy and safety.

CRITICAL RULES:
1. You MUST respond with ONLY valid JSON. No other text before or after.
2. You MUST NOT diagnose diseases or conditions.
3. You MUST NOT recommend medicines or treatments.
4. You MUST NOT provide medical advice.
5. You MUST extract ONLY what is clearly visible in the document.
6. You MUST NOT infer or assume missing values - use null instead.
7. You MUST assign confidence scores for every extracted value (0-100).
8. You MUST provide a confidence_explanation for each field.

EXTRACTION GUIDELINES:

For Patient Information:
- Extract name exactly as shown (do not correct spelling)
- Age: extract as number only
- Gender: normalize to M, F, Other, or null
- DOB: extract in YYYY-MM-DD format if available
- Patient ID: extract exactly as shown

For Provider Information:
- Lab Name: extract exactly as shown
- Lab Contact: extract phone/address if visible
- Doctor Name: extract exactly as shown
- Doctor Specialty: infer ONLY if clearly stated (e.g., "Cardiology", "Internal Medicine")

For Report Information:
- Report Type: Classify as: blood_test, thyroid, lipid, diabetes, liver, kidney, vitamin, urine, imaging, prescription, discharge, other
- Report Date: extract in YYYY-MM-DD format
- Sample Collection Date: extract in YYYY-MM-DD format if available
- Test Category: Group tests logically (e.g., "Complete Blood Count", "Thyroid Function")

For Test Parameters:
- Parameter Name: Extract exactly as shown in report
- Value: Extract ONLY the numeric value (no text, no ranges, no ">", "<")
- Unit: Extract exactly as shown (examples: mg/dL, g/dL, %, mIU/L, IU/L, U/L)
- Reference Range: Extract as shown (examples: "4.0-5.7", "<100", ">30")
  - Parse into reference_range_low and reference_range_high (numeric only)
  - If only lower bound: set high to null
  - If only upper bound: set low to null
  - If text format like "Negative", "Normal": set both to null

Status Inference Rules:
- ONLY infer status when BOTH value AND reference range are clearly present
- Infer by numeric comparison:
  - value < reference_range_low: status = "low"
  - value > reference_range_high: status = "high"
  - value >= reference_range_low AND value <= reference_range_high: status = "normal"
  - value = exactly at boundary: status = "borderline"
- If comparison impossible (non-numeric): status = "unknown"
- If reference range unclear: status = "unknown"

Confidence Score Rules:
- Each field gets 0-100 score
- 100: Clearly visible, unambiguous text
- 80-99: Visible but slightly unclear or small font
- 60-79: Somewhat clear, some interpretation needed
- 40-59: Unclear, requires careful reading
- 0-39: Very unclear, barely readable
- null: Field not present in document

Special Cases:
- If parameter appears multiple times: extract latest/most prominent
- If value has comment (e.g., "12.3 (HIGH)"), extract value as "12.3", note comment in notes
- If date format unclear (DD/MM/YYYY vs MM/DD/YYYY): make reasonable inference based on context
- If test name is abbreviation (e.g., "CBC"): expand to full name if known, keep abbreviation in parameter_name

VALIDATION:
- Validate numeric values are actually numbers
- Validate dates are valid calendar dates
- Validate units are recognized medical units
- Flag any unusual values (e.g., negative where impossible, extremely high/low)

OUTPUT JSON STRUCTURE:
Must include:
{
  "document_info": {...},
  "patient_info": {...},
  "provider_info": {...},
  "extracted_tests": [...],
  "summary": {...},
  "confidence": {...},
  "warnings": [...],
  "review_required": [...]
}

RESPONSE MUST BE:
- Valid JSON (strict formatting)
- No markdown code blocks (no ``` or similar)
- No explanatory text outside JSON
- Properly escaped quotes in strings
- No trailing commas in objects/arrays

If you cannot extract a value, use null (not empty string, not undefined, not "N/A").
If confidence is very low (<40), include in review_required array.
```

---

## 2. User Prompt Template

```
Extract medical data from this OCR text and return ONLY valid JSON.

Report Type Hint: {report_type_hint}

OCR Text:
---
{ocr_text}
---

Extract all visible data into the specified JSON schema. 
Return ONLY the JSON object, no other text.
Ensure all fields are present (use null for missing values).
Include confidence scores for every field.
```

---

## 3. JSON Schema

### OpenAPI/JSON Schema Format

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Medical Report Extraction",
  "type": "object",
  "required": [
    "document_info",
    "patient_info",
    "provider_info",
    "extracted_tests",
    "summary",
    "confidence",
    "warnings",
    "review_required"
  ],
  "properties": {
    "document_info": {
      "type": "object",
      "required": [
        "report_type",
        "report_date",
        "report_id"
      ],
      "properties": {
        "report_type": {
          "type": [
            "string",
            "null"
          ],
          "enum": [
            "blood_test",
            "thyroid",
            "lipid",
            "diabetes",
            "liver",
            "kidney",
            "vitamin",
            "urine",
            "imaging",
            "prescription",
            "discharge",
            "other",
            null
          ],
          "description": "Classified report type"
        },
        "report_type_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "report_date": {
          "type": [
            "string",
            "null"
          ],
          "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$|^null$",
          "description": "YYYY-MM-DD format"
        },
        "report_date_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "sample_collection_date": {
          "type": [
            "string",
            "null"
          ],
          "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$|^null$",
          "description": "YYYY-MM-DD format if different from report_date"
        },
        "sample_collection_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "report_id": {
          "type": [
            "string",
            "null"
          ],
          "description": "Lab report ID or reference number"
        },
        "report_id_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "test_category": {
          "type": [
            "string",
            "null"
          ],
          "description": "Category of tests (e.g., Complete Blood Count, Thyroid Function)"
        },
        "test_category_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        }
      }
    },
    "patient_info": {
      "type": "object",
      "required": [
        "name",
        "age",
        "gender"
      ],
      "properties": {
        "name": {
          "type": [
            "string",
            "null"
          ],
          "description": "Full patient name"
        },
        "name_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "date_of_birth": {
          "type": [
            "string",
            "null"
          ],
          "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$|^null$",
          "description": "YYYY-MM-DD format"
        },
        "dob_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "age": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 150,
          "description": "Age in years"
        },
        "age_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "gender": {
          "type": [
            "string",
            "null"
          ],
          "enum": [
            "M",
            "F",
            "Other",
            null
          ]
        },
        "gender_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "patient_id": {
          "type": [
            "string",
            "null"
          ],
          "description": "Patient ID from report"
        },
        "patient_id_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        }
      }
    },
    "provider_info": {
      "type": "object",
      "properties": {
        "lab_name": {
          "type": [
            "string",
            "null"
          ]
        },
        "lab_name_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "lab_address": {
          "type": [
            "string",
            "null"
          ]
        },
        "lab_phone": {
          "type": [
            "string",
            "null"
          ]
        },
        "lab_phone_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "doctor_name": {
          "type": [
            "string",
            "null"
          ],
          "description": "Name of referring or testing doctor"
        },
        "doctor_name_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "doctor_specialty": {
          "type": [
            "string",
            "null"
          ],
          "description": "Only if clearly stated"
        },
        "doctor_specialty_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        }
      }
    },
    "extracted_tests": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "parameter_name",
          "value",
          "unit"
        ],
        "properties": {
          "parameter_name": {
            "type": "string",
            "description": "Test parameter name exactly as shown"
          },
          "parameter_name_confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 100
          },
          "standardized_name": {
            "type": [
              "string",
              "null"
            ],
            "description": "Standard medical parameter name for this parameter"
          },
          "value": {
            "type": [
              "string",
              "number",
              "null"
            ],
            "description": "Numeric value only (no units, no text, no <> symbols)"
          },
          "value_confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 100
          },
          "unit": {
            "type": [
              "string",
              "null"
            ],
            "description": "Unit exactly as shown (e.g., mg/dL, g/dL, %)"
          },
          "unit_confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 100
          },
          "reference_range_low": {
            "type": [
              "number",
              "null"
            ],
            "description": "Lower bound of reference range"
          },
          "reference_range_high": {
            "type": [
              "number",
              "null"
            ],
            "description": "Upper bound of reference range"
          },
          "reference_range_text": {
            "type": [
              "string",
              "null"
            ],
            "description": "Reference range exactly as shown (e.g., 4.0-5.7, <100)"
          },
          "reference_range_confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 100
          },
          "status": {
            "type": [
              "string",
              "null"
            ],
            "enum": [
              "normal",
              "high",
              "low",
              "borderline",
              "critical",
              "unknown",
              null
            ],
            "description": "Classification of value relative to reference range"
          },
          "status_confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "Confidence in status determination"
          },
          "status_explanation": {
            "type": [
              "string",
              "null"
            ],
            "description": "How status was determined (e.g., 'value > reference_range_high')"
          },
          "notes": {
            "type": [
              "string",
              "null"
            ],
            "description": "Additional notes from report (e.g., HIGH marker, comments)"
          }
        }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "report_summary": {
          "type": [
            "string",
            "null"
          ],
          "description": "Non-diagnostic summary of what tests were done"
        },
        "key_findings": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "List of factual findings (no diagnosis, no treatment)"
        },
        "total_tests_found": {
          "type": "integer",
          "description": "Count of extracted test parameters"
        },
        "tests_with_abnormal_values": {
          "type": "integer",
          "description": "Count of non-normal status values"
        }
      }
    },
    "confidence": {
      "type": "object",
      "properties": {
        "overall_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 100,
          "description": "Weighted average confidence of all extracted data"
        },
        "patient_info_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "provider_info_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "test_extraction_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "field_confidences": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "score": {
                "type": "number",
                "minimum": 0,
                "maximum": 100
              },
              "explanation": {
                "type": "string"
              }
            }
          },
          "description": "Per-field confidence with explanations"
        }
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "quality_issue",
              "unusual_value",
              "missing_data",
              "inconsistency",
              "unrecognized_unit"
            ]
          },
          "field": {
            "type": "string",
            "description": "Field name where warning applies"
          },
          "message": {
            "type": "string",
            "description": "Warning message"
          },
          "severity": {
            "type": "string",
            "enum": [
              "info",
              "warning",
              "critical"
            ]
          }
        }
      }
    },
    "review_required": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "field": {
            "type": "string",
            "description": "Field path (e.g., extracted_tests[0].value)"
          },
          "reason": {
            "type": "string",
            "enum": [
              "low_confidence",
              "unclear_visibility",
              "unusual_value",
              "missing_reference_range",
              "ambiguous_date",
              "unrecognized_parameter"
            ]
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "Confidence score that triggered review"
          },
          "suggestion": {
            "type": [
              "string",
              "null"
            ],
            "description": "Suggestion for user correction"
          }
        }
      },
      "description": "Fields that should be reviewed/corrected by user"
    }
  }
}
```

---

## 4. TypeScript Interfaces

```typescript
// Medical Report Extraction Response

interface MedicalReportExtraction {
  document_info: DocumentInfo;
  patient_info: PatientInfo;
  provider_info: ProviderInfo;
  extracted_tests: ExtractedTest[];
  summary: ReportSummary;
  confidence: ConfidenceScores;
  warnings: Warning[];
  review_required: ReviewRequiredField[];
}

interface DocumentInfo {
  report_type: ReportType | null;
  report_type_confidence: number;
  report_date: string | null; // YYYY-MM-DD
  report_date_confidence: number;
  sample_collection_date?: string | null;
  sample_collection_confidence: number;
  report_id: string | null;
  report_id_confidence: number;
  test_category: string | null;
  test_category_confidence: number;
}

type ReportType =
  | "blood_test"
  | "thyroid"
  | "lipid"
  | "diabetes"
  | "liver"
  | "kidney"
  | "vitamin"
  | "urine"
  | "imaging"
  | "prescription"
  | "discharge"
  | "other";

interface PatientInfo {
  name: string | null;
  name_confidence: number;
  date_of_birth?: string | null;
  dob_confidence: number;
  age: number | null;
  age_confidence: number;
  gender: "M" | "F" | "Other" | null;
  gender_confidence: number;
  patient_id?: string | null;
  patient_id_confidence: number;
}

interface ProviderInfo {
  lab_name: string | null;
  lab_name_confidence: number;
  lab_address?: string | null;
  lab_phone?: string | null;
  lab_phone_confidence: number;
  doctor_name: string | null;
  doctor_name_confidence: number;
  doctor_specialty?: string | null;
  doctor_specialty_confidence: number;
}

interface ExtractedTest {
  parameter_name: string;
  parameter_name_confidence: number;
  standardized_name?: string | null;
  value: string | number | null;
  value_confidence: number;
  unit: string | null;
  unit_confidence: number;
  reference_range_low?: number | null;
  reference_range_high?: number | null;
  reference_range_text: string | null;
  reference_range_confidence: number;
  status: "normal" | "high" | "low" | "borderline" | "critical" | "unknown" | null;
  status_confidence: number;
  status_explanation?: string | null;
  notes?: string | null;
}

interface ReportSummary {
  report_summary: string | null;
  key_findings: string[];
  total_tests_found: number;
  tests_with_abnormal_values: number;
}

interface ConfidenceScores {
  overall_score: number;
  patient_info_score: number;
  provider_info_score: number;
  test_extraction_score: number;
  field_confidences: Record<string, {
    score: number;
    explanation: string;
  }>;
}

interface Warning {
  type: "quality_issue" | "unusual_value" | "missing_data" | "inconsistency" | "unrecognized_unit";
  field: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

interface ReviewRequiredField {
  field: string;
  reason: "low_confidence" | "unclear_visibility" | "unusual_value" | "missing_reference_range" | "ambiguous_date" | "unrecognized_parameter";
  confidence: number;
  suggestion?: string | null;
}
```

---

## 5. Example Input

### Sample OCR Text from Blood Test Report

```
APOLLO DIAGNOSTIC CENTRE
Bandra, Mumbai
www.apollodiagnostics.com
Phone: +91 8800999999

PATIENT REPORT

Name: Rajesh Kumar
Age: 45 Years    Gender: Male
Date of Birth: 15/03/1981
Patient ID: APL2026102456

Report ID: RPT-2026-98765
Collected Date: 18 June 2026
Report Date: 18 June 2026

Dr. Sharma
Internal Medicine

COMPLETE BLOOD COUNT (CBC)

Parameter                              Value       Unit      Reference Range
─────────────────────────────────────────────────────────────────────────
Hemoglobin                             14.2        g/dL      13.0-17.0
Red Blood Cell Count                   4.8         Million/µL 4.5-5.5
White Blood Cell Count                 7.2         K/µL      4.5-11.0
Platelets                              245         K/µL      150-400
Mean Corpuscular Volume (MCV)          88          fL        80-100
Packed Cell Volume (Hematocrit)        42.5        %         40-50

FASTING BLOOD GLUCOSE                  142         mg/dL     70-110 HIGH
HbA1c                                  7.1         %         <5.7 HIGH

LIPID PROFILE
Total Cholesterol                      195         mg/dL     <200
LDL Cholesterol                        115         mg/dL     <100 HIGH
HDL Cholesterol                        45          mg/dL     >40
Triglycerides                          165         mg/dL     <150 HIGH

RENAL FUNCTION
Creatinine                             0.9         mg/dL     0.7-1.3
Blood Urea Nitrogen (BUN)              18          mg/dL     7-20
eGFR                                   >90         mL/min    >60

THYROID FUNCTION
TSH                                    2.1         mIU/L     0.4-4.0
T3                                     120         ng/dL     80-200
T4                                     8.2         µg/dL     4.5-12.0

VITAMIN D
25-OH Vitamin D                        18          ng/mL     30-100 LOW

Interpretation:
- Fasting blood glucose elevated, suggesting impaired fasting glucose
- HbA1c elevated, indicating average glucose over 3 months is high
- LDL cholesterol elevated
- Triglycerides elevated
- Vitamin D is low, supplementation recommended

For Internal Use Only
```

---

## 6. Example Output

```json
{
  "document_info": {
    "report_type": "blood_test",
    "report_type_confidence": 98,
    "report_date": "2026-06-18",
    "report_date_confidence": 99,
    "sample_collection_date": "2026-06-18",
    "sample_collection_confidence": 99,
    "report_id": "RPT-2026-98765",
    "report_id_confidence": 98,
    "test_category": "Complete Blood Count, Glucose, Lipid Profile, Renal Function, Thyroid Function, Vitamin D",
    "test_category_confidence": 95
  },
  "patient_info": {
    "name": "Rajesh Kumar",
    "name_confidence": 99,
    "date_of_birth": "1981-03-15",
    "dob_confidence": 95,
    "age": 45,
    "age_confidence": 99,
    "gender": "M",
    "gender_confidence": 99,
    "patient_id": "APL2026102456",
    "patient_id_confidence": 98
  },
  "provider_info": {
    "lab_name": "Apollo Diagnostic Centre",
    "lab_name_confidence": 99,
    "lab_address": "Bandra, Mumbai",
    "lab_phone": "+91 8800999999",
    "lab_phone_confidence": 97,
    "doctor_name": "Dr. Sharma",
    "doctor_name_confidence": 95,
    "doctor_specialty": "Internal Medicine",
    "doctor_specialty_confidence": 90
  },
  "extracted_tests": [
    {
      "parameter_name": "Hemoglobin",
      "parameter_name_confidence": 99,
      "standardized_name": "hemoglobin",
      "value": "14.2",
      "value_confidence": 99,
      "unit": "g/dL",
      "unit_confidence": 99,
      "reference_range_low": 13.0,
      "reference_range_high": 17.0,
      "reference_range_text": "13.0-17.0",
      "reference_range_confidence": 99,
      "status": "normal",
      "status_confidence": 99,
      "status_explanation": "value (14.2) is between reference_range_low (13.0) and reference_range_high (17.0)"
    },
    {
      "parameter_name": "Red Blood Cell Count",
      "parameter_name_confidence": 95,
      "standardized_name": "rbc",
      "value": "4.8",
      "value_confidence": 98,
      "unit": "Million/µL",
      "unit_confidence": 85,
      "reference_range_low": 4.5,
      "reference_range_high": 5.5,
      "reference_range_text": "4.5-5.5",
      "reference_range_confidence": 98,
      "status": "normal",
      "status_confidence": 98
    },
    {
      "parameter_name": "White Blood Cell Count",
      "parameter_name_confidence": 97,
      "standardized_name": "wbc",
      "value": "7.2",
      "value_confidence": 98,
      "unit": "K/µL",
      "unit_confidence": 92,
      "reference_range_low": 4.5,
      "reference_range_high": 11.0,
      "reference_range_text": "4.5-11.0",
      "reference_range_confidence": 98,
      "status": "normal",
      "status_confidence": 98
    },
    {
      "parameter_name": "Platelets",
      "parameter_name_confidence": 99,
      "standardized_name": "platelets",
      "value": "245",
      "value_confidence": 99,
      "unit": "K/µL",
      "unit_confidence": 94,
      "reference_range_low": 150,
      "reference_range_high": 400,
      "reference_range_text": "150-400",
      "reference_range_confidence": 98,
      "status": "normal",
      "status_confidence": 99
    },
    {
      "parameter_name": "Mean Corpuscular Volume (MCV)",
      "parameter_name_confidence": 96,
      "standardized_name": "mcv",
      "value": "88",
      "value_confidence": 98,
      "unit": "fL",
      "unit_confidence": 97,
      "reference_range_low": 80,
      "reference_range_high": 100,
      "reference_range_text": "80-100",
      "reference_range_confidence": 98,
      "status": "normal",
      "status_confidence": 99
    },
    {
      "parameter_name": "Packed Cell Volume (Hematocrit)",
      "parameter_name_confidence": 94,
      "standardized_name": "hematocrit",
      "value": "42.5",
      "value_confidence": 98,
      "unit": "%",
      "unit_confidence": 99,
      "reference_range_low": 40,
      "reference_range_high": 50,
      "reference_range_text": "40-50",
      "reference_range_confidence": 97,
      "status": "normal",
      "status_confidence": 99
    },
    {
      "parameter_name": "Fasting Blood Glucose",
      "parameter_name_confidence": 98,
      "standardized_name": "fasting_glucose",
      "value": "142",
      "value_confidence": 99,
      "unit": "mg/dL",
      "unit_confidence": 99,
      "reference_range_low": 70,
      "reference_range_high": 110,
      "reference_range_text": "70-110",
      "reference_range_confidence": 98,
      "status": "high",
      "status_confidence": 99,
      "status_explanation": "value (142) is greater than reference_range_high (110)",
      "notes": "HIGH - marked in report"
    },
    {
      "parameter_name": "HbA1c",
      "parameter_name_confidence": 99,
      "standardized_name": "hba1c",
      "value": "7.1",
      "value_confidence": 99,
      "unit": "%",
      "unit_confidence": 99,
      "reference_range_low": null,
      "reference_range_high": 5.7,
      "reference_range_text": "<5.7",
      "reference_range_confidence": 98,
      "status": "high",
      "status_confidence": 99,
      "status_explanation": "value (7.1) is greater than reference_range_high (5.7)",
      "notes": "HIGH - marked in report"
    },
    {
      "parameter_name": "Total Cholesterol",
      "parameter_name_confidence": 98,
      "standardized_name": "total_cholesterol",
      "value": "195",
      "value_confidence": 99,
      "unit": "mg/dL",
      "unit_confidence": 99,
      "reference_range_low": null,
      "reference_range_high": 200,
      "reference_range_text": "<200",
      "reference_range_confidence": 98,
      "status": "normal",
      "status_confidence": 99
    },
    {
      "parameter_name": "LDL Cholesterol",
      "parameter_name_confidence": 98,
      "standardized_name": "ldl_cholesterol",
      "value": "115",
      "value_confidence": 99,
      "unit": "mg/dL",
      "unit_confidence": 99,
      "reference_range_low": null,
      "reference_range_high": 100,
      "reference_range_text": "<100",
      "reference_range_confidence": 97,
      "status": "high",
      "status_confidence": 99,
      "notes": "HIGH - marked in report"
    },
    {
      "parameter_name": "HDL Cholesterol",
      "parameter_name_confidence": 97,
      "standardized_name": "hdl_cholesterol",
      "value": "45",
      "value_confidence": 98,
      "unit": "mg/dL",
      "unit_confidence": 99,
      "reference_range_low": 40,
      "reference_range_high": null,
      "reference_range_text": ">40",
      "reference_range_confidence": 97,
      "status": "normal",
      "status_confidence": 99
    },
    {
      "parameter_name": "Triglycerides",
      "parameter_name_confidence": 98,
      "standardized_name": "triglycerides",
      "value": "165",
      "value_confidence": 99,
      "unit": "mg/dL",
      "unit_confidence": 99,
      "reference_range_low": null,
      "reference_range_high": 150,
      "reference_range_text": "<150",
      "reference_range_confidence": 97,
      "status": "high",
      "status_confidence": 99,
      "notes": "HIGH - marked in report"
    },
    {
      "parameter_name": "Creatinine",
      "parameter_name_confidence": 98,
      "standardized_name": "creatinine",
      "value": "0.9",
      "value_confidence": 98,
      "unit": "mg/dL",
      "unit_confidence": 99,
      "reference_range_low": 0.7,
      "reference_range_high": 1.3,
      "reference_range_text": "0.7-1.3",
      "reference_range_confidence": 98,
      "status": "normal",
      "status_confidence": 99
    },
    {
      "parameter_name": "Blood Urea Nitrogen (BUN)",
      "parameter_name_confidence": 97,
      "standardized_name": "bun",
      "value": "18",
      "value_confidence": 98,
      "unit": "mg/dL",
      "unit_confidence": 99,
      "reference_range_low": 7,
      "reference_range_high": 20,
      "reference_range_text": "7-20",
      "reference_range_confidence": 98,
      "status": "normal",
      "status_confidence": 99
    },
    {
      "parameter_name": "eGFR",
      "parameter_name_confidence": 95,
      "standardized_name": "egfr",
      "value": "90",
      "value_confidence": 85,
      "unit": "mL/min",
      "unit_confidence": 92,
      "reference_range_low": 60,
      "reference_range_high": null,
      "reference_range_text": ">60",
      "reference_range_confidence": 95,
      "status": "normal",
      "status_confidence": 95,
      "notes": "Shown as >90 in report, extracted as 90"
    },
    {
      "parameter_name": "TSH",
      "parameter_name_confidence": 99,
      "standardized_name": "tsh",
      "value": "2.1",
      "value_confidence": 99,
      "unit": "mIU/L",
      "unit_confidence": 98,
      "reference_range_low": 0.4,
      "reference_range_high": 4.0,
      "reference_range_text": "0.4-4.0",
      "reference_range_confidence": 98,
      "status": "normal",
      "status_confidence": 99
    },
    {
      "parameter_name": "T3",
      "parameter_name_confidence": 98,
      "standardized_name": "t3",
      "value": "120",
      "value_confidence": 97,
      "unit": "ng/dL",
      "unit_confidence": 90,
      "reference_range_low": 80,
      "reference_range_high": 200,
      "reference_range_text": "80-200",
      "reference_range_confidence": 95,
      "status": "normal",
      "status_confidence": 98
    },
    {
      "parameter_name": "T4",
      "parameter_name_confidence": 98,
      "standardized_name": "t4",
      "value": "8.2",
      "value_confidence": 97,
      "unit": "µg/dL",
      "unit_confidence": 88,
      "reference_range_low": 4.5,
      "reference_range_high": 12.0,
      "reference_range_text": "4.5-12.0",
      "reference_range_confidence": 95,
      "status": "normal",
      "status_confidence": 98
    },
    {
      "parameter_name": "25-OH Vitamin D",
      "parameter_name_confidence": 94,
      "standardized_name": "vitamin_d",
      "value": "18",
      "value_confidence": 98,
      "unit": "ng/mL",
      "unit_confidence": 96,
      "reference_range_low": 30,
      "reference_range_high": 100,
      "reference_range_text": "30-100",
      "reference_range_confidence": 97,
      "status": "low",
      "status_confidence": 99,
      "notes": "LOW - marked in report"
    }
  ],
  "summary": {
    "report_summary": "Complete blood count and metabolic panel showing elevated fasting glucose, HbA1c, LDL cholesterol, triglycerides, and low vitamin D. Other parameters within normal range.",
    "key_findings": [
      "Elevated fasting blood glucose (142 mg/dL)",
      "Elevated HbA1c (7.1%)",
      "Elevated LDL cholesterol (115 mg/dL)",
      "Elevated triglycerides (165 mg/dL)",
      "Low vitamin D (18 ng/mL)",
      "Normal complete blood count",
      "Normal renal function",
      "Normal thyroid function"
    ],
    "total_tests_found": 20,
    "tests_with_abnormal_values": 5
  },
  "confidence": {
    "overall_score": 96,
    "patient_info_score": 97,
    "provider_info_score": 94,
    "test_extraction_score": 96,
    "field_confidences": {
      "document_info.report_date": {
        "score": 99,
        "explanation": "Clearly printed date, verified format"
      },
      "patient_info.name": {
        "score": 99,
        "explanation": "Clear text at top of report"
      },
      "extracted_tests[0].value": {
        "score": 99,
        "explanation": "Numeric value clearly visible in table"
      },
      "extracted_tests[16].unit": {
        "score": 88,
        "explanation": "Unit slightly unclear due to small font, assumed standard unit"
      }
    }
  },
  "warnings": [
    {
      "type": "quality_issue",
      "field": "extracted_tests[16].unit",
      "message": "T3 unit 'ng/dL' is unusual; may be 'pg/mL'. Verify with lab.",
      "severity": "warning"
    },
    {
      "type": "unusual_value",
      "field": "extracted_tests[15].value",
      "message": "eGFR shown as >90; extracted as 90 for analysis",
      "severity": "info"
    }
  ],
  "review_required": [
    {
      "field": "extracted_tests[16].unit",
      "reason": "unclear_visibility",
      "confidence": 88,
      "suggestion": "Verify T3 unit: likely pg/mL, not ng/dL"
    }
  ]
}
```

---

## 7. Confidence Scoring Rules

```
CONFIDENCE SCORING ALGORITHM

Base Confidence Calculation:
confidence = ocr_clarity_score * 0.5 + interpretation_score * 0.3 + validation_score * 0.2

OCR Clarity Score (0-100):
- 95-100: Crystal clear, large, dark text
- 85-94: Clear, readable, normal font size
- 75-84: Readable, small font or slight blur
- 65-74: Somewhat readable, blurred areas
- 50-64: Difficult to read, significant blur
- 40-49: Very difficult, barely readable
- 0-39: Illegible, cannot read with confidence

Interpretation Score (0-100):
- 95-100: Unambiguous, single obvious meaning
- 85-94: Clear with minor interpretation
- 75-84: Reasonable interpretation, some context needed
- 65-74: Requires assumptions, context-dependent
- 50-64: Multiple possible interpretations
- 40-49: Highly ambiguous
- 0-39: Cannot interpret reliably

Validation Score (0-100):
- Pass validation checks: +20
- Reasonable value (medical range): +15
- Recognized unit: +15
- Reference range present: +10
- Status can be determined: +10
- No anomalies: +10

Penalties (apply after base calculation):
- Value outside reasonable range: -20
- Unrecognized unit: -25
- No reference range: -10
- Date format ambiguous: -15
- Missing supporting context: -10
- Unusual/suspicious value: -20

Field-Specific Rules:

Name:
- Base: 100 if fully visible
- Penalty: -30 if handwritten
- Penalty: -20 if faint/partially visible
- Penalty: -25 if abbreviation or nickname unclear

Age:
- Base: 100 if stated as number
- Penalty: -30 if must be calculated from DOB
- Penalty: -40 if estimated from appearance

Date:
- Base: 100 if clearly formatted (YYYY-MM-DD or similar)
- Penalty: -20 if DD/MM/YYYY vs MM/DD/YYYY ambiguous
- Penalty: -30 if only month/year given
- Penalty: -40 if handwritten or unclear

Test Value:
- Base: 100 if isolated numeric value in table
- Penalty: -10 if small font (<10pt)
- Penalty: -15 if mixed with units in same field
- Penalty: -20 if in text (not table format)
- Penalty: -25 if value is a range "5-10"
- Bonus: +10 if value repeated in multiple places

Reference Range:
- Base: 100 if clearly stated in dedicated column
- Penalty: -20 if in text format
- Penalty: -30 if partially visible
- Penalty: -40 if inferred from notes only
- Bonus: +5 if multiple formats provided (both numeric and text)

Unit:
- Base: 100 if matches standard medical unit
- Penalty: -15 if non-standard abbreviation
- Penalty: -25 if unrecognized (query standardization)
- Penalty: -30 if implied but not shown

Status:
- Base: 100 if explicitly stated in report
- Penalty: -10 if inferred from high/low marker
- Penalty: -20 if inferred from single reference bound
- Penalty: -30 if inferred from value alone (no reference)

Field Weighting for Overall Score:
overall_confidence = (
  0.25 * patient_info_avg +
  0.15 * provider_info_avg +
  0.60 * test_extraction_avg
)

Report Quality Score:
- >= 90%: "Excellent - Ready for automated use"
- 70-89%: "Good - Minor review recommended"
- 50-69%: "Fair - Manual review recommended"
- < 50%: "Poor - Manual entry recommended"
```

---

## 8. Parameter Normalization

```
STANDARD MEDICAL PARAMETERS

Common Lab Tests Mapping:

Blood Count:
- "Hemoglobin", "HGB", "Hb", "HbX" → "hemoglobin"
- "WBC", "White Blood Cell", "Leukocytes" → "wbc"
- "RBC", "Red Blood Cell", "Erythrocytes" → "rbc"
- "Platelet", "PLT", "Thrombocytes" → "platelets"
- "MCV", "Mean Corpuscular Volume" → "mcv"
- "Hematocrit", "HCT", "Packed Cell Volume" → "hematocrit"

Glucose:
- "Fasting Glucose", "FBS", "FBG" → "fasting_glucose"
- "Random Glucose", "RBS" → "random_glucose"
- "HbA1c", "Glycated Hemoglobin", "A1C" → "hba1c"
- "PPBS", "Post-prandial" → "postprandial_glucose"

Lipids:
- "Total Cholesterol", "TC" → "total_cholesterol"
- "LDL", "Bad Cholesterol" → "ldl_cholesterol"
- "HDL", "Good Cholesterol" → "hdl_cholesterol"
- "VLDL" → "vldl_cholesterol"
- "Triglycerides", "TG" → "triglycerides"

Kidney Function:
- "Creatinine", "Cr" → "creatinine"
- "Blood Urea", "BUN", "Urea" → "bun"
- "eGFR", "GFR" → "egfr"
- "Uric Acid", "UA" → "uric_acid"

Liver Function:
- "SGOT", "AST", "Aspartate Aminotransferase" → "ast"
- "SGPT", "ALT", "Alanine Aminotransferase" → "alt"
- "ALP", "Alkaline Phosphatase" → "alp"
- "Total Bilirubin" → "total_bilirubin"
- "Direct Bilirubin" → "direct_bilirubin"
- "Albumin" → "albumin"

Thyroid:
- "TSH", "Thyroid Stimulating Hormone" → "tsh"
- "T3", "Triiodothyronine" → "t3"
- "T4", "Thyroxine" → "t4"
- "Free T3", "FT3" → "free_t3"
- "Free T4", "FT4" → "free_t4"

Vitamins:
- "Vitamin D", "25-OH Vitamin D" → "vitamin_d"
- "Vitamin B12", "Cobalamin" → "vitamin_b12"
- "Folate", "Folic Acid" → "folate"
- "Vitamin A" → "vitamin_a"

Normalization Rules:
1. Remove articles: "The HbA1c" → "HbA1c"
2. Expand abbreviations: "Hb" → "Hemoglobin"
3. Remove units: "Glucose (mg/dL)" → "Glucose"
4. Remove parentheticals: "TSH (Thyroid)" → "TSH"
5. Standardize case: "hbA1c" → "HbA1c"
6. Trim whitespace: "  HbA1c  " → "HbA1c"
7. Handle common misspellings:
   - "Haemoglobin" → "Hemoglobin"
   - "Leucocytes" → "Leukocytes"
   - "Erythrocyte" → "RBC"

Output format:
- Use snake_case for standardized names
- Example: "hemoglobin", "fasting_glucose", "ldl_cholesterol"
```

---

## 9. Unit Handling Rules

```
UNIT STANDARDIZATION & CONVERSION

Standard Medical Units:

Blood Count:
- Hemoglobin: "g/dL" (grams per deciliter)
  Alternatives: "g/100mL" (same), "g%" (same)
  Non-standard: "mmol/L" (SI unit, 1 g/dL ≈ 0.6207 mmol/L)

- RBC: "Million/µL" or "M/µL" or "10^6/µL"
  SI: "10^12/L"

- WBC: "K/µL" (thousands per microliter)
  SI: "10^9/L"

- Platelets: "K/µL"
  SI: "10^9/L"

- MCV: "fL" (femtoliters)

Glucose:
- "mg/dL" (milligrams per deciliter)
  SI: "mmol/L" (1 mg/dL ≈ 0.0555 mmol/L)

- HbA1c: "%" (percentage)
  SI: "mmol/mol" (% x 10.929 ≈ mmol/mol)

Lipids:
- "mg/dL"
  SI: "mmol/L" (varies by lipid)

Kidney:
- Creatinine: "mg/dL"
  SI: "µmol/L" (1 mg/dL ≈ 88.4 µmol/L)

- BUN: "mg/dL"
  SI: "mmol/L" (1 mg/dL ≈ 0.357 mmol/L)

- eGFR: "mL/min/1.73m²"

Thyroid:
- TSH: "mIU/L" (milli-international units per liter)
  Also: "µIU/mL" (same, different notation)

- T3/T4: "ng/dL" or "pg/mL" (varies by lab)
  SI: "pmol/L"

Vitamins:
- Vitamin D: "ng/mL"
  SI: "nmol/L" (1 ng/mL ≈ 2.496 nmol/L)

- B12: "pg/mL"
  SI: "pmol/L" (1 pg/mL ≈ 0.738 pmol/L)

Unit Handling Rules:

1. Recognize Variations:
   - "g/dL", "g/100mL", "g%" → standardize to "g/dL"
   - "K/µL", "10^3/µL" → standardize to "K/µL"
   - "mIU/L", "µIU/mL" → standardize to "mIU/L"
   - "million/µL", "M/µL" → standardize to "Million/µL"

2. Flag Non-Standard Units:
   - If unit is SI and report typically uses conventional: flag for review
   - Example: "TSH in pmol/L" when typical is "mIU/L"
   - Add warning: "unusual_unit_detected"

3. Extract Exactly:
   - Store unit as shown in document (in "unit" field)
   - Store standardized form (in "standardized_unit" field)
   - Do NOT convert values (conversion is backend responsibility)

4. Handle Compound Units:
   - "mg/dL", "g/24hr", "U/L" → keep as is
   - "per", "/" → recognize as division
   - "x10^3", "x10^9" → keep notation

5. Missing Units:
   - If unit cannot be determined, set to null
   - Reduce confidence score by -25
   - Add to warnings: "missing_unit"
   - Suggestion: "Verify unit for this parameter"

6. Contextual Units:
   - If parameter name includes unit ("Glucose 100"), extract separately
   - parameter_name = "Glucose"
   - value = "100"
   - unit = "mg/dL" (inferred from context if standard)

7. Unit Confidence:
   - 100: Printed clearly in dedicated column
   - 90: Clearly visible with parameter name
   - 75: Inferred from table structure
   - 60: Inferred from parameter name and value
   - 40: Unclear or ambiguous
   - 0: Cannot determine
```

---

## 10. Status Inference Logic

```
STATUS INFERENCE ALGORITHM

Status Categories:
- "normal": Value is within or acceptable for reference range
- "low": Value is below normal range (too low)
- "high": Value is above normal range (too high)
- "borderline": Value is at edge of normal (±1 of boundary)
- "critical": Value is dangerously out of range
- "unknown": Cannot infer status due to missing data

Inference Rules:

Rule 1: Explicit Status in Report
IF report shows explicit "HIGH", "LOW", "CRITICAL", "NORMAL", "ABNORMAL"
THEN use as shown, confidence = 95-100
AND status_explanation = "explicitly stated in report"

Rule 2: Numeric Comparison
IF (value is numeric AND reference_range_low is numeric) OR reference_range_high is numeric
THEN compare:
  IF value < reference_range_low:
    status = "low"
    status_confidence = min(value_confidence, reference_range_confidence)
  ELSE IF value > reference_range_high:
    status = "high"
    status_confidence = min(value_confidence, reference_range_confidence)
  ELSE IF reference_range_low <= value <= reference_range_high:
    status = "normal"
    status_confidence = min(value_confidence, reference_range_confidence)
  ELSE IF value == reference_range_low OR value == reference_range_high:
    status = "borderline"
    status_confidence = min(value_confidence, reference_range_confidence) * 0.9

Rule 3: Qualitative Reference Ranges
IF reference_range is text like "Negative", "Normal", "Positive"
THEN:
  IF value text matches reference text:
    status = "normal"
  ELSE:
    status = "unknown"
  AND confidence = 50 (cannot reliably compare)

Rule 4: Insufficient Data
IF value is null OR (reference_range_low is null AND reference_range_high is null)
THEN:
  status = "unknown"
  confidence = 0
  explanation = "cannot infer without both value and reference range"

Rule 5: Non-Numeric Values
IF value is text (e.g., "Negative", "Positive", "Reactive")
THEN:
  IF report shows explicit status: use it (Rule 1)
  ELSE:
    status = "unknown"
    confidence = 0
    explanation = "cannot compare non-numeric value"

Rule 6: Single Bound Reference Ranges
IF reference_range_text is "<100" (upper bound only)
THEN:
  IF value < 100:
    status = "normal"
    confidence = min(value_conf, range_conf)
  ELSE:
    status = "high"
    confidence = min(value_conf, range_conf)

IF reference_range_text is ">30" (lower bound only)
THEN:
  IF value > 30:
    status = "normal"
    confidence = min(value_conf, range_conf)
  ELSE:
    status = "low"
    confidence = min(value_conf, range_conf)

Critical Value Detection:
- HbA1c > 10.0%: critical
- Glucose (fasting) > 400 mg/dL: critical
- Glucose (random) > 500 mg/dL: critical
- Hemoglobin < 5 g/dL: critical
- Platelets < 20 K/µL: critical
- WBC < 2 or > 30 K/µL: critical
- TSH > 100 mIU/L: critical

IF critical_value_detected:
  status = "critical"
  confidence = 100
  add warning: {type: "critical_value", severity: "critical"}

Edge Cases:

Multi-Parameter Interpretation:
- If test has internal reference (e.g., "Normal/Abnormal"):
  Use explicit marking over numeric inference
  confidence = 95

Sex-Specific Reference Ranges:
- Some parameters differ by gender (Hemoglobin, Creatinine)
- If patient gender known and range is sex-specific:
  Use correct range, confidence +5
- If patient gender unknown:
  Reduce confidence by 10 (cannot confirm correct range)

Age-Specific Reference Ranges:
- TSH, some growth parameters vary by age
- If patient age known:
  Consider age context
- If ranges shown don't match typical age ranges:
  Flag in warnings

Trending:
- If historical values available (from multiple reports):
  Compare trend: "value increasing", "stable", "decreasing"
  Note in status_explanation
- Single report: cannot determine trend
  Do not infer status based on trend
```

---

## 11. Validation Rules

```
VALIDATION RULES & ERROR DETECTION

Schema Validation:
✓ document_info must have report_type
✓ patient_info.age must be 0-150 if present
✓ patient_info.gender must be M/F/Other or null
✓ All dates must be YYYY-MM-DD format
✓ All confidence scores must be 0-100
✓ extracted_tests array cannot be empty
✓ reference_range_low must be < reference_range_high (if both present)

Data Type Validation:

Numeric Fields:
- Value must be convertible to number
- Valid range: -1000 to +1000000 (catches typos)
- Validate: Hemoglobin (5-20), Glucose (20-600), WBC (1-50)

String Fields:
- Non-empty (length > 0)
- Less than 500 characters
- No special characters (except - / . , ( ))

Date Fields:
- Valid calendar date
- Not in future
- Reasonable for report (not >10 years old)

Confidence Scores:
- Must be integer 0-100
- If < 40: must be in review_required
- If < 70: must be flagged for user review

Medical Value Range Validation:

Hemoglobin:
- Normal: 5-20 g/dL
- Flag if <5 or >20: critical_value

Glucose:
- Normal: 20-600 mg/dL
- Flag if <20 (hypoglycemic emergency) or >500 (critical)

WBC:
- Normal: 1-100 K/µL
- Flag if <2 or >30: possible infection/leukemia

Platelets:
- Normal: 50-1000 K/µL
- Flag if <50: bleeding risk, or >1000: thrombosis risk

TSH:
- Normal: 0.1-200 mIU/L
- Flag if >100: severe hypothyroidism

Age:
- Normal: 0-150 years
- Flag if >120: likely data entry error
- Flag if <0: definitely error

Reference Range Validation:

✓ reference_range_low < reference_range_high
✓ Reference range matches expected units
✓ Reference range is reasonable for parameter
  - Hemoglobin range 5-20: reasonable
  - Hemoglobin range 500-600: error
✓ Parameter name matches typical range
  - If parameter is "Glucose" but range is 4.0-5.7: might be HbA1c

Inconsistency Detection:

Cross-Field Checks:
- If patient age 75 and TSH normal 0.5: reasonable
- If patient age 25 and TSH 150: unusual, flag
- If gender is "M" but parameter is "pregnancy test": inconsistent

Duplicate Detection:
- Same parameter appearing twice with different values
- Flag: "possible duplicate test with different results"
- Suggestion: "verify which reading is correct"

Unit Consistency:
- If glucose shown as "10 mg/dL" (too low):
  - Possibly should be "100 mg/dL" (typo)
  - Possibly should be in "mmol/L" (unit error)
  - Flag for review

Parameter Name Consistency:
- "Glucose" but reference range "< 5.7": might be HbA1c
- "TSH" but value "75": might be 7.5 (typo)
- Flag: "parameter name may not match value"

Impossibilities:

Physically Impossible:
- Age: < 0 or > 150
- Gender: value other than M/F/Other
- Date: February 30, 2026
- Negative counts: WBC, RBC, Platelets < 0
- Temperature: < 95°F or > 108°F (if present)

Medically Implausible:
- Hemoglobin < 3 g/dL (incompatible with life)
- Glucose < 10 mg/dL (severe hypoglycemia, needs emergency)
- Platelets > 10000 K/µL (polycythemia vera, extremely rare)

Contextual Implausibility:
- Patient age 5 months: reference ranges from adult
- Patient gender unknown: using gender-specific ranges

Validation Output:

Pass:
{
  "is_valid": true,
  "errors": [],
  "warnings": []
}

Fail:
{
  "is_valid": false,
  "errors": [
    {
      "field": "patient_info.age",
      "issue": "age_invalid",
      "message": "Age 350 is implausible (max 150)",
      "value": 350,
      "suggestion": "correct to 35 or 53"
    }
  ],
  "warnings": [
    {
      "field": "extracted_tests[3].status",
      "issue": "inconsistent_inference",
      "message": "Value 7.1 should be HIGH but marked as NORMAL",
      "suggestion": "verify reference range and value"
    }
  ]
}
```

---

## 12. Error Handling

```
ERROR HANDLING STRATEGY

Error Categories & Recovery:

1. OCR QUALITY ERRORS

Issue: Insufficient text extracted (< 500 characters)
Detection: len(ocr_text) < 500
Response: "low_ocr_quality"
User Message: "Image quality too low. Please re-upload a clearer image."
Action: Reject extraction, ask for re-upload
Confidence: 0

Issue: No medical data found in text
Detection: No recognized medical parameters
Response: "no_medical_data"
User Message: "No medical test results found. Verify file is a medical report."
Action: Manual review required
Confidence: 0

Issue: File format not recognized
Detection: File not PDF/JPEG/PNG/BMP
Response: "unsupported_format"
User Message: "File type not supported. Upload PDF or image files only."
Action: Reject upload
Confidence: 0

2. DATA EXTRACTION ERRORS

Issue: Unable to parse patient name
Detection: Name field is null or < 2 characters
Response: "missing_patient_name"
Severity: high
Suggestion: "Enter patient name manually"
Confidence: 0

Issue: Unable to determine report type
Detection: report_type = null
Response: "unknown_report_type"
Severity: medium
Suggestion: "Select report type manually (Blood Test, Thyroid, Lipid, etc.)"
Confidence: < 50

Issue: Date format ambiguous
Detection: Date could be DD/MM or MM/DD
Response: "ambiguous_date"
Severity: high
Suggestion: "Clarify date: is it 06/18/2026 or 18/06/2026?"
Confidence: 50-70

Issue: Value cannot be parsed as number
Detection: value field contains letters/symbols (excluding . or -)
Response: "non_numeric_value"
Severity: medium
Suggestion: "Remove units and symbols, keep numbers only"
Confidence: 0

Issue: Reference range malformed
Detection: range_low > range_high OR range is text "negative"
Response: "invalid_reference_range"
Severity: low
Suggestion: "Verify reference range values"
Confidence: 50

3. VALIDATION ERRORS

Issue: Value outside medical possibility range
Detection: value < min_possible OR value > max_possible
Response: "implausible_value"
Severity: high
Example: "Hemoglobin 500 g/dL is impossible"
Suggestion: "Verify value (likely typo or wrong unit)"
Confidence: 0

Issue: Age inconsistent with reference ranges
Detection: Age < 18 but using adult reference ranges
Response: "age_range_mismatch"
Severity: medium
Suggestion: "Age may require different reference ranges"
Confidence: 50

Issue: Gender-specific parameter but gender unknown
Detection: parameter requires gender but gender = null
Response: "gender_unknown_for_parameter"
Severity: low
Suggestion: "Enter patient gender for accurate analysis"
Confidence: 70

4. CONFIDENCE ERRORS

Issue: Overall confidence too low
Detection: overall_confidence < 50
Response: "low_overall_confidence"
Severity: high
Action: Mark for manual entry
Message: "Extraction confidence too low. Please manually enter values."
Suggestion: Show all fields for manual correction

Issue: Multiple fields with low confidence
Detection: > 30% fields with confidence < 70
Response: "widespread_low_confidence"
Severity: high
Action: Require manual review of all fields

5. PARSING ERRORS

Issue: JSON parsing fails
Detection: LLM response is not valid JSON
Response: "invalid_json_response"
Severity: critical
Recovery: Retry with system prompt refresh
Max retries: 3

Issue: Required fields missing
Detection: Missing required_field in output
Response: "missing_required_fields"
Severity: high
Recovery: Retry extraction for missing field
Suggestion: "Some fields could not be extracted"

Issue: Unexpected field values
Detection: value not in enum (e.g., status = "maybe")
Response: "unexpected_field_value"
Severity: medium
Recovery: Try to normalize or set to unknown

Error Response Format:

{
  "success": false,
  "error": {
    "code": "error_code",
    "message": "User-friendly error message",
    "severity": "critical|high|medium|low",
    "details": {
      "field": "field_name",
      "value": "problematic_value",
      "expected": "expected_format"
    },
    "suggestion": "How to fix this",
    "retry_possible": true|false,
    "next_step": "manual_entry|re_upload|correction"
  }
}

Handling Strategies:

For Severity = critical:
1. Stop processing
2. Return error to user
3. Offer: retry, manual entry, or re-upload
4. Log for debugging

For Severity = high:
1. Continue with best guess
2. Mark field for review_required
3. Add to warnings
4. Reduce confidence score
5. Request user correction

For Severity = medium:
1. Continue processing
2. Use inferred/default value
3. Add to warnings
4. Suggest to user

For Severity = low:
1. Continue silently
2. Optional warning if confidence very low
3. No action required
```

---

## 13. Retry Strategy

```
RETRY STRATEGY FOR FAILED EXTRACTION

Retry Conditions:

1. API Timeout or Rate Limit
- Condition: LLM API timeout (> 30 seconds) or rate limit (429)
- Wait before retry: Exponential backoff
- Retry schedule:
  - Attempt 1: Immediate
  - Attempt 2: Wait 5 seconds
  - Attempt 3: Wait 15 seconds
  - Attempt 4: Wait 30 seconds
  - Max retries: 4
- Recovery action: Use fallback OCR (GCP Vision or Tesseract)

2. Invalid JSON Response
- Condition: LLM returns non-JSON or malformed JSON
- Retry limit: 3
- Between retries: 2 second delay
- Recovery action: Extract data manually from raw response

3. Missing Required Fields
- Condition: One or more required fields are null
- Retry limit: 1 (for specific field extraction)
- Recovery action: Ask user to provide missing value

4. Low OCR Confidence
- Condition: overall_confidence < 50
- Retry with: Enhanced OCR (try GCP Vision if Tesseract was primary)
- Retry limit: 1
- Recovery action: Request user manual entry

5. Ambiguous Date
- Condition: Date format unclear (DD/MM vs MM/DD)
- Retry: Query LLM specifically for date clarification
- Retry limit: 1
- Recovery action: Ask user to clarify date

Retry Flow:

```
Start Extraction
    │
    ├─> OCR Text Extraction
    │   ├─> Success? Yes ──> Continue
    │   └─> Fail? ──> Retry OCR with fallback
    │        ├─> Max retries? ──> Reject file
    │        └─> Success? ──> Continue
    │
    ├─> LLM Parsing
    │   ├─> API timeout? ──> Retry with backoff
    │   │   ├─> Max retries? ──> Use fallback OCR
    │   │   └─> Success? ──> Continue
    │   │
    │   ├─> Invalid JSON? ──> Retry LLM
    │   │   ├─> Max retries? ──> Extract manually
    │   │   └─> Success? ──> Continue
    │   │
    │   └─> Success? ──> Continue
    │
    ├─> Confidence Scoring
    │   ├─> overall_confidence >= 50? ──> Continue
    │   └─> overall_confidence < 50? ──> Retry with enhanced OCR
    │       ├─> Max retries? ──> Manual entry required
    │       └─> Success? ──> Continue
    │
    ├─> Validation
    │   ├─> All valid? ──> Continue
    │   └─> Has errors?
    │       ├─> Critical? ──> Request manual entry
    │       └─> High? ──> Flag for review
    │
    └─> Return Results
        ├─> extraction_status: "completed"
        ├─> review_required: [fields]
        └─> confidence: score
```

Retry Backoff Algorithm:

```python
def retry_with_backoff(max_retries=3):
    backoff_times = [0, 2, 5, 15, 30]  # seconds
    
    for attempt in range(max_retries + 1):
        try:
            result = attempt_extraction()
            return result
        except Exception as e:
            if attempt >= max_retries:
                raise ExtractionFailedError(f"Failed after {max_retries} retries: {e}")
            
            wait_time = backoff_times[attempt]
            logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time}s: {e}")
            time.sleep(wait_time)
    
    # If we exit loop, extraction failed
    return None
```

Fallback Strategies:

Primary fails? → Fallback 1 (GCP Vision)
Fallback 1 fails? → Fallback 2 (Tesseract)
Fallback 2 fails? → Manual Entry Required

Logging & Monitoring:

For each retry:
- Log: timestamp, attempt #, error, recovery strategy
- Track: failure rate by error type
- Alert if: same file retried > 2 times
- Monitor: API response time, success rate per provider

User Communication:

Attempt 1 (transparent): Process silently
Attempt 2+: Show progress indicator
  "Processing report... (attempt 2/4)"

After max retries:
- If critical error: "Failed to process. Please re-upload."
- If low confidence: "Image too unclear. Please provide a clearer photo."
- If missing data: "Could not extract all data. Please enter manually."

Success Metrics:

Track & report:
- Success rate: 85%+ for first attempt
- Retry rate: <10% of extractions
- Final success rate: 95%+ after retries
- Avg time: < 30 seconds per extraction
```

---

## 14. Low-Confidence Flagging Strategy

```
LOW-CONFIDENCE VALUE FLAGGING

Threshold-Based Flagging:

Overall Confidence:
- >= 90%: ✅ Green - Excellent (auto-save eligible)
- 70-89%: ⚠️  Yellow - Good (minor review suggested)
- 50-69%: ⚠️⚠️ Orange - Fair (manual review recommended)
- < 50%: ❌ Red - Poor (manual entry required)

Field-Level Confidence:
- >= 85%: ✅ Green - Ready
- 70-84%: ⚠️  Yellow - Review suggested
- < 70%: ❌ Red - Review required (mark for edit)

Critical Fields (Always Flag if < 90%):
- patient_info.name
- patient_info.date_of_birth
- document_info.report_date
- extracted_tests[].value (if abnormal)

Automatic Flagging Rules:

Rule 1: Any field with confidence < 70%
→ Add to review_required array
→ Suggestion: "Verify this value"

Rule 2: High-value fields with < 85% confidence
→ Add to warnings
→ Severity: "warning"

Rule 3: Multiple fields flagged in same report
→ Increase overall severity
→ Example: if 3+ fields flagged → "manual review recommended"

Rule 4: Abnormal values with low confidence
→ Double-flag (critical priority)
→ Severity: "critical"
→ Example: HbA1c=7.1 (high) with 65% confidence
→ Message: "Abnormal value requires verification"

Rule 5: Missing critical data
→ Always flag
→ Example: patient name missing
→ Severity: "high"

Special Flagging Cases:

Ambiguous Reference Range:
- If reference_range_confidence < 70
- Add flag: "Reference range unclear"
- Suggestion: "Verify correct reference range for this lab"

Unclear Status:
- If status = "unknown" due to missing range
- Add flag: "Status cannot be determined"
- Suggestion: "Add reference range or mark status manually"

Unusual Values:
- Value > 3 standard deviations from expected
- Add flag: "Unusual value detected"
- Severity: "warning"
- Suggestion: "Verify this value is correct"

Flagging Output Format:

```json
{
  "review_required": [
    {
      "field": "patient_info.name",
      "reason": "low_confidence",
      "confidence": 45,
      "original_value": "Rajesh Ku...",
      "suggestion": "Name partially unclear. Verify full name.",
      "required_action": "user_correction"
    },
    {
      "field": "extracted_tests[0].value",
      "reason": "unusual_value",
      "confidence": 75,
      "original_value": "142",
      "suggestion": "Fasting glucose 142 is high. Verify.",
      "required_action": "user_confirmation"
    },
    {
      "field": "extracted_tests[7].reference_range_high",
      "reason": "missing_reference_range",
      "confidence": 50,
      "original_value": null,
      "suggestion": "Reference range missing. Add or mark as normal.",
      "required_action": "user_input"
    }
  ]
}
```

Color Coding for UI:

```html
<!-- Green: Ready -->
<span class="confidence-100">
  <span class="status-badge" style="background: #10b981;">✅</span>
  <span class="value">142</span>
  <span class="confidence">99%</span>
</span>

<!-- Yellow: Review suggested -->
<span class="confidence-75">
  <span class="status-badge" style="background: #f59e0b;">⚠️</span>
  <span class="value">45</span>
  <span class="confidence">72% - click to review</span>
</span>

<!-- Red: Review required -->
<span class="confidence-50">
  <span class="status-badge" style="background: #ef4444;">❌</span>
  <span class="value">Rajesh Ku...</span>
  <span class="confidence">45% - edit required</span>
</span>
```

User Actions for Flagged Fields:

Green (Confident):
- Click to edit (optional)
- Click to confirm (saves as-is)

Yellow (Some doubt):
- Tooltip: "This field had minor OCR issues"
- Edit button to correct if needed
- Confirm button to accept

Red (High doubt):
- Tooltip: "This field needs your review"
- Edit field is highlighted
- User MUST correct or confirm
- Cannot save without action

Flagging Workflow:

1. Extraction completes
2. System calculates all confidence scores
3. Identify fields to flag:
   - Any field with confidence < 70%
   - Abnormal values with low-medium confidence
   - Missing critical fields
4. Display flagged fields to user:
   - Color-coded badges
   - Explanatory tooltips
   - Edit prompts
5. User reviews and corrects
6. Final save when all flags resolved

Batch Flagging:

If >50% of fields flagged:
- Show message: "Many fields need review"
- Suggest: "Consider re-uploading a clearer image"
- Option: "Or manually enter all values"

If 100% of report flagged:
- Show message: "Report quality too low"
- Recommend: "Re-upload with clearer image"
- Or: "Enter all values manually"
```

---

## 15. Implementation Guide

### Quick Start

1. **Create API Endpoint**
```python
@app.post("/v1/extraction/extract")
async def extract_report(file_id: str, ocr_text: str):
    """Main extraction endpoint"""
    
    # 1. Prepare OCR text
    preprocessed_text = preprocess_ocr_text(ocr_text)
    
    # 2. Classify report type
    report_type = classify_report_type(preprocessed_text)
    
    # 3. Call Claude API
    extraction = call_claude_extraction(preprocessed_text, report_type)
    
    # 4. Validate response
    validate_extraction(extraction)
    
    # 5. Calculate confidence scores
    scoring = calculate_confidence_scores(extraction)
    
    # 6. Flag low-confidence fields
    flags = identify_review_required_fields(scoring)
    
    # 7. Save draft
    draft_id = save_extraction_draft(file_id, extraction, scoring, flags)
    
    return {
        "extraction_id": draft_id,
        "confidence": scoring.overall_score,
        "requires_review": len(flags) > 0
    }
```

2. **Test with Example**
- Use example OCR text from section 5
- Should match example output from section 6
- Confidence score should be ~96%
- review_required should have 1 item

3. **Deploy Safely**
- Test on 100 diverse medical reports first
- Validate accuracy before production
- Monitor success/failure rates
- Adjust thresholds based on data

4. **Monitor & Improve**
- Track extraction success rate (target: 85%+)
- Track average confidence scores
- Track most common flagged fields
- Iterate on prompts if needed

---

This comprehensive system is production-ready and can be implemented immediately with Claude 3.5 Sonnet or GPT-4V.
