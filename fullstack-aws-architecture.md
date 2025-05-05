# Full-Stack AWS Architecture (mentalhealthaide.com)

```mermaid
graph TD
    User((User))
    Route53[Route 53<br/>DNS]
    CloudFront[CloudFront<br/>CDN + WAF]
    ACM[ACM<br/>TLS/SSL Certs]
    S3[S3 Bucket<br/>Static React Build<br/>Encrypted, Versioned]
    ALB[Application Load Balancer<br/>HTTPS, WAF]
    ECS[ECS Fargate<br/>Node/Express API]
    RDS[RDS MySQL<br/>Encrypted DB]
    Secrets[Secrets Manager<br/>KMS, Rotation]
    CloudWatch[CloudWatch Logs<br/>KMS]
    Inspector[AWS Inspector v2]
    KMS[KMS CMK]

    User-->|https://mentalhealthaide.com|Route53
    User-->|https://api.mentalhealthaide.com|Route53
    Route53-->|DNS resolves to|CloudFront
    Route53-->|DNS resolves to|ALB
    CloudFront-->|Serves static files|S3
    CloudFront-->|Uses cert|ACM
    CloudFront-->|WAF attached|CloudFront
    S3-->|Private bucket, only CloudFront access|CloudFront
    S3-->|Encrypted|KMS
    ALB-->|HTTPS forwards|ECS
    ALB-->|Uses cert|ACM
    ALB-->|WAF attached|ALB
    ECS-->|Reads/writes|RDS
    ECS-->|Fetches secrets|Secrets
    ECS-->|Logs to|CloudWatch
    ECS-->|Scanned by|Inspector
    RDS-->|Encrypted at rest|KMS
    Secrets-->|Encrypted|KMS
    CloudWatch-->|Encrypted|KMS

    classDef aws fill:#f3f7fa,stroke:#232f3e,stroke-width:2px;
    class Route53,CloudFront,ACM,S3,ALB,ECS,RDS,Secrets,CloudWatch,Inspector,KMS aws;
```

---

**Flow:**
- User visits `https://mentalhealthaide.com` (frontend):
  1. Route 53 resolves to CloudFront.
  2. CloudFront (with ACM TLS cert and WAF) serves static React app from S3 (private, encrypted, versioned).
- User/API client calls `https://api.mentalhealthaide.com` (backend):
  1. Route 53 resolves to ALB.
  2. ALB (with ACM TLS cert and WAF) forwards HTTPS traffic to ECS Fargate service.
  3. ECS runs Node/Express backend, connects to RDS (MySQL), fetches **db_password** and **jwt_secret** from Secrets Manager (generated/rotated by Terraform, encrypted with KMS), logs to CloudWatch (encrypted with KMS), and is scanned by Inspector v2.

---

**Key AWS Services & Security Practices:**
- **S3:** Stores static frontend files, encrypted and versioned
- **CloudFront:** CDN, HTTPS, WAF attached
- **ALB:** Load balancing, HTTPS, WAF
- **ECS Fargate:** Runs backend containers
- **RDS:** MySQL database, encrypted at rest with KMS, password rotated via Secrets Manager
- **Secrets Manager:** Generates and rotates db_password/jwt_secret (KMS-encrypted); Twilio/OpenAI keys are NOT managed here
- **CloudWatch:** Logs/metrics, encrypted with KMS
- **Route 53:** DNS
- **ACM:** TLS/SSL certificates (DNS validated)
- **KMS:** Encryption for S3, RDS, CloudWatch, Secrets
- **Inspector v2:** Vulnerability scanning for ECR/EC2/ECS

---

**Operational Best Practices:**
- Secrets are rotated automatically (30 days) via Secrets Manager
- No hardcoded secrets in tfvars or code
- S3, RDS, and logs are encrypted and versioned
- CloudFront cache invalidation after deploy
- Use `terraform plan` to detect drift; re-run `apply`/`destroy` to recover from interruptions 

---

## Security Boundary Diagram (Granular)

```mermaid
flowchart TD
    subgraph Public["Public Internet 🔵"]
      User((User))
    end

    subgraph Edge["Edge/Proxy Zone (DMZ) 🟢"]
      Route53[Route53\nDNS]
      CloudFront[CloudFront\nCDN + WAF]
      ALB[ALB\nHTTPS, WAF]
    end

    subgraph VPC["AWS VPC (Private Network) 🟡"]
      subgraph PublicSubnet["Public Subnet"]
        ALB_ENI[ALB_ENI]
      end

      subgraph PrivateSubnet["Private Subnet"]
        ECS[ECS Fargate\nNode/Express API]
        RDS[RDS MySQL]
        S3[S3 Bucket\nStatic React Build]
        CloudWatch[CloudWatch Logs]
        Inspector[AWS Inspector v2]
      end
    end

    subgraph Sensitive["Sensitive Zone 🔒"]
      Secrets[Secrets Manager]
      KMS[KMS CMK]
    end

    User-->|https|Route53
    Route53-->|DNS resolves|CloudFront
    Route53-->|DNS resolves|ALB
    CloudFront-->|Serves static files|S3
    CloudFront-->|WAF|CloudFront
    CloudFront-->|HTTPS|ALB
    ALB-->|HTTPS|ALB_ENI
    ALB_ENI-->|Forwards traffic to|ECS
    ECS-->|Reads/writes|RDS
    ECS-->|Logs to|CloudWatch
    ECS-->|Fetches secrets from|Secrets
    ECS-->|Scanned by|Inspector
    S3-->|Private bucket|CloudFront
    S3-->|Encrypted with|KMS
    RDS-->|Encrypted with|KMS
    Secrets-->|Encrypted by|KMS
    CloudWatch-->|Encrypted by|KMS
    ALB-->|WAF|ALB

    classDef public fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef dmz fill:#
```

**Legend:**
- 🔵 Public: User, Internet
- 🟢 DMZ: Route53, CloudFront, ALB (public-facing)
- 🟡 VPC: All private AWS resources (subnets, ECS, RDS, S3, CloudWatch, Inspector)
- 🔒 Sensitive: Secrets Manager, KMS

**Notes:**
- ALB2 represents the ENI (Elastic Network Interface) of the ALB inside the public subnet of the VPC.
- Only ALB and CloudFront are exposed to the public; all other resources are private.
- Security Groups and NACLs restrict traffic between subnets and services.
- S3 is private, only accessible by CloudFront (via Origin Access Identity/Control).
- RDS is only accessible from ECS (security group rules).
- Secrets Manager and KMS are only accessible from ECS and authorized AWS services. 