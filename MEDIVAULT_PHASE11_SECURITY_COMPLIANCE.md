# MediVault Phase 11 — Security & Compliance

**Status:** Implementation Ready
**Duration:** 2-3 weeks
**Team Size:** 1-2 security engineers
**Focus:** HIPAA, Data privacy, Encryption, Compliance audit

---

## 1. HIPAA Compliance

### HIPAA Requirements Implementation

```python
# app/core/hipaa_compliance.py

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import base64
import os

class HIPAACompliance:
    """Implement HIPAA-required security measures"""
    
    def __init__(self):
        self.encryption_key = self._generate_encryption_key()
    
    # 1. Access Controls (HIPAA §164.312(a)(2))
    def implement_access_controls(self):
        """
        Unique User Identification
        - Each user has unique ID
        - Strong authentication (OTP + JWT)
        - Role-based access control
        """
        return {
            "unique_user_ids": True,
            "authentication_method": "OTP + JWT",
            "mfa_enabled": True,
            "password_policy": {
                "minimum_length": 12,
                "complexity_required": True,
                "expiry_days": 90,
                "history_count": 6
            }
        }
    
    # 2. Audit Controls (HIPAA §164.312(b))
    def implement_audit_controls(self):
        """Log all access to protected health information"""
        return {
            "audit_logs": {
                "events_logged": [
                    "user_login",
                    "data_access",
                    "data_modification",
                    "data_deletion",
                    "report_generation",
                    "export_download",
                    "failed_auth"
                ],
                "retention_period_years": 6,
                "immutable": True,
                "tamper_proof": True
            }
        }
    
    # 3. Encryption (HIPAA §164.312(a)(2)(i))
    def encrypt_patient_data(self, data: str) -> str:
        """Encrypt sensitive patient data at rest"""
        f = Fernet(self.encryption_key)
        encrypted = f.encrypt(data.encode())
        return encrypted.decode()
    
    def decrypt_patient_data(self, encrypted_data: str) -> str:
        """Decrypt patient data"""
        f = Fernet(self.encryption_key)
        decrypted = f.decrypt(encrypted_data.encode())
        return decrypted.decode()
    
    # 4. Transmission Security (HIPAA §164.312(c))
    def implement_transmission_security(self):
        """Secure transmission of health information"""
        return {
            "tls_version": "TLS 1.2+",
            "cipher_suites": "HIGH:!aNULL:!MD5",
            "vpn_required": True,
            "ssl_pinning": True,
            "certificate_pinning": True
        }
    
    # 5. Integrity Controls (HIPAA §164.312(c)(1))
    def verify_data_integrity(self, data: str, hash_value: str) -> bool:
        """Verify data hasn't been altered"""
        import hashlib
        computed_hash = hashlib.sha256(data.encode()).hexdigest()
        return computed_hash == hash_value
    
    # 6. De-identification (HIPAA §164.514)
    def de_identify_data(self, patient_data: dict) -> dict:
        """Remove/obscure personally identifiable information"""
        de_identified = {
            'age': patient_data.get('age'),  # Keep age
            'gender': patient_data.get('gender'),  # Keep gender
            'health_data': patient_data.get('health_data'),  # Keep health metrics
            # Remove:
            # - Name
            # - Phone
            # - Email
            # - Address
            # - Account number
            # - Biometric info
            # - Medical record number
        }
        return de_identified
    
    def _generate_encryption_key(self):
        """Generate secure encryption key"""
        password = os.environ.get('ENCRYPTION_PASSWORD', '').encode()
        salt = os.environ.get('ENCRYPTION_SALT', b'default_salt')
        
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
```

### Database Encryption

```sql
-- Enable encryption for sensitive columns

ALTER TABLE users ADD COLUMN phone_encrypted BYTEA;
ALTER TABLE users ADD COLUMN email_encrypted BYTEA;
ALTER TABLE users ADD COLUMN name_encrypted BYTEA;

-- Create triggers for automatic encryption
CREATE OR REPLACE FUNCTION encrypt_pii()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.phone IS NOT NULL THEN
        NEW.phone_encrypted = pgcrypto.encrypt(NEW.phone, 'key', 'aes');
        NEW.phone = NULL;  -- Remove plaintext
    END IF;
    
    IF NEW.email IS NOT NULL THEN
        NEW.email_encrypted = pgcrypto.encrypt(NEW.email, 'key', 'aes');
        NEW.email = NULL;
    END IF;
    
    IF NEW.name IS NOT NULL THEN
        NEW.name_encrypted = pgcrypto.encrypt(NEW.name, 'key', 'aes');
        NEW.name = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER encrypt_user_pii
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION encrypt_pii();
```

---

## 2. Data Privacy & GDPR

### Privacy Compliance

```python
# app/core/privacy_compliance.py

class PrivacyCompliance:
    """GDPR and data privacy compliance"""
    
    # 1. Right to Access (GDPR Article 15)
    async def get_user_data_export(self, user_id: str):
        """Export all user data for GDPR right to access"""
        
        user_data = {
            "personal_info": await db.query(User).filter(User.id == user_id).first(),
            "medical_reports": await db.query(MedicalReport).filter(
                MedicalReport.user_id == user_id
            ).all(),
            "extracted_values": await db.query(ExtractedValue).join(
                MedicalReport
            ).filter(MedicalReport.user_id == user_id).all(),
            "audit_logs": await db.query(AuditLog).filter(
                AuditLog.user_id == user_id
            ).all(),
            "consent_records": await db.query(ConsentLog).filter(
                ConsentLog.user_id == user_id
            ).all()
        }
        
        return await self._generate_json_export(user_data)
    
    # 2. Right to Erasure (GDPR Article 17)
    async def delete_user_data(self, user_id: str):
        """Delete all user data (right to be forgotten)"""
        
        # Delete in correct order (foreign keys)
        await db.query(ExtractedValue).join(
            MedicalReport
        ).filter(MedicalReport.user_id == user_id).delete()
        
        await db.query(MedicalReport).filter(
            MedicalReport.user_id == user_id
        ).delete()
        
        await db.query(FamilyMember).filter(
            FamilyMember.user_id == user_id
        ).delete()
        
        await db.query(AuditLog).filter(
            AuditLog.user_id == user_id
        ).delete()
        
        await db.query(User).filter(User.id == user_id).delete()
        
        await db.commit()
    
    # 3. Data Minimization (GDPR Article 5)
    def collect_minimum_data(self):
        """Only collect necessary data"""
        return {
            "required_fields": [
                "phone",
                "date_of_birth",
                "medical_reports"
            ],
            "optional_fields": [
                "name",
                "email",
                "address"
            ],
            "prohibited_fields": [
                "ssn",
                "passport_number",
                "financial_data"
            ]
        }
    
    # 4. Consent Management (GDPR Article 7)
    async def manage_user_consent(self, user_id: str):
        """Track and manage user consent"""
        
        return {
            "data_processing": False,  # Requires explicit consent
            "analytics": False,
            "marketing": False,
            "third_party_sharing": False,
            "withdrawal_allowed": True,
            "timestamp": datetime.now().isoformat()
        }
    
    # 5. Data Processing Agreement
    def generate_dpa(self, client_name: str):
        """Generate Data Processing Agreement"""
        return f"""
        DATA PROCESSING AGREEMENT
        Between: MediVault (Data Processor)
        And: {client_name} (Data Controller)
        
        1. Subject Matter: Processing of personal health data
        2. Duration: As long as data controller uses services
        3. Nature and Purpose: Healthcare data storage and analysis
        4. Type of Personal Data: Medical records, health metrics
        5. Categories of Data Subjects: Patients and family members
        6. Obligations of Data Processor:
           - Process data only on documented instructions
           - Ensure confidentiality of personnel
           - Implement appropriate security measures
           - Assist with data subject rights
           - Delete data upon contract termination
        """
```

---

## 3. Encryption & Key Management

### End-to-End Encryption

```python
# app/services/encryption_service.py

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

class EncryptionService:
    """Manage encryption for sensitive medical data"""
    
    def __init__(self):
        self.rsa_key_size = 4096
        self.hash_algorithm = hashes.SHA256()
    
    def encrypt_file(self, file_path: str, public_key_path: str) -> bytes:
        """Encrypt file with RSA public key"""
        
        with open(file_path, 'rb') as f:
            plaintext = f.read()
        
        with open(public_key_path, 'rb') as f:
            public_key = serialization.load_pem_public_key(f.read())
        
        ciphertext = public_key.encrypt(
            plaintext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=self.hash_algorithm),
                algorithm=self.hash_algorithm,
                label=None
            )
        )
        
        return ciphertext
    
    def decrypt_file(self, ciphertext: bytes, private_key_path: str) -> bytes:
        """Decrypt file with RSA private key"""
        
        with open(private_key_path, 'rb') as f:
            private_key = serialization.load_pem_private_key(
                f.read(),
                password=os.environ.get('PRIVATE_KEY_PASSWORD').encode()
            )
        
        plaintext = private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=self.hash_algorithm),
                algorithm=self.hash_algorithm,
                label=None
            )
        )
        
        return plaintext

# Key Management Service
class KeyManagementService:
    """Manage encryption keys securely"""
    
    def __init__(self):
        self.kms_client = boto3.client('kms')  # AWS KMS
    
    def generate_key_pair(self):
        """Generate RSA key pair"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=self.rsa_key_size
        )
        public_key = private_key.public_key()
        
        return {
            "private_key": serialization.Encoding.PEM,
            "public_key": public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
        }
    
    def rotate_keys(self):
        """Rotate encryption keys (every 90 days)"""
        
        # Generate new keys
        new_keys = self.generate_key_pair()
        
        # Re-encrypt all data with new key
        self._reencrypt_all_data(new_keys['public_key'])
        
        # Store old key in vault for decryption of archived data
        self._archive_old_key()
        
        return {"status": "keys_rotated"}
    
    def _reencrypt_all_data(self, new_public_key):
        """Re-encrypt all data with new key"""
        
        # Get all encrypted records
        records = db.query(MedicalReport).all()
        
        for record in records:
            # Decrypt with old key
            plaintext = decrypt_with_old_key(record.encrypted_data)
            
            # Encrypt with new key
            record.encrypted_data = encrypt_with_new_key(plaintext, new_public_key)
        
        db.commit()
```

---

## 4. Security Audit & Testing

### Penetration Testing

```python
# tests/security/penetration_tests.py

class PenetrationTests:
    """Security penetration testing"""
    
    def test_sql_injection(self):
        """Test SQL injection protection"""
        payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "'; UPDATE users SET role='admin'; --"
        ]
        
        for payload in payloads:
            response = client.get(f"/reports?search={payload}")
            # Should not execute injection
            assert response.status_code in [200, 422]
    
    def test_xss_vulnerability(self):
        """Test XSS protection"""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "javascript:alert('xss')"
        ]
        
        for payload in xss_payloads:
            response = client.post("/users/profile", json={"name": payload})
            user_data = response.json()
            # Should sanitize
            assert "<script>" not in str(user_data)
    
    def test_csrf_protection(self):
        """Test CSRF protection"""
        
        # Attempt from different origin
        response = client.post(
            "/reports",
            json={"file_id": "file123"},
            headers={"Origin": "https://malicious.com"}
        )
        
        # Should block
        assert response.status_code == 403
    
    def test_authentication_bypass(self):
        """Test authentication cannot be bypassed"""
        
        # Attempt without token
        response = client.get("/reports")
        assert response.status_code == 401
        
        # Attempt with invalid token
        response = client.get(
            "/reports",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
    
    def test_privilege_escalation(self):
        """Test privilege escalation protection"""
        
        # User tries to access admin endpoints
        user_token = get_user_token("regular_user")
        response = client.get(
            "/admin/users",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Should be forbidden
        assert response.status_code == 403
    
    def test_insecure_deserialization(self):
        """Test against insecure deserialization"""
        
        # Malicious serialized object
        malicious_payload = create_malicious_pickle()
        
        response = client.post(
            "/api/endpoint",
            data=malicious_payload,
            headers={"Content-Type": "application/octet-stream"}
        )
        
        # Should not deserialize malicious data
        assert response.status_code != 200
```

### Security Scanning

```bash
#!/bin/bash
# scripts/security-scan.sh

echo "Running security scans..."

# 1. Dependency check
echo "Checking dependencies for vulnerabilities..."
pip install safety
safety check --json > security_report.json

# 2. Code analysis
echo "Running code analysis..."
pip install bandit
bandit -r app/ -f json -o bandit_report.json

# 3. SAST (Static Application Security Testing)
echo "Running SAST..."
pip install semgrep
semgrep --json --config=p/security-audit app/ > semgrep_report.json

# 4. Dependency scanning
echo "Scanning dependencies..."
pip install pip-audit
pip-audit --desc > pip_audit_report.txt

# 5. Generate report
echo "Generating security report..."
python -c "
import json
reports = {
    'safety': json.load(open('security_report.json')),
    'bandit': json.load(open('bandit_report.json')),
    'semgrep': json.load(open('semgrep_report.json'))
}
with open('security_summary.json', 'w') as f:
    json.dump(reports, f, indent=2)
"

echo "Security scan complete!"
```

---

## 5. Compliance Checklist

### HIPAA Compliance Checklist

```
✅ HIPAA Security Rule (§164.312)
   [ ] Access Controls
     [ ] Unique user identification
     [ ] Emergency access procedures
     [ ] Automatic logoff
     [ ] Encryption and decryption
   
   [ ] Audit Controls
     [ ] Audit logs for all access
     [ ] Report generation
     [ ] 6-year retention
   
   [ ] Integrity Controls
     [ ] Mechanism to verify data hasn't been altered
     [ ] Secure deletion
   
   [ ] Transmission Security
     [ ] TLS 1.2+ for all data in transit
     [ ] Certificate pinning
     [ ] VPN for remote access

✅ HIPAA Privacy Rule (§164.500)
   [ ] Notice of Privacy Practices
   [ ] Patient rights
   [ ] Consent forms
   [ ] Authorization process
   [ ] Minimum necessary standard
   [ ] De-identification procedures

✅ HIPAA Breach Notification Rule
   [ ] Breach detection
   [ ] Notification procedures
   [ ] Timeline (60 days)
   [ ] Documentation
```

### GDPR Compliance Checklist

```
✅ Data Protection by Design & Default (Article 25)
   [ ] Privacy impact assessment
   [ ] Consent mechanisms
   [ ] Data minimization
   [ ] Encryption

✅ Data Subject Rights (Articles 15-22)
   [ ] Right to access
   [ ] Right to rectification
   [ ] Right to erasure
   [ ] Right to restrict processing
   [ ] Right to data portability
   [ ] Right to object

✅ Data Processing Agreements
   [ ] DPA with processors
   [ ] Clear instructions
   [ ] Confidentiality commitments
   [ ] Sub-processor management

✅ Incident Response
   [ ] Breach detection procedures
   [ ] 72-hour notification
   [ ] Documentation
   [ ] User notification
```

---

## 6. Security Documentation

### Security Policy Template

```
# Security Policy

## 1. Information Security
- All data encrypted at rest and in transit
- Regular security audits
- Penetration testing quarterly
- Vulnerability assessments

## 2. Access Control
- Role-based access control (RBAC)
- Multi-factor authentication
- Least privilege principle
- Regular access reviews

## 3. Data Protection
- HIPAA compliant encryption
- GDPR compliant processing
- Data retention policies
- Secure deletion procedures

## 4. Incident Response
- Breach detection within 24 hours
- User notification within 72 hours
- Root cause analysis
- Remediation within 30 days

## 5. Compliance
- Annual security audit
- Quarterly penetration tests
- Monthly vulnerability scans
- Continuous compliance monitoring
```

---

**Status:** Ready for Implementation ✅
**Estimated Duration:** 2-3 weeks
**Team Size:** 1-2 security engineers
**Coverage:** HIPAA + GDPR + OWASP Top 10
