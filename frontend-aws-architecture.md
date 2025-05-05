# Frontend AWS Architecture (mentalhealthaide.com)

```mermaid
graph TD
    User((User))
    Route53[Route 53<br/>DNS]
    CloudFront[CloudFront<br/>CDN + WAF]
    ACM[ACM<br/>TLS/SSL Certs]
    S3[S3 Bucket<br/>Static React Build<br/>Encrypted, Versioned]
    KMS[KMS CMK]

    User-->|https://mentalhealthaide.com|Route53
    Route53-->|DNS resolves to|CloudFront
    CloudFront-->|Serves static files|S3
    CloudFront-->|Uses cert|ACM
    CloudFront-->|WAF attached|CloudFront
    S3-->|Private bucket, only CloudFront access|CloudFront
    S3-->|Encrypted|KMS

    classDef aws fill:#f3f7fa,stroke:#232f3e,stroke-width:2px;
    class Route53,CloudFront,ACM,S3,KMS aws;
```

---

**Flow:**
1. User visits `https://mentalhealthaide.com`.
2. Route 53 resolves the domain to CloudFront.
3. CloudFront (with ACM TLS cert and WAF) serves the static React app from the S3 bucket.
4. S3 bucket is private, encrypted (SSE-S3 or KMS), versioned, and only accessible by CloudFront.

---

**Key AWS Services & Security Practices:**
- **S3:** Stores static frontend files, encrypted and versioned
- **CloudFront:** CDN, HTTPS, WAF attached
- **Route 53:** DNS
- **ACM:** TLS/SSL certificates (DNS validated)
- **KMS:** Encryption for S3

---

**Operational Best Practices:**
- S3 bucket is private, encrypted, and versioned
- CloudFront cache invalidation after deploy
- Use `terraform plan` to detect drift; re-run `apply`/`destroy` to recover from interruptions 