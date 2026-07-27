# MediVault interoperability

All integration endpoints require `Authorization: Bearer mv_live_...`. Create a clinic-scoped API key in **Admin > API & Webhooks** and grant only the required scope.

## FHIR R4 export

`GET /api/integrations/v1/fhir` requires `lab.read` and returns a FHIR searchset Bundle containing `DiagnosticReport`, `Observation`, and `Specimen` resources for the API key's clinic.

Optional: `?reportId=<internal-report-id>`.

## HL7 v2 results ingest

`POST /api/integrations/v1/hl7` requires `lab.write`.

- Body: raw `HL7 v2 ORU^R01` message
- Required segments: `MSH`, `PID`, `OBR`, one or more `OBX`
- Required matching field: `PID-13` patient mobile number
- Required idempotency field: `MSH-10` message control ID
- Imported results are created as draft machine-entry reports and normalized to FHIR.
- Re-sending the same `MSH-10` for the same clinic returns the existing report instead of creating a duplicate.

Example:

```text
MSH|^~\&|ANALYZER|LAB|MEDIVAULT|CLINIC|20260727103000||ORU^R01|MSG-1001|P|2.5.1
PID|1||P100||Patel^Meera||||||||+919876543210
OBR|1|ORDER-1|ACC-1|CBC^Complete Blood Count|||20260727100000
OBX|1|NM|718-7^Hemoglobin||12.4|g/dL|12-16|N|||F
```

Production connections should use HTTPS, network allowlists or a private tunnel, key rotation, and separate keys per analyzer or hospital.
