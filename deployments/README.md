# Deployment IAM Policies

This folder contains IAM policy JSON files for least-privilege access, organized by use case:

## 1. Terraform Infrastructure Provisioning

**File:** `terraform-least-privilege-policy.json`

- Use for the IAM user or role that runs Terraform to provision and manage AWS infrastructure.
- Grants permissions to create, update, and delete all resources managed by Terraform (VPC, RDS, ECS, ECR, S3, CloudFront, Route 53, ACM, Secrets Manager, IAM roles, etc.).
- Use this policy for infrastructure-as-code automation, not for application deploys.

**Attach to:**
- The IAM user or role used for running `terraform apply`.

---

## 2. CI/CD Deployment

**File:** `cicd-deploy-policy.json`

- Use for the IAM user or role that your CI/CD system (e.g., GitHub Actions, CodePipeline) uses to deploy application code and assets.
- Grants permissions to:
  - Push Docker images to ECR
  - Update ECS services and task definitions
  - Upload frontend assets to S3
  - Invalidate CloudFront cache
  - Read secrets from Secrets Manager
- This policy is much more limited than the Terraform policy and is safer for use in automated deploys.

**Attach to:**
- The IAM user or role used by your CI/CD pipeline for deployments.

---

## How to Attach a Policy

1. Go to AWS Console → IAM → Users or Roles
2. Select the user/role
3. Click "Add permissions" → "Attach policies"
4. Click "Create policy" → "JSON" tab
5. Paste the contents of the relevant policy file
6. Save and attach the policy

---

**Security Tip:**
- Always use the minimum permissions required for each automation or user.
- Rotate access keys regularly and use roles for CI/CD where possible. 