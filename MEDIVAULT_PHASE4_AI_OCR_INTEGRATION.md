# MediVault Phase 4 — AI + OCR Integration Pipeline

> **Phase:** 4 — AI/OCR Processing
> **Status:** Architecture & Implementation Plan
> **Date:** June 2026
> **Audience:** Backend, ML, and DevOps developers

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Processing Pipeline Flow](#3-processing-pipeline-flow)
4. [OCR Tool Comparison](#4-ocr-tool-comparison)
5. [Recommended Solution](#5-recommended-solution)
6. [AI Parser Design](#6-ai-parser-design)
7. [Prompt Templates](#7-prompt-templates)
8. [JSON Output Schema](#8-json-output-schema)
9. [Confidence Scoring](#9-confidence-scoring)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [Database Schema Updates](#11-database-schema-updates)
12. [API Endpoints](#12-api-endpoints)
13. [Background Job Flow](#13-background-job-flow)
14. [File Processing States](#14-file-processing-states)
15. [Security & Privacy](#15-security--privacy)
16. [Medical Safety Rules](#16-medical-safety-rules)
17. [User Review Flow](#17-user-review-flow)
18. [Testing Strategy](#18-testing-strategy)
19. [Developer Task Breakdown](#19-developer-task-breakdown)
20. [Deployment Checklist](#20-deployment-checklist)

---

## 1. Executive Summary

### What This Phase Delivers

MediVault Phase 4 implements an AI-powered OCR and data extraction pipeline that:
- Converts unstructured medical reports (PDF, images, scans) into structured, analyzable data
- Uses combination of OCR (for text extraction) + LLM (for intelligent parsing)
- Generates confidence scores for all extracted values
- Allows users to review and correct before final save
- Handles 12 different medical report types
- Maintains full audit trail for compliance

### Key Principles

| Principle | Implementation |
|-----------|----------------|
| **Safety First** | AI extracts only, never diagnoses or prescribes |
| **User Control** | All AI output is editable before save |
| **Transparency** | Confidence scores on all values |
| **Accuracy** | Low-confidence values require review |
| **Compliance** | Full audit trail, encryption, HIPAA-ready |
| **Reliability** | Graceful fallback for OCR failures |

### Timeline

- **Architecture Phase**: 1 week
- **Development**: 4-5 weeks
- **Testing & QA**: 1-2 weeks
- **Deployment**: 1 week
- **Total**: 7-9 weeks

---

## 2. Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER UPLOAD                             │
│              (Web App / Mobile App / API)                       │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FILE UPLOAD SERVICE                          │
│  - Validate file type & size                                   │
│  - Scan for malware                                            │
│  - Store in S3/GCS                                             │
│  - Generate presigned URLs                                     │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKGROUND JOB QUEUE (Celery/Redis)                │
│  - Enqueue extraction job                                      │
│  - Set status: processing                                      │
│  - Estimate processing time                                    │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  OCR + AI EXTRACTION WORKER                     │
│                                                                 │
│  Step 1: Download file from S3/GCS                            │
│  Step 2: Detect report type & file format                     │
│  Step 3: OCR text extraction                                  │
│          ├── PDFs: PyPDF2 + Tesseract + GCP Vision            │
│          ├── Images: GCP Vision / AWS Textract               │
│          └── Scans: OpenCV preprocessing + OCR               │
│  Step 4: Parse extracted text with LLM                       │
│  Step 5: Generate confidence scores                          │
│  Step 6: Create structured JSON                              │
│  Step 7: Save draft extraction                               │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE UPDATES                                   │
│  - Save extracted data as DRAFT                               │
│  - Create review entry for user                               │
│  - Update file status                                         │
│  - Store confidence scores                                    │
│  - Create audit log                                           │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER REVIEW & CORRECTION                           │
│  - Show extracted data with confidence colors                 │
│  - Allow user to edit values                                  │
│  - Show original report side-by-side                          │
│  - Highlight low-confidence values                            │
│  - Allow value confirmation                                   │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              FINAL SAVE & INDEXING                              │
│  - Save final (user-confirmed) data                           │
│  - Update status: completed                                   │
│  - Index for search                                           │
│  - Generate thumbnails                                        │
│  - Create analytics event                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Reason |
|-----------|-----------|--------|
| **OCR** | Google Cloud Vision API + Tesseract | High accuracy for medical documents |
| **LLM** | Claude 3.5 Sonnet / GPT-4V | Medical knowledge + vision understanding |
| **Queue** | Celery + Redis | Async processing, scalable |
| **Storage** | AWS S3 / GCS | Durable, cost-effective, secure |
| **Database** | PostgreSQL | ACID compliance, relational data |
| **File Processing** | OpenCV | Image preprocessing |
| **Async Framework** | FastAPI background tasks | Simple alternative to Celery |

---

## 3. Processing Pipeline Flow

### Complete Step-by-Step Process

```
1. USER UPLOADS FILE
   └─> Validation (file type, size < 20MB)
   └─> Malware scan
   └─> Store in S3/GCS
   └─> Create file record in DB
   └─> Set status: "uploaded"

2. ENQUEUE BACKGROUND JOB
   └─> Create job in Celery queue
   └─> Set status: "queued"
   └─> Return job_id to user

3. DETECT FILE CONTENT
   └─> Identify actual format (not just extension)
   └─> Determine if: PDF / Image / Scan / Document
   └─> Route to appropriate OCR pipeline

4. OCR TEXT EXTRACTION
   
   For PDF files:
   └─> Try: PyPDF2 text extraction (fast)
   └─> If empty text: Convert PDF pages to images
   └─> Use: Tesseract + GCP Vision (parallel)
   └─> Merge results, validate quality
   
   For Images:
   └─> Use: GCP Vision API (supports medical documents)
   └─> Apply: AWS Textract as fallback
   └─> Return: Extracted text + confidence
   
   For Scans:
   └─> Preprocess: Deskew, denoise, binarize (OpenCV)
   └─> Use: Tesseract (free, good for scans)
   └─> Follow with: GCP Vision to verify

5. VALIDATE OCR QUALITY
   └─> Check: Min character count (e.g., 500 chars)
   └─> Check: Medical keywords present (diabetes, glucose, etc.)
   └─> If poor: Set flag for manual review
   └─> If acceptable: Proceed to parsing

6. PARSE WITH LLM
   └─> Send: Extracted text to Claude API
   └─> Include: Prompt with medical extraction instructions
   └─> Receive: Structured JSON with confidence scores
   └─> Validate: JSON schema compliance

7. GENERATE CONFIDENCE SCORES
   └─> For each field: Calculate confidence (0-100)
   └─> Factor in: OCR confidence, LLM confidence, validation
   └─> Mark: Fields < 70% for review
   └─> Show: Color coding: Green (90%+), Yellow (70-90%), Red (<70%)

8. SAVE DRAFT EXTRACTION
   └─> Create: extracted_values records (status: draft)
   └─> Store: Original OCR text
   └─> Store: LLM response
   └─> Store: Confidence scores
   └─> Create: Review notification for user

9. UPDATE STATUS & NOTIFY
   └─> Set: processing_status = "review_pending"
   └─> Send: Notification to user (email / push)
   └─> Show: Dashboard alert

10. USER REVIEWS DATA
    └─> See: Extracted data with confidence colors
    └─> See: Original report side-by-side
    └─> Can: Edit any value
    └─> Can: Confirm or reject values
    └─> Can: Flag low-confidence values

11. FINAL SAVE
    └─> Update: Status to "completed"
    └─> Save: User-confirmed values as final
    └─> Create: Audit log entries
    └─> Index: For search
    └─> Archive: Processing artifacts

12. CLEANUP
    └─> Delete: Temporary files
    └─> Compress: Original report
    └─> Update: Analytics

Processing Time: 10-60 seconds per document (depending on OCR tool)
```

---

## 4. OCR Tool Comparison

### Available Options

| Tool | Cost | Accuracy | Speed | Medical Focus | API | Offline |
|------|------|----------|-------|--------------|-----|---------|
| **Google Cloud Vision** | Pay-per-API | 95%+ | Fast | Moderate | Yes | No |
| **AWS Textract** | Pay-per-page | 95%+ | Fast | Moderate | Yes | No |
| **Tesseract (free)** | Free | 85-90% | Slow | Low | CLI | Yes |
| **Azure Computer Vision** | Pay-per-API | 95%+ | Fast | Moderate | Yes | No |
| **Claude 3.5 Vision** | Pay-per-image | 98%+ | Fast | HIGH | Yes | No |
| **GPT-4V** | Pay-per-token | 96%+ | Fast | HIGH | Yes | No |

### Detailed Comparison

#### Google Cloud Vision API
**Pros:**
- ✅ Excellent for document OCR (dedicated Document AI)
- ✅ Medical documents: 95%+ accuracy
- ✅ Fast processing (< 5 seconds)
- ✅ Structured output support
- ✅ Good free tier for testing

**Cons:**
- ❌ Cost: $15 per 1000 requests (Document AI: $60 per 1000 pages)
- ❌ Requires Google Cloud account
- ❌ Network dependency

**Best for:** Images, PDFs, general OCR

#### Tesseract (Open Source)
**Pros:**
- ✅ 100% free
- ✅ Works offline
- ✅ Can run locally
- ✅ Open source, customizable

**Cons:**
- ❌ Lower accuracy (85-90%)
- ❌ Slower processing (10-30 seconds)
- ❌ Requires preprocessing for quality
- ❌ Medical document understanding: limited

**Best for:** Prototype, cost-sensitive, offline processing

#### Claude 3.5 Vision (RECOMMENDED)
**Pros:**
- ✅ Medical knowledge built-in
- ✅ Can understand context (medical terminology, units, reference ranges)
- ✅ Can parse complex medical documents
- ✅ Same API for both OCR + parsing (single call)
- ✅ Excellent for medical safety rules
- ✅ Can generate confidence scores in response

**Cons:**
- ❌ Cost: $0.03 per image + LLM processing
- ❌ Network dependency
- ❌ Rate limits (but sufficient for MVP)

**Best for:** Medical documents, combined OCR + parsing, safety-first approach

---

## 5. Recommended Solution

### Architecture Decision: Hybrid Approach

**For MVP + Production:**

```
Tier 1 (Primary): Claude 3.5 Vision
├─ OCR: Extract text + medical understanding
├─ Parsing: Extract structured data in single call
├─ Safety: Enforce medical rules
└─ Cost: ~$0.03 per document

Tier 2 (Fallback): Google Cloud Vision + Tesseract
├─ Use when: Claude unavailable or rate-limited
├─ OCR quality: Better for very poor quality scans
└─ Cost: Low per-document

Tier 3 (Manual): User review + correction
├─ For: Low-confidence results (< 70%)
├─ User can: Edit all values before save
└─ Cost: Human time
```

### Why Claude 3.5 Vision + Custom Prompt

**1. Single API Call for OCR + Parsing**
```
Traditional approach:
  1. OCR text extraction (GCP/AWS)
  2. Send text to LLM for parsing
  3. Result: 2 API calls, 2 potential failures

Claude approach:
  1. Send image directly to Claude
  2. Claude: "Read this medical report and extract..."
  3. Result: 1 API call, immediate structured response
```

**2. Medical Understanding**
- Claude trained on medical knowledge
- Understands reference ranges, units, normal values
- Can contextualize values (e.g., "HbA1c 7.1% is high for diabetes")
- Can generate medical safety warnings

**3. Cost Effective**
- ~$0.03 per image (OCR + parsing combined)
- vs. $0.15 per page with GCP Vision + LLM separately
- For 1000 documents: ~$30 vs. ~$150

**4. Safety Built-In**
- Can enforce rules in prompt
- Can flag medical concerns
- Can validate data integrity
- Can generate confidence scores

---

## 6. AI Parser Design

### Overview

The AI parser is a multi-stage system that:
1. Receives raw text from OCR
2. Identifies report type
3. Extracts medical data
4. Generates confidence scores
5. Returns structured JSON

### Parser Components

```
┌─────────────────────────────────────────────────┐
│            INPUT: Raw OCR Text                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         STAGE 1: DOCUMENT CLASSIFICATION        │
│                                                 │
│  Identify: Blood test / Thyroid / Lipid / etc   │
│  Confidence: 90-100% (usually clear from header)│
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│     STAGE 2: EXTRACT BASIC METADATA             │
│                                                 │
│  Patient name, DOB, age, phone                 │
│  Lab name, address, contact                    │
│  Doctor name, specialty                        │
│  Report date, sample collection date           │
│  Report ID, barcode number                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│     STAGE 3: EXTRACT TEST PARAMETERS            │
│                                                 │
│  For each parameter:                           │
│  - Parameter name (e.g., "HbA1c")             │
│  - Value (e.g., "7.1")                        │
│  - Unit (e.g., "%")                           │
│  - Reference range (e.g., "4.0-5.7")          │
│  - Status (normal/high/low/critical)          │
│  - Confidence score (0-100)                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│     STAGE 4: VALIDATE & SCORE                   │
│                                                 │
│  Check: Values within reasonable ranges       │
│  Check: Units are standard/recognized         │
│  Check: Reference ranges are valid            │
│  Flag: Any anomalies or concerns              │
│  Generate: Per-field confidence scores        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│      OUTPUT: Structured JSON with Scores       │
└─────────────────────────────────────────────────┘
```

### Processing Logic

```python
class MedicalReportParser:
    """
    Parses medical reports using AI + validation rules.
    """
    
    def parse(self, ocr_text: str, report_type: str = None) -> ParsedReport:
        """
        Main parsing entrypoint.
        
        Args:
            ocr_text: Raw text from OCR
            report_type: Optional hint (blood_test, thyroid, etc.)
        
        Returns:
            ParsedReport with structured data and confidence scores
        """
        
        # Step 1: Send to LLM with structured prompt
        response = self.call_llm(ocr_text, report_type)
        
        # Step 2: Parse LLM response into JSON
        parsed_data = self.parse_response(response)
        
        # Step 3: Validate extracted data
        validated_data = self.validate(parsed_data)
        
        # Step 4: Calculate confidence scores
        scored_data = self.calculate_confidence(validated_data)
        
        # Step 5: Return structured result
        return ParsedReport(
            extracted_values=scored_data.values,
            metadata=scored_data.metadata,
            confidence_scores=scored_data.scores,
            warnings=scored_data.warnings,
            quality_score=scored_data.overall_confidence
        )
    
    def call_llm(self, text: str, hint: str = None) -> dict:
        """
        Send text to Claude for structured extraction.
        Uses Claude's JSON mode for guaranteed structure.
        """
        # See prompt design section below
        prompt = self.build_prompt(text, hint)
        
        response = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        # Parse JSON response
        return json.loads(response.content[0].text)
    
    def validate(self, data: dict) -> dict:
        """
        Validate extracted data against medical rules.
        """
        
        # Validate patient data
        if data.get('patient_name'):
            if len(data['patient_name']) > 150:
                data['patient_name_confidence'] = 0  # Flag as unreliable
        
        # Validate medical values
        for value in data.get('extracted_values', []):
            # Check: Value is numeric
            try:
                float(value['value'])
            except:
                value['confidence'] = 0
            
            # Check: Unit is recognized
            if not self.is_standard_unit(value['unit']):
                value['confidence'] = value['confidence'] * 0.8
            
            # Check: Reference range is valid
            if value.get('reference_range_low') and value.get('reference_range_high'):
                if float(value['reference_range_low']) > float(value['reference_range_high']):
                    value['confidence'] = 0  # Invalid range
        
        return data
    
    def calculate_confidence(self, data: dict) -> dict:
        """
        Calculate overall and per-field confidence scores.
        """
        
        field_confidences = {}
        
        # Base confidence from LLM (0-100)
        for field, value in data.items():
            if isinstance(value, dict) and 'confidence' in value:
                confidence = value['confidence']
            else:
                confidence = 85  # Default for simple fields
            
            # Adjust based on field importance and validation
            if field in ['patient_name', 'report_date']:
                confidence = min(confidence, 95)  # Critical fields
            
            if field in ['extracted_values']:
                # For array fields, use lowest confidence value
                if isinstance(value, list):
                    confidence = min(v.get('confidence', 85) for v in value) if value else 0
            
            field_confidences[field] = confidence
        
        # Overall confidence (weighted average)
        weights = {
            'report_type': 0.15,
            'patient_name': 0.15,
            'report_date': 0.10,
            'extracted_values': 0.60
        }
        
        overall = sum(
            field_confidences.get(f, 0) * w
            for f, w in weights.items()
        ) / sum(weights.values())
        
        return {
            'data': data,
            'field_confidences': field_confidences,
            'overall_confidence': overall
        }
```

---

## 7. Prompt Templates

### Master Prompt for Claude Vision

```python
MEDICAL_EXTRACTION_PROMPT = """
You are an expert medical document analyzer. Your task is to extract structured data from medical reports.

IMPORTANT RULES:
1. Extract ONLY what you see in the document - do not infer or assume
2. If you cannot find a value, set it to null (not empty string)
3. For each extracted value, provide a confidence score (0-100)
   - 100: Clearly visible, unambiguous
   - 80-99: Visible but slightly unclear
   - 60-79: Reasonable interpretation, some uncertainty
   - <60: Poor visibility or unclear, requires review
4. Always extract the ORIGINAL value from the document, even if it seems unusual
5. Include reference ranges exactly as shown in the document
6. Never provide medical advice or diagnosis
7. Flag any values that appear incorrect or unusual with a warning

REPORT TYPE HINTS:
- If the document appears to be a {report_type}, prioritize relevant fields
- If unsure about type, determine from document headers and test names

EXTRACT THE FOLLOWING STRUCTURE:

{{
  "document_type": "blood_test|thyroid|lipid|diabetes|liver|kidney|vitamin|urine|prescription|discharge|imaging|other",
  "document_type_confidence": 0-100,
  
  "patient_info": {{
    "name": "full name or null",
    "name_confidence": 0-100,
    "age": "number or null",
    "age_confidence": 0-100,
    "date_of_birth": "YYYY-MM-DD or null",
    "dob_confidence": 0-100,
    "gender": "M|F|Other|null",
    "gender_confidence": 0-100,
    "patient_id": "ID or null",
    "patient_id_confidence": 0-100
  }},
  
  "lab_info": {{
    "lab_name": "name or null",
    "lab_name_confidence": 0-100,
    "lab_address": "address or null",
    "lab_phone": "phone or null",
    "lab_phone_confidence": 0-100
  }},
  
  "doctor_info": {{
    "doctor_name": "name or null",
    "doctor_name_confidence": 0-100,
    "specialty": "specialty or null",
    "specialty_confidence": 0-100,
    "doctor_id": "ID or null"
  }},
  
  "report_dates": {{
    "report_date": "YYYY-MM-DD or null",
    "report_date_confidence": 0-100,
    "sample_collection_date": "YYYY-MM-DD or null",
    "sample_collection_confidence": 0-100,
    "report_id": "ID or null"
  }},
  
  "extracted_values": [
    {{
      "parameter_name": "e.g., HbA1c, Glucose, Hemoglobin",
      "parameter_confidence": 0-100,
      "value": "numeric value only",
      "value_confidence": 0-100,
      "unit": "e.g., %, mg/dL, g/dL",
      "unit_confidence": 0-100,
      "reference_range_low": "numeric or null",
      "reference_range_high": "numeric or null",
      "reference_range_text": "e.g., 4.0-5.7 or <100",
      "reference_confidence": 0-100,
      "status": "normal|high|low|critical|null",
      "status_confidence": 0-100,
      "notes": "any special notes from report or null"
    }}
  ],
  
  "warnings": [
    "List any anomalies, unusual values, or data quality concerns"
  ],
  
  "ocr_quality": {{
    "text_clarity": "excellent|good|fair|poor",
    "estimated_accuracy": 0-100,
    "issues": ["list any image quality issues"]
  }}
}}

SPECIFIC EXTRACTION RULES BY FIELD:

Patient Name:
- Look for: "Patient:", "Name:", "Patient Name:"
- Extract full name as shown
- If multiple names shown, use primary/most prominent
- Confidence factors: Clear formatting (+20%), Handwritten (-30%), Unclear printing (-20%)

Lab Values:
- Extract EXACT value from document
- If value is range (e.g., "5-7"), note in "value" field
- If value has comments (e.g., "HIGH"), include in notes, not in value field
- Use "status" field for normal/high/low based on reference range comparison

Reference Ranges:
- Extract both numbers if shown (e.g., "4.0-5.7")
- Handle non-numeric formats (e.g., "<100", ">10")
- If only lower or upper bound shown, set the other to null
- Store original text in "reference_range_text"

Units:
- Extract EXACTLY as shown in document
- Do not standardize or convert
- Common medical units: mg/dL, g/dL, %, mIU/L, pg/mL, U/L, etc.

Dates:
- Extract in YYYY-MM-DD format if possible
- If only month/year shown, use null (cannot infer exact date)
- Handle different date formats: DD/MM/YYYY, MM/DD/YYYY, etc.

REQUIRED: Output MUST be valid JSON that can be parsed.
If a section is not present in document, omit it or set values to null.
Never guess or infer values - if unsure, set confidence to <60 and mark for review.

---

Document text to analyze:
{ocr_text}

---

Respond with ONLY valid JSON, no additional text.
"""
```

### Report Type Detection Prompt

```python
REPORT_TYPE_DETECTION_PROMPT = """
Examine this medical document and identify its type.

Report types:
1. blood_test - Complete blood count, RBC, WBC, platelets
2. thyroid - TSH, T3, T4 levels
3. lipid - Cholesterol, HDL, LDL, triglycerides
4. diabetes - Glucose, HbA1c, fasting glucose
5. liver - SGOT, SGPT, alkaline phosphatase, bilirubin
6. kidney - Creatinine, BUN, uric acid
7. vitamin - Vitamin D, B12, folate levels
8. urine - Urinalysis results
9. prescription - Medicine/drug prescription
10. discharge - Hospital discharge summary
11. imaging - X-ray, CT, MRI, ultrasound report
12. other - Other medical document

Return JSON:
{{
  "detected_type": "type_from_list_above",
  "confidence": 0-100,
  "key_indicators": ["list tests/indicators that led to this classification"],
  "alternative_types": ["other possible types"],
  "reasoning": "brief explanation"
}}

Document:
{text}

Respond with ONLY valid JSON.
"""
```

---

## 8. JSON Output Schema

### Complete Response Schema

```typescript
// Extracted Report Data
interface ExtractedReport {
  // Metadata
  file_id: string;
  extraction_id: string;
  extraction_timestamp: ISO8601DateTime;
  ocr_engine: "claude_vision" | "gcp_vision" | "tesseract" | "manual";
  
  // Document classification
  document_type: ReportType;
  document_type_confidence: 0-100;
  
  // Patient information
  patient_info: {
    name: string | null;
    name_confidence: 0-100;
    date_of_birth: Date | null;
    dob_confidence: 0-100;
    age: number | null;
    age_confidence: 0-100;
    gender: "M" | "F" | "Other" | null;
    gender_confidence: 0-100;
    patient_id: string | null;
  };
  
  // Lab/facility information
  lab_info: {
    name: string | null;
    address: string | null;
    phone: string | null;
    lab_code: string | null;
  };
  
  // Healthcare provider information
  doctor_info: {
    name: string | null;
    specialty: string | null;
    registration_id: string | null;
  };
  
  // Report dates
  report_dates: {
    report_date: Date | null;
    report_date_confidence: 0-100;
    sample_collection_date: Date | null;
    sample_collection_confidence: 0-100;
    report_id: string | null;
  };
  
  // Extracted medical parameters
  extracted_values: ExtractedValue[];
  
  // Quality & confidence
  overall_confidence: 0-100;
  ocr_quality: {
    text_clarity: "excellent" | "good" | "fair" | "poor";
    estimated_accuracy: 0-100;
    issues: string[];
  };
  
  // Flags and warnings
  warnings: {
    type: "quality_issue" | "unusual_value" | "missing_data" | "inconsistency";
    field: string;
    message: string;
    severity: "info" | "warning" | "critical";
  }[];
  
  // Raw data for debugging
  raw_ocr_text: string;
  llm_response: object;
  processing_metadata: {
    processing_time_ms: number;
    ocr_processing_time_ms: number;
    llm_processing_time_ms: number;
    total_cost_usd: number;
  };
}

// Single extracted medical value
interface ExtractedValue {
  // Parameter identification
  parameter_name: string;
  parameter_name_confidence: 0-100;
  standardized_name: string | null; // e.g., "HbA1c" → "hemoglobin_a1c"
  
  // Measured value
  value: string | number;
  value_confidence: 0-100;
  
  // Unit of measurement
  unit: string;
  unit_confidence: 0-100;
  standardized_unit: string | null; // Standardized form if applicable
  
  // Reference/normal range
  reference_range_low: number | null;
  reference_range_high: number | null;
  reference_range_text: string | null; // Original format: "4.0-5.7", "<100", etc.
  reference_confidence: 0-100;
  
  // Status classification
  status: "normal" | "low" | "borderline" | "high" | "critical" | null;
  status_confidence: 0-100;
  
  // Additional info
  notes: string | null;
  method: string | null; // e.g., "HPLC", "spectrophotometry"
  
  // Quality flags
  requires_review: boolean; // true if confidence < 70 or unusual value
  is_critical: boolean; // true if status is "critical"
}

// Report type enum
type ReportType =
  | "blood_test"
  | "thyroid"
  | "lipid"
  | "diabetes"
  | "liver"
  | "kidney"
  | "vitamin"
  | "urine"
  | "prescription"
  | "discharge"
  | "imaging"
  | "other";
```

### Example Output

```json
{
  "file_id": "file_550e8400_e29b_41d4",
  "extraction_id": "extract_550e8400_f29b_51d4",
  "extraction_timestamp": "2026-06-22T10:30:00Z",
  "ocr_engine": "claude_vision",
  
  "document_type": "blood_test",
  "document_type_confidence": 98,
  
  "patient_info": {
    "name": "Rajesh Kumar",
    "name_confidence": 95,
    "date_of_birth": "1981-03-15",
    "dob_confidence": 90,
    "age": 45,
    "age_confidence": 95,
    "gender": "M",
    "gender_confidence": 85,
    "patient_id": "LAB-2026-12345"
  },
  
  "lab_info": {
    "name": "Apollo Diagnostics",
    "address": "123 Main St, City, State",
    "phone": "+91 8800999999",
    "lab_code": "APOLLO-001"
  },
  
  "doctor_info": {
    "name": "Dr. Sharma",
    "specialty": "Internal Medicine",
    "registration_id": "MCI-12345"
  },
  
  "report_dates": {
    "report_date": "2026-06-18",
    "report_date_confidence": 98,
    "sample_collection_date": "2026-06-17",
    "sample_collection_confidence": 85,
    "report_id": "RPT-2026-98765"
  },
  
  "extracted_values": [
    {
      "parameter_name": "Hemoglobin",
      "parameter_name_confidence": 99,
      "standardized_name": "hemoglobin",
      "value": "14.2",
      "value_confidence": 98,
      "unit": "g/dL",
      "unit_confidence": 99,
      "standardized_unit": "g/dL",
      "reference_range_low": 13.0,
      "reference_range_high": 17.0,
      "reference_range_text": "13.0-17.0",
      "reference_confidence": 95,
      "status": "normal",
      "status_confidence": 99,
      "notes": null,
      "method": "Automated Analyzer",
      "requires_review": false,
      "is_critical": false
    },
    {
      "parameter_name": "HbA1c",
      "parameter_name_confidence": 97,
      "standardized_name": "hemoglobin_a1c",
      "value": "7.1",
      "value_confidence": 96,
      "unit": "%",
      "unit_confidence": 99,
      "standardized_unit": "%",
      "reference_range_low": 4.0,
      "reference_range_high": 5.7,
      "reference_range_text": "<5.7",
      "reference_confidence": 90,
      "status": "high",
      "status_confidence": 98,
      "notes": "Indicates diabetes control needed",
      "method": "HPLC",
      "requires_review": false,
      "is_critical": false
    },
    {
      "parameter_name": "Vitamin D",
      "parameter_name_confidence": 65,
      "standardized_name": "vitamin_d",
      "value": "18",
      "value_confidence": 60,
      "unit": "ng/mL",
      "unit_confidence": 55,
      "standardized_unit": "ng/mL",
      "reference_range_low": 30,
      "reference_range_high": 100,
      "reference_range_text": "30-100",
      "reference_confidence": 70,
      "status": "low",
      "status_confidence": 65,
      "notes": "Image quality poor, requires verification",
      "method": null,
      "requires_review": true,
      "is_critical": false
    }
  ],
  
  "overall_confidence": 92,
  
  "ocr_quality": {
    "text_clarity": "good",
    "estimated_accuracy": 94,
    "issues": []
  },
  
  "warnings": [
    {
      "type": "quality_issue",
      "field": "vitamin_d",
      "message": "Low confidence due to image quality in this section",
      "severity": "warning"
    }
  ],
  
  "raw_ocr_text": "[full extracted text from OCR]",
  
  "processing_metadata": {
    "processing_time_ms": 4850,
    "ocr_processing_time_ms": 2100,
    "llm_processing_time_ms": 2750,
    "total_cost_usd": 0.03
  }
}
```

---

## 9. Confidence Scoring

### Confidence Algorithm

```
OVERALL CONFIDENCE = Weighted Average of Component Confidences

Components:
1. OCR Quality Confidence (20%)
   - Factor: Text clarity, OCR engine quality
   - Calculation:
     - Excellent clarity: 95%
     - Good clarity: 85%
     - Fair clarity: 70%
     - Poor clarity: 50%

2. Document Type Identification (10%)
   - Factor: How clearly identifiable is report type
   - Based on: Headers, test names, format
   - Range: 60-100%

3. Patient Info Confidence (10%)
   - Factor: Average confidence of name, DOB, age
   - Based on: Clarity, consistency, validation
   - Range: 50-100%

4. Lab/Doctor Info Confidence (10%)
   - Factor: Presence and clarity of facility info
   - Based on: Header clarity, consistency
   - Range: 0-100%

5. Extracted Values Confidence (50%)
   - Factor: Average of all parameter confidences
   - Weighted by: Criticality and usage frequency
   - Range: 0-100%

CALCULATION:
overall_confidence = (
  0.20 * ocr_quality_score +
  0.10 * document_type_confidence +
  0.10 * patient_info_confidence +
  0.10 * lab_info_confidence +
  0.50 * extracted_values_confidence
)

CONFIDENCE RATING THRESHOLDS:
- 90-100: Excellent - Ready for automated use
- 70-89: Good - Minor review may be needed
- 50-69: Fair - Manual review recommended
- <50: Poor - Requires manual correction
```

### Per-Field Confidence Scoring

For each extracted value:

```
field_confidence = (
  ocr_confidence * 0.4 +      // How clearly visible
  llm_confidence * 0.3 +      // LLM's parsing confidence
  validation_confidence * 0.3 // Based on validation rules
)

Validation Confidence Factors:
- Value is numeric: +10
- Value within expected range: +10
- Reference range is valid: +10
- Unit is recognized: +5
- Parameter name is standard: +5
- No unusual flags: +10
- Value matches expectations: +10

Penalties:
- Low OCR quality in this section: -20
- Value outside normal range: -10
- Unit not recognized: -15
- Parameter name ambiguous: -15
- Suspicious/unusual value: -20
```

### Color Coding for UI

```
Confidence >= 90%: Green     ✅ Ready
Confidence 70-89%: Yellow    ⚠️  Review
Confidence <70%:   Red       ❌ Edit Required
```

---

## 10. Error Handling Strategy

### Error Scenarios & Recovery

```
┌─────────────────────────────────────────────────────────┐
│             ERROR HANDLING MATRIX                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ SCENARIO 1: Invalid File Format                        │
│ ├─ Detection: File not PDF/Image/Scan                 │
│ ├─ Action: Reject upload                              │
│ ├─ User Message: "Unsupported file type"              │
│ └─ Status: uploaded_failed                            │
│                                                         │
│ SCENARIO 2: File Too Large (>20MB)                    │
│ ├─ Detection: File size validation                     │
│ ├─ Action: Reject upload                              │
│ ├─ User Message: "File exceeds 20MB limit"            │
│ └─ Status: uploaded_failed                            │
│                                                         │
│ SCENARIO 3: Corrupted PDF                             │
│ ├─ Detection: PyPDF2 extraction fails                 │
│ ├─ Action: Route to image-based OCR                   │
│ ├─ Fallback: Convert PDF to images → Vision API      │
│ └─ Status: processing (continue)                      │
│                                                         │
│ SCENARIO 4: Low OCR Quality (<50%)                    │
│ ├─ Detection: Insufficient text extracted             │
│ ├─ Action: Flag for manual review                     │
│ ├─ User Message: "Image quality too low"             │
│ └─ Status: review_pending (manual)                    │
│                                                         │
│ SCENARIO 5: LLM API Timeout                           │
│ ├─ Detection: Claude API request fails                │
│ ├─ Action: Retry with exponential backoff             │
│ ├─ Fallback: Route to Tesseract + GCP Vision         │
│ └─ Retry: Up to 3 times, then manual review          │
│                                                         │
│ SCENARIO 6: Poor Confidence (<70%)                    │
│ ├─ Detection: Overall confidence < threshold          │
│ ├─ Action: Mark fields requiring review               │
│ ├─ User Message: Highlight red fields                │
│ └─ Status: review_pending (user correction)          │
│                                                         │
│ SCENARIO 7: Malware Detected                          │
│ ├─ Detection: ClamAV/VirusTotal scan                 │
│ ├─ Action: Reject upload, log incident                │
│ ├─ User Message: "File failed security scan"         │
│ └─ Status: uploaded_failed (security)                │
│                                                         │
│ SCENARIO 8: Network Error in OCR                      │
│ ├─ Detection: Vision API connectivity fails           │
│ ├─ Action: Retry with exponential backoff             │
│ ├─ Fallback: Use local Tesseract                     │
│ └─ Retry: Queue for retry (hourly)                   │
│                                                         │
│ SCENARIO 9: No Medical Data Found                     │
│ ├─ Detection: extracted_values array is empty         │
│ ├─ Action: Flag for review                            │
│ ├─ User Message: "No test results found"             │
│ └─ Status: review_pending (possibly not a report)    │
│                                                         │
│ SCENARIO 10: Duplicate Detection                      │
│ ├─ Detection: Hash match with existing file           │
│ ├─ Action: Ask user to confirm (not re-process)      │
│ ├─ User Message: "This file was already uploaded"    │
│ └─ Status: duplicate_detected                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Implementation Details

```python
class ExtractionErrorHandler:
    """
    Handles errors during document extraction with recovery strategies.
    """
    
    MAX_RETRIES = 3
    RETRY_BACKOFF = [1, 5, 15]  # seconds
    
    async def handle_ocr_failure(self, file_id: str, error: Exception):
        """
        Handle OCR processing failure.
        """
        
        # Log error
        logger.error(f"OCR failed for {file_id}: {error}")
        
        # Determine fallback strategy
        if error == PDFParsingError:
            # Try image-based OCR
            return await self.fallback_to_vision_api(file_id)
        
        elif error == APITimeout:
            # Retry with backoff
            return await self.retry_with_backoff(file_id)
        
        elif error == MalwareDetected:
            # Reject file, log incident
            return await self.reject_file(file_id, "security_violation")
        
        else:
            # Mark for manual review
            return await self.mark_for_manual_review(file_id, str(error))
    
    async def handle_low_confidence(self, extraction_id: str, confidence: float):
        """
        Handle low confidence in extracted data.
        """
        
        if confidence < 50:
            # Quality too low, mark for manual entry
            await self.db.update_extraction(
                extraction_id,
                status="review_pending",
                requires_manual_entry=True
            )
            return "manual_entry_required"
        
        elif confidence < 70:
            # Fair confidence, highlight fields for review
            extraction = await self.db.get_extraction(extraction_id)
            
            # Mark low-confidence fields
            for value in extraction['extracted_values']:
                if value['confidence'] < 70:
                    value['requires_review'] = True
            
            await self.db.update_extraction(extraction_id, **extraction)
            return "user_review_recommended"
        
        else:
            # Good confidence, proceed
            return "acceptable"
    
    async def retry_with_backoff(self, file_id: str):
        """
        Retry failed processing with exponential backoff.
        """
        
        for attempt in range(self.MAX_RETRIES):
            try:
                wait_time = self.RETRY_BACKOFF[attempt]
                await asyncio.sleep(wait_time)
                
                return await self.process_file(file_id)
            
            except Exception as e:
                logger.warning(f"Retry {attempt + 1}/{self.MAX_RETRIES} failed: {e}")
                
                if attempt == self.MAX_RETRIES - 1:
                    # Final retry failed
                    await self.mark_for_manual_review(file_id, f"API failures after {self.MAX_RETRIES} retries")
                    return "manual_review_required"
    
    async def fallback_to_vision_api(self, file_id: str):
        """
        Fall back to GCP Vision API if primary OCR fails.
        """
        
        try:
            extraction = await self.gcp_vision_extract(file_id)
            logger.info(f"Fallback Vision API succeeded for {file_id}")
            return extraction
        except Exception as e:
            logger.error(f"Fallback Vision API also failed: {e}")
            await self.mark_for_manual_review(file_id, f"All OCR methods failed: {e}")
            return None
```

---

## 11. Database Schema Updates

### New/Updated Tables

```sql
-- Extraction drafts (new table)
CREATE TABLE extracted_data_drafts (
    id UUID PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES uploaded_files(id),
    report_id UUID REFERENCES medical_reports(id),
    extraction_status VARCHAR(50) NOT NULL DEFAULT 'draft',
    
    -- Extracted data (JSON)
    extracted_json JSONB NOT NULL,
    raw_ocr_text TEXT,
    llm_response JSONB,
    
    -- Confidence & quality
    overall_confidence DECIMAL(5, 2),
    ocr_quality_score DECIMAL(5, 2),
    requires_review BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    ocr_engine VARCHAR(50),
    processing_time_ms INTEGER,
    total_cost_usd DECIMAL(8, 4),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT extraction_status_valid CHECK (
        extraction_status IN (
            'processing', 'completed', 'low_quality',
            'api_error', 'manual_review_required', 'duplicate'
        )
    )
);

-- Update medical_reports to include processing status
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS
    ai_confidence_score DECIMAL(5, 2),
    processing_status VARCHAR(50) DEFAULT 'uploaded',
    extraction_draft_id UUID REFERENCES extracted_data_drafts(id),
    extraction_completed_at TIMESTAMP;

-- Index for efficient queries
CREATE INDEX idx_extracted_data_drafts_file_id ON extracted_data_drafts(file_id);
CREATE INDEX idx_extracted_data_drafts_report_id ON extracted_data_drafts(report_id);
CREATE INDEX idx_extracted_data_drafts_status ON extracted_data_drafts(extraction_status);
CREATE INDEX idx_extracted_data_drafts_requires_review ON extracted_data_drafts(requires_review);

-- Index for efficient JSON queries
CREATE INDEX idx_extracted_data_json_confidence
    ON extracted_data_drafts USING GIN (extracted_json);

-- Extracted values detail table (for search/analytics)
CREATE TABLE extracted_values (
    id UUID PRIMARY KEY,
    draft_id UUID NOT NULL REFERENCES extracted_data_drafts(id) ON DELETE CASCADE,
    
    parameter_name VARCHAR(200) NOT NULL,
    standardized_name VARCHAR(200),
    value VARCHAR(100),
    unit VARCHAR(50),
    
    reference_range_low DECIMAL(10, 3),
    reference_range_high DECIMAL(10, 3),
    
    status VARCHAR(50),  -- normal, high, low, critical
    confidence DECIMAL(5, 2),
    requires_review BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_extracted_values_draft_id (draft_id),
    INDEX idx_extracted_values_param_name (parameter_name),
    INDEX idx_extracted_values_status (status)
);

-- Extraction errors log
CREATE TABLE extraction_errors (
    id UUID PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES uploaded_files(id),
    error_type VARCHAR(100),
    error_message TEXT,
    error_details JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_extraction_errors_file_id (file_id),
    INDEX idx_extraction_errors_type (error_type)
);

-- Processing statistics
CREATE TABLE extraction_stats (
    id UUID PRIMARY KEY,
    date DATE NOT NULL,
    total_files_processed INTEGER,
    successful_extractions INTEGER,
    low_confidence_extractions INTEGER,
    api_failures INTEGER,
    avg_confidence DECIMAL(5, 2),
    avg_processing_time_ms INTEGER,
    total_cost_usd DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(date)
);
```

---

## 12. API Endpoints

### Core Endpoints

```
POST /v1/extraction/upload
  Purpose: Initiate extraction from uploaded file
  Request: { file_id, report_type? (optional hint) }
  Response: { job_id, status: "queued", estimated_wait_ms }
  Async: Returns immediately, processing happens in background

GET /v1/extraction/{job_id}/status
  Purpose: Check extraction progress
  Request: -
  Response: {
    status: "processing" | "completed" | "failed",
    progress: 0-100,
    current_step: string,
    estimated_remaining_ms: number
  }

GET /v1/extraction/{extraction_id}/draft
  Purpose: Retrieve extracted data draft for user review
  Request: -
  Response: {
    extracted_data: ExtractedReport,
    warnings: [],
    requires_review: boolean,
    editable_fields: string[]
  }
  Auth: User must own the file

POST /v1/extraction/{extraction_id}/confirm
  Purpose: User confirms extracted data and saves to report
  Request: { edited_values?: object }
  Response: { report_id, saved_values_count }
  Auth: User must own the file
  Safety: Validates user edits before save

POST /v1/extraction/{extraction_id}/correct
  Purpose: User manually corrects extracted values
  Request: {
    corrections: [
      { field_path: "patient_info.name", old_value, new_value },
      { field_path: "extracted_values[0].value", old_value, new_value }
    ]
  }
  Response: { updated_draft }
  Auth: User must own the file

POST /v1/extraction/manual-entry
  Purpose: Manually enter report data (for failed OCR)
  Request: { file_id, report_type, manual_data: object }
  Response: { report_id, saved_values_count }
  Auth: User must own the file

GET /v1/extraction/stats
  Purpose: Get extraction quality statistics
  Request: { date_range? }
  Response: {
    total_processed: number,
    success_rate: percentage,
    avg_confidence: number,
    common_errors: [],
    total_cost_usd: number
  }
  Auth: Admin only

DELETE /v1/extraction/{extraction_id}
  Purpose: Delete extraction draft (before confirmation)
  Request: -
  Response: { deleted: true }
  Auth: User must own the file
  Safety: Only allows deletion of drafts, not confirmed reports
```

### Implementation Example

```python
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/v1/extraction/upload")
async def start_extraction(
    file_id: str,
    report_type: Optional[str] = None,
    background_tasks: BackgroundTasks
):
    """
    Initiate extraction from uploaded file.
    """
    
    # Validate file exists and belongs to user
    file = await db.get_file(file_id)
    if not file or file.user_id != current_user.id:
        raise HTTPException(404, "File not found")
    
    if file.upload_status != "completed":
        raise HTTPException(400, "File upload not completed")
    
    # Create extraction draft record
    extraction_id = uuid.uuid4()
    await db.create_extraction_draft(
        id=extraction_id,
        file_id=file_id,
        status="queued"
    )
    
    # Enqueue background processing
    background_tasks.add_task(
        extract_report_worker,
        extraction_id=extraction_id,
        file_id=file_id,
        report_type=report_type
    )
    
    return JSONResponse({
        "success": True,
        "extraction_id": str(extraction_id),
        "status": "queued",
        "estimated_wait_ms": 30000  # Typical processing time
    })

@app.get("/v1/extraction/{extraction_id}/draft")
async def get_extraction_draft(extraction_id: str):
    """
    Retrieve extracted data draft for user review.
    """
    
    extraction = await db.get_extraction_draft(extraction_id)
    if not extraction or extraction.file.user_id != current_user.id:
        raise HTTPException(404, "Extraction not found")
    
    if extraction.status not in ["completed", "low_quality"]:
        raise HTTPException(400, f"Extraction status: {extraction.status}")
    
    return JSONResponse({
        "success": True,
        "extracted_data": extraction.extracted_json,
        "warnings": extraction.warnings,
        "requires_review": extraction.requires_review,
        "confidence_scores": {
            "overall": extraction.overall_confidence,
            "ocr_quality": extraction.ocr_quality_score
        }
    })

@app.post("/v1/extraction/{extraction_id}/confirm")
async def confirm_extraction(
    extraction_id: str,
    request: ConfirmExtractionRequest
):
    """
    User confirms extracted data and saves to report.
    """
    
    extraction = await db.get_extraction_draft(extraction_id)
    if not extraction or extraction.file.user_id != current_user.id:
        raise HTTPException(404, "Extraction not found")
    
    # Merge user corrections with extracted data
    final_data = await merge_corrections(
        extraction.extracted_json,
        request.corrections
    )
    
    # Create medical_report record
    report_id = await db.create_report_from_extraction(
        extraction_id=extraction_id,
        final_data=final_data,
        user_id=current_user.id
    )
    
    # Update extraction status
    await db.update_extraction_draft(
        extraction_id,
        status="confirmed",
        report_id=report_id
    )
    
    # Create audit log
    await audit_log.record(
        user_id=current_user.id,
        action="report_saved",
        resource_id=report_id,
        details={"source": "extraction"}
    )
    
    return JSONResponse({
        "success": True,
        "report_id": str(report_id),
        "saved_values_count": len(final_data['extracted_values'])
    })
```

---

## 13. Background Job Flow

### Celery Task Definition

```python
from celery import shared_task, group, chain
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def extract_report_worker(
    self,
    extraction_id: str,
    file_id: str,
    report_type: Optional[str] = None
):
    """
    Main extraction worker task.
    Orchestrates OCR + parsing pipeline.
    """
    
    try:
        # Step 1: Download file from S3/GCS
        logger.info(f"Extraction {extraction_id}: downloading file")
        file_path = download_file_from_storage(file_id)
        
        # Step 2: Detect file type
        detected_type = detect_file_type(file_path)
        logger.info(f"Extraction {extraction_id}: detected type = {detected_type}")
        
        # Step 3: Extract text using OCR
        logger.info(f"Extraction {extraction_id}: starting OCR")
        ocr_start = time.time()
        ocr_text = extract_text_with_ocr(file_path, detected_type)
        ocr_time_ms = int((time.time() - ocr_start) * 1000)
        
        # Validate OCR quality
        ocr_quality = assess_ocr_quality(ocr_text)
        if ocr_quality < 50:
            logger.warning(f"Extraction {extraction_id}: poor OCR quality ({ocr_quality}%)")
            update_extraction_status(extraction_id, "low_quality", {
                "ocr_quality": ocr_quality,
                "requires_manual_entry": True
            })
            return
        
        # Step 4: Parse with LLM
        logger.info(f"Extraction {extraction_id}: starting LLM parsing")
        llm_start = time.time()
        parsed_data = parse_with_llm(ocr_text, report_type or detected_type)
        llm_time_ms = int((time.time() - llm_start) * 1000)
        
        # Step 5: Calculate confidence
        overall_confidence = calculate_confidence(parsed_data)
        
        # Step 6: Save draft
        logger.info(f"Extraction {extraction_id}: saving draft")
        save_extraction_draft(
            extraction_id,
            extracted_json=parsed_data,
            raw_ocr_text=ocr_text,
            overall_confidence=overall_confidence,
            ocr_quality_score=ocr_quality,
            processing_time_ms=ocr_time_ms + llm_time_ms,
            status="completed" if overall_confidence >= 70 else "review_pending"
        )
        
        # Step 7: Notify user
        notify_user_extraction_complete(extraction_id, overall_confidence)
        
        logger.info(f"Extraction {extraction_id}: completed with {overall_confidence}% confidence")
        
    except Exception as exc:
        logger.error(f"Extraction {extraction_id}: error: {exc}", exc_info=True)
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            retry_delay = 60 * (2 ** self.request.retries)  # 1min, 2min, 4min
            logger.info(f"Extraction {extraction_id}: retrying in {retry_delay}s")
            raise self.retry(exc=exc, countdown=retry_delay)
        else:
            # Final failure
            log_extraction_error(extraction_id, str(exc))
            notify_user_extraction_failed(extraction_id, str(exc))
            raise

@shared_task
def assess_ocr_quality(text: str) -> float:
    """
    Assess OCR quality and return confidence score.
    """
    
    quality_score = 100
    
    # Check minimum text length
    if len(text) < 200:
        quality_score -= 30
    
    # Check for medical keywords
    medical_keywords = ['test', 'result', 'value', 'normal', 'high', 'low', 'patient']
    keyword_count = sum(1 for kw in medical_keywords if kw.lower() in text.lower())
    if keyword_count < 3:
        quality_score -= 20
    
    # Check for garbled text (unusual character patterns)
    special_char_ratio = sum(1 for c in text if not c.isalnum()) / len(text)
    if special_char_ratio > 0.3:
        quality_score -= 15
    
    return max(0, quality_score)

@shared_task
def parse_with_llm(ocr_text: str, report_type: str) -> dict:
    """
    Parse OCR text using Claude Vision API.
    """
    
    client = Anthropic()
    
    prompt = MEDICAL_EXTRACTION_PROMPT.format(
        ocr_text=ocr_text,
        report_type=report_type
    )
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4000,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    
    # Extract and validate JSON
    response_text = response.content[0].text
    parsed = json.loads(response_text)
    
    # Validate schema
    validate_extraction_schema(parsed)
    
    return parsed

# Celery task chain for handling multiple files
def process_batch_uploads(file_ids: list[str]):
    """
    Process multiple file uploads in parallel.
    """
    
    job = group([
        extract_report_worker.s(
            extraction_id=str(uuid.uuid4()),
            file_id=fid
        ) for fid in file_ids
    ])
    
    return job.apply_async()
```

---

## 14. File Processing States

### State Machine

```
                    ┌─────────────────┐
                    │  FILE UPLOADED  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   VALIDATION    │
                    │ • File type OK  │
                    │ • Size OK       │
                    │ • Malware scan  │
                    └────────┬────────┘
                             │
                   ┌─────────┴────────┐
                   │                  │
         FAILS     ▼                  ▼ PASS
      ┌─────────────────┐    ┌──────────────────┐
      │ UPLOADED_FAILED │    │   QUEUED FOR OCR │
      │ (user notified) │    └────────┬─────────┘
      └─────────────────┘             │
                                      ▼
                             ┌──────────────────┐
                             │  PROCESSING OCR  │
                             └────────┬─────────┘
                                      │
                   ┌──────────────────┴─────────────────┐
                   │                                    │
         FAILS     ▼                                    ▼ SUCCESS
      ┌─────────────────────┐           ┌──────────────────────────┐
      │  PROCESSING FAILED  │           │   AI PARSING & SCORING   │
      │ (retry 3x, then     │           └────────┬─────────────────┘
      │  manual review)     │                    │
      └─────────────────────┘                    ▼
                                      ┌──────────────────────────┐
                                      │ CALCULATE CONFIDENCE &   │
                                      │ ASSESS QUALITY           │
                                      └────────┬─────────────────┘
                                               │
                       ┌───────────────────────┼───────────────────┐
                       │                       │                   │
            Confidence │                       │              Confidence
            <50%       │                       │              70-100%
                       ▼                       ▼                   ▼
            ┌──────────────────┐   ┌──────────────────┐ ┌──────────────────┐
            │  LOW_QUALITY     │   │ REVIEW_PENDING   │ │   COMPLETED      │
            │                  │   │                  │ │ (ready for user  │
            │ Offer:           │   │ Show:            │ │  confirmation)   │
            │ • Re-upload      │   │ • Extracted data │ │                  │
            │ • Manual entry   │   │ • Confidence     │ │ Ready for:       │
            │                  │   │ • Editable       │ │ • User review    │
            └──────────────────┘   │                  │ │ • Confirmation   │
                                   │ Allow:           │ └──────────────────┘
                                   │ • Edit values    │
                                   │ • Reject/retry   │
                                   └──────────────────┘
                                            │
                                ┌───────────┴──────────┐
                                │                      │
                           USER EDITS                 USER REJECTS
                                │                      │
                                ▼                      ▼
                    ┌──────────────────────┐   ┌──────────────────┐
                    │    CONFIRMING        │   │ REJECTED_BY_USER │
                    │ Validate edits       │   │ (start over)     │
                    │ Save final report    │   └──────────────────┘
                    │ Create audit logs    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  CONFIRMED_AND_