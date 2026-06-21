# MediVault Phase 9 — DevOps & Deployment

**Status:** Implementation Ready
**Duration:** 2-3 weeks
**Team Size:** 1-2 DevOps engineers
**Target:** Production-ready infrastructure

---

## 1. Infrastructure Architecture

### Cloud Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│           CloudFlare / CDN                      │
│        (Global Content Delivery)                │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│         AWS Load Balancer / ALB                 │
│        (Traffic Distribution)                   │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼──┐       ┌───▼──┐      ┌───▼──┐
    │ K8s  │       │ K8s  │      │ K8s  │
    │Pod 1 │       │Pod 2 │      │Pod 3 │
    │(API) │       │(API) │      │(API) │
    └──────┘       └──────┘      └──────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │      PostgreSQL (RDS)               │
    │      - Master-Slave Replication     │
    │      - Automated Backups            │
    │      - Multi-AZ                     │
    └─────────────────────────────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │    Elasticache / Redis              │
    │    - Cluster Mode Enabled           │
    │    - Multi-AZ                       │
    └─────────────────────────────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │       S3 / File Storage             │
    │       - Versioning Enabled          │
    │       - Encryption at Rest          │
    │       - CloudFront Distribution     │
    └─────────────────────────────────────┘
```

---

## 2. Docker Setup

### Dockerfile (Backend/FastAPI)

```dockerfile
# Dockerfile

FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --user --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Set environment variables
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Dockerfile (Mobile/Flutter - APK Build)

```dockerfile
# Dockerfile.flutter

FROM google/cloud-sdk:latest as flutter-builder

# Install Flutter
RUN git clone https://github.com/flutter/flutter.git /flutter && \
    /flutter/bin/flutter config --no-analytics && \
    /flutter/bin/flutter doctor

ENV PATH="/flutter/bin:${PATH}"

WORKDIR /app

COPY . .

# Build APK
RUN flutter pub get && \
    flutter build apk --release

# Runtime stage
FROM alpine:latest

WORKDIR /dist

COPY --from=flutter-builder /app/build/app/outputs/apk/release/app-release.apk .

CMD ["ls", "-la"]
```

### Docker Compose (Local Development)

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: medivault-postgres
    environment:
      POSTGRES_DB: medivault
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: medivault-redis
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    container_name: medivault-api
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/medivault
      REDIS_URL: redis://redis:6379
      ENVIRONMENT: development
      DEBUG: "true"
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  celery-worker:
    build: .
    container_name: medivault-worker
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/medivault
      REDIS_URL: redis://redis:6379
      ENVIRONMENT: development
    depends_on:
      - postgres
      - redis
      - api
    volumes:
      - .:/app
    command: celery -A app.workers.celery_app worker --loglevel=info

  celery-beat:
    build: .
    container_name: medivault-beat
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/medivault
      REDIS_URL: redis://redis:6379
      ENVIRONMENT: development
    depends_on:
      - postgres
      - redis
      - api
    volumes:
      - .:/app
    command: celery -A app.workers.celery_app beat --loglevel=info

  nginx:
    image: nginx:alpine
    container_name: medivault-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    command: nginx -g 'daemon off;'

volumes:
  postgres_data:
  redis_data:
```

---

## 3. Kubernetes Deployment

### Deployment YAML

```yaml
# k8s/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: medivault-api
  namespace: production
  labels:
    app: medivault
    tier: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: medivault
      tier: api
  template:
    metadata:
      labels:
        app: medivault
        tier: api
    spec:
      serviceAccountName: medivault
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
      - name: api
        image: medivault/api:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8000
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: medivault-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: medivault-secrets
              key: redis-url
        - name: ENVIRONMENT
          value: "production"
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: medivault-secrets
              key: secret-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL

---
apiVersion: v1
kind: Service
metadata:
  name: medivault-api-service
  namespace: production
  labels:
    app: medivault
    tier: api
spec:
  type: ClusterIP
  ports:
  - port: 8000
    targetPort: 8000
    protocol: TCP
    name: http
  selector:
    app: medivault
    tier: api

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: medivault-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: medivault-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### StatefulSet for Database

```yaml
# k8s/statefulset-postgres.yaml

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 50Gi

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: production
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: medivault-secrets
              key: postgres-password
        - name: POSTGRES_DB
          value: medivault
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 50Gi
```

---

## 4. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      run: |
        pytest --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage.xml

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: ${{ github.event_name != 'pull_request' }}
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
        cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Update EKS cluster
      run: |
        aws eks update-kubeconfig --name medivault-prod --region us-east-1
        kubectl set image deployment/medivault-api api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} -n production
        kubectl rollout status deployment/medivault-api -n production
```

---

## 5. Infrastructure as Code (Terraform)

### AWS Resources

```hcl
# main.tf

provider "aws" {
  region = "us-east-1"
}

# RDS PostgreSQL
resource "aws_db_instance" "medivault" {
  identifier     = "medivault-db"
  engine         = "postgres"
  engine_version = "15.0"
  instance_class = "db.t3.medium"

  allocated_storage = 100
  storage_encrypted = true

  db_name  = "medivault"
  username = "postgres"
  password = random_password.db_password.result

  multi_az               = true
  publicly_accessible    = false
  skip_final_snapshot    = false
  final_snapshot_identifier = "medivault-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "medivault" {
  cluster_id           = "medivault-redis"
  engine              = "redis"
  node_type           = "cache.t3.medium"
  num_cache_nodes     = 3
  parameter_group_name = "default.redis7"
  engine_version      = "7.0"
  port                = 6379
  
  automatic_failover_enabled = true
  multi_az_enabled           = true
  
  subnet_group_name = aws_elasticache_subnet_group.medivault.name
  security_group_ids = [aws_security_group.elasticache.id]
}

# EKS Cluster
resource "aws_eks_cluster" "medivault" {
  name            = "medivault-prod"
  role_arn        = aws_iam_role.eks_cluster.arn
  version         = "1.27"

  vpc_config {
    subnet_ids              = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.eks.id]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster,
  ]
}

# S3 Bucket
resource "aws_s3_bucket" "medivault_reports" {
  bucket = "medivault-reports-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "medivault_reports" {
  bucket = aws_s3_bucket.medivault_reports.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "medivault_reports" {
  bucket = aws_s3_bucket.medivault_reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

---

## 6. Monitoring & Logging

### Prometheus Setup

```yaml
# prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093

rule_files:
  - "/etc/prometheus/alert_rules.yml"

scrape_configs:
  - job_name: 'medivault-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'kubernetes'
    kubernetes_sd_configs:
      - role: pod
```

### Alert Rules

```yaml
# alert_rules.yml

groups:
  - name: medivault
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        annotations:
          summary: "Database is down"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        annotations:
          summary: "High memory usage"

      - alert: HighCPUUsage
        expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
        for: 5m
        annotations:
          summary: "High CPU usage"
```

### ELK Stack Configuration

```yaml
# docker-compose.elk.yml

version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      discovery.type: single-node
      ELASTIC_PASSWORD: ${ELASTIC_PASSWORD}
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
      ELASTICSEARCH_PASSWORD: ${ELASTIC_PASSWORD}
    ports:
      - "5601:5601"

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.10.0
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command: filebeat -e -strict.perms=false
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

---

## 7. Security & SSL

### Nginx SSL Configuration

```nginx
# nginx.conf

upstream api {
    server api:8000;
}

server {
    listen 80;
    server_name api.medivault.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.medivault.com;

    ssl_certificate /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 8. Database Backup & Recovery

### Automated Backups

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

DB_HOST=${DB_HOST:-localhost}
DB_NAME=${DB_NAME:-medivault}
DB_USER=${DB_USER:-postgres}
BACKUP_DIR=${BACKUP_DIR:-/backups}
S3_BUCKET=${S3_BUCKET:-medivault-backups}

# Create backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/medivault_backup_$TIMESTAMP.sql.gz"

echo "Starting backup at $(date)"

pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

echo "Backup completed: $BACKUP_FILE"

# Upload to S3
aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/database-backups/

echo "Backup uploaded to S3"

# Keep only last 30 days locally
find $BACKUP_DIR -name "medivault_backup_*.sql.gz" -mtime +30 -delete

echo "Backup complete at $(date)"
```

### Disaster Recovery

```bash
#!/bin/bash
# scripts/restore-database.sh

set -e

BACKUP_FILE=$1
DB_HOST=${DB_HOST:-localhost}
DB_NAME=${DB_NAME:-medivault}
DB_USER=${DB_USER:-postgres}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-database.sh <backup-file>"
    exit 1
fi

echo "Restoring from $BACKUP_FILE"

# Drop existing database
dropdb -h $DB_HOST -U $DB_USER $DB_NAME || true

# Create new database
createdb -h $DB_HOST -U $DB_USER $DB_NAME

# Restore data
gunzip -c $BACKUP_FILE | psql -h $DB_HOST -U $DB_USER $DB_NAME

echo "Restore complete"
```

---

## 9. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review approved
- [ ] Security scan passed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backups confirmed
- [ ] Monitoring setup verified

### Deployment
- [ ] Build Docker image
- [ ] Push to registry
- [ ] Run database migrations
- [ ] Deploy to Kubernetes
- [ ] Verify health checks
- [ ] Monitor error rates
- [ ] Test critical workflows
- [ ] Update documentation

### Post-Deployment
- [ ] Monitor performance metrics
- [ ] Check error logs
- [ ] Verify user access
- [ ] Test analytics
- [ ] Confirm notifications working
- [ ] Review CloudWatch logs
- [ ] Document any issues
- [ ] Schedule post-mortems if needed

---

## 10. Scaling Strategy

### Horizontal Scaling

```
Load: 0-100 requests/s → 3 API pods
Load: 100-500 requests/s → 6 API pods
Load: 500-1000 requests/s → 10 API pods
Load: 1000+ requests/s → Custom evaluation
```

### Caching Strategy

```
- Page Cache: 5 minutes
- Analytics Cache: 30 minutes
- User Data: 1 hour
- Static Content: 24 hours (CDN)
```

---

**Status:** Ready for Implementation ✅
**Estimated Duration:** 2-3 weeks
**Team Size:** 1-2 DevOps engineers
