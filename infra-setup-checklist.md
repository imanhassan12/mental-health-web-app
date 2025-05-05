# 🛠️ Mental Health Web App AWS Infrastructure & CI/CD Checklist

## PART 1: Infrastructure with Terraform

### A. Prerequisites
- [x] **AWS account with billing enabled**
  - [x] Sign up for an AWS account at https://aws.amazon.com/
  - [x] Set up billing information and enable billing alerts
  - [x] (Optional) Set up AWS Budgets for cost control
- [x] **Domain `mentalhealthaide.com` (Route 53 hosted zone)**
  - [x] Register `mentalhealthaide.com` (either via Route 53 or another registrar)
  - [ ] If registered elsewhere, update domain nameservers to point to Route 53
  - [x] In Route 53, create a public hosted zone for `mentalhealthaide.com`
- [x] **IAM user/role with least-privilege policy and access key for CI/CD and Terraform**
  - [x] In AWS Console, go to IAM → Users → Add user
  - [x] Assign programmatic access (for CLI/CI)
  - [x] Attach the appropriate policy from the `deployments/` folder:
    - [x] For **Terraform infrastructure provisioning**: Attach `deployments/terraform-least-privilege-policy.json` (see deployments/README.md for instructions)
    - [x] For **CI/CD deployments**: Attach `deployments/cicd-deploy-policy.json` to the user/role used by your CI/CD system (see deployments/README.md for instructions)
  - [x] Download and securely store the access key and secret
  - [ ] (Optional) Set up an IAM role for CI/CD with trust policy for your CI provider
- [x] **Terraform ≥ 1.3 installed locally or in CI runner**
  - [x] Download Terraform from https://www.terraform.io/downloads.html
  - [x] Install Terraform on your local machine or CI/CD runner
  - [x] Verify installation with `terraform version`
- [x] **AWS CLI installed and configured**
  - *Why:* The AWS CLI is required to run commands for creating S3 buckets, enabling versioning, creating DynamoDB tables, and other AWS operations from your terminal or CI/CD pipeline.
  - *How:* Install the AWS CLI from https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
    - Example (macOS with Homebrew):
      ```sh
      brew install awscli
      ```
    - Example (Linux):
      ```sh
      curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
      unzip awscliv2.zip
      sudo ./aws/install
      ```
  - *Configure your credentials:*
    ```sh
    aws configure
    ```
    - Enter your AWS Access Key ID, Secret Access Key, region (e.g., us-east-1), and output format (e.g., json).
    - This will create or update `~/.aws/credentials` and `~/.aws/config` files.
- [x] **(Recommended) Remote state backend – S3 + DynamoDB lock table**
  - [x] Create an S3 bucket for Terraform state (e.g., `mentalhealthaide-terraform-state`)
    - *Why:* Stores your Terraform state file centrally and securely, so your team and CI/CD pipelines can share and update infrastructure state.
    - *How:* In AWS Console or CLI, create a new S3 bucket. Example CLI:
      ```sh
      aws s3api create-bucket --bucket mentalhealthaide-terraform-state --region us-east-1
      ```
  - [x] Set S3 bucket Object Ownership to "ACLs disabled (recommended)"
    - *Why:* Ensures all objects are owned by your account and access is managed only by bucket policy.
    - *How:* In the S3 bucket settings, select "ACLs disabled (recommended)".
  - [x] Block all public access to the S3 bucket
    - *Why:* Prevents accidental or intentional public exposure of sensitive state files.
    - *How:* In the S3 bucket settings, check "Block all public access" (all four options).
  - [x] Enable versioning on the S3 bucket
    - *Why:* Keeps a history of all changes to your state file, allowing you to recover from mistakes or rollbacks.
    - *How:* In AWS Console, go to the bucket → Properties → Enable versioning. Or CLI:
      ```sh
      aws s3api put-bucket-versioning --bucket mentalhealthaide-terraform-state --versioning-configuration Status=Enabled
      ```
  - [x] Create a DynamoDB table for state locking (e.g., `terraform-locks`, with `LockID` as the primary key)
    - *Why:* Prevents concurrent Terraform runs from corrupting your state file by locking it during operations.
    - *How:* In AWS Console, go to DynamoDB → Create table. Table name: `terraform-locks`, Primary key: `LockID` (String). Or CLI:
      ```sh
      aws dynamodb create-table --table-name terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST
      ```
  - [x] Configure `backend` block in `main.tf` to use S3 and DynamoDB
    - *Why:* Tells Terraform to use your S3 bucket for state and DynamoDB for locking, enabling safe, collaborative infrastructure management.
    - *How:* Add this to the very beginning of your `main.tf`:
      ```hcl
      terraform {
        backend "s3" {
          bucket         = "mentalhealthaide-terraform-state"
          key            = "global/s3/terraform.tfstate"
          region         = "us-east-1"
          dynamodb_table = "terraform-locks"
          encrypt        = true
        }
      }
      ```
  - [x] **(Optional) Attach DynamoDB management policy for Terraform state locking**
    - *Why:* If you want to use a separate IAM user/role for managing only the DynamoDB table for Terraform state locking, attach the least-privilege policy in `deployments/terraform-dynamodb-policy.json`.
    - *How:* Go to AWS Console → IAM → Users/Roles, and attach the policy from `deployments/terraform-dynamodb-policy.json` (see deployments/README.md for instructions). This is only needed if you want to separate DynamoDB management from broader Terraform permissions.
- [x] **Two SSL certificates in us-east-1 via ACM:**
  - [x] In AWS Console, go to Certificate Manager (ACM) in `us-east-1` region
  - [x] Request a public certificate for:
    - [x] `app.mentalhealthaide.com`
    - [x] `api.mentalhealthaide.com`
  - [x] Choose DNS validation
  - [x] Add the provided CNAME records to your Route 53 hosted zone
    - *Why:* ACM uses these DNS records to validate that you own the domain.
    - *How:*
      - In Route 53, create a new record:
        - **Record type:** CNAME
        - **TTL:** 300 seconds (recommended for fast propagation)
        - **Routing policy:** Simple routing (default)
        - **Record name:** (as provided by ACM, e.g., `_xxxx.app.domain.com`)
        - **Value:** (as provided by ACM, e.g., `_xxxx.app.domain.com`)
      - Click "Create records" to save.
  - [x] Wait for ACM to validate and issue the certificates
- [x] **Approve ACM DNS CNAMEs in Route 53 (manual step)**
  - [x] Confirm that the DNS validation records are present in Route 53
  - [x] Check ACM status until certificates are issued (Status: "Issued")

### B. Recommended Terraform Folder Layout
- [x] Create the following structure:
  - [x] `terraform/`
    - [x] `main.tf` (backend config + providers)
    - [x] `variables.tf` (global variables)
    - [x] `outputs.tf` (global outputs)
    - [x] `modules/` (custom modules)
      - [x] `vpc/`
      - [x] `rds/`
      - [x] `ecr/`
      - [x] `ecs/`
      - [x] `cloudfront/`
    - [x] `envs/`
      - [x] `dev/` (`terraform.tfvars` for dev)
      - [x] `prod/` (`terraform.tfvars` for prod)

### C. High-Level Resources to Declare
- [ ] **Networking**
  - [ ] VPC, 2–3 public + private subnets, NAT gateways, route tables
    - *What/Why:* Isolates your resources, provides secure networking, and enables public/private separation for security and cost.
    - *How:* Use a Terraform VPC module or `aws_vpc`, `aws_subnet`, `aws_nat_gateway`, and `aws_route_table` resources. Assign public subnets for ALB, private for ECS/RDS.
  - [ ] Security groups: ALB → ECS (HTTP/HTTPS), ECS → RDS, etc.
    - *What/Why:* Controls network traffic between resources, acting as virtual firewalls.
    - *How:* Use `aws_security_group` resources. Allow only necessary ports (e.g., 80/443 for ALB, 4000 for ECS, 3306 for RDS from ECS).
- [ ] **RDS MySQL** (`aws_db_instance`)
  - [ ] Parameter group `mysql8.0`
    - *What/Why:* Customizes MySQL settings for your workload.
    - *How:* Use `aws_db_parameter_group` with family `mysql8.0`.
  - [ ] Username/password pulled from AWS Secrets Manager
    - *What/Why:* Securely stores DB credentials, avoids hardcoding secrets.
    - *How:* Define secrets in `terraform.tfvars` (e.g., `db_username`, `db_password`). Use `aws_secretsmanager_secret` and `aws_secretsmanager_secret_version` to create and populate secrets. Reference these in your RDS and ECS definitions.
- [ ] **Elastic Container Registry (ECR)** for backend image
  - [ ] Private repo: `mental-health-backend`
    - *What/Why:* Stores Docker images for your backend, required for ECS deployment.
    - *How:* Use `aws_ecr_repository` in Terraform. Push images from CI/CD using AWS CLI or GitHub Actions ECR login.
- [ ] **ECS (Fargate) Cluster + Service + Task Definition**
  - [ ] Task role + execution role IAM
    - *What/Why:* Grants ECS tasks permissions to pull images, read secrets, write logs, etc.
    - *How:* Use `aws_iam_role` and `aws_iam_policy_attachment` for `ecsTaskExecutionRole` and custom roles for Secrets Manager access.
  - [ ] Container "backend" listening on 4000
    - *What/Why:* Runs your Node/Express app in a managed container environment.
    - *How:* Define a task definition JSON or use Terraform's `aws_ecs_task_definition`. Set container port to 4000.
  - [ ] Secrets injected from Secrets Manager (JWT, DB credentials, etc.)
    - *What/Why:* Keeps sensitive config out of code and environment files.
    - *How:* In your ECS task definition, use the `secrets` block to reference Secrets Manager ARNs. Pass secret ARNs via `terraform.tfvars` or outputs from secret creation.
  - [ ] Auto-scaling policy (CPU / memory) if desired
    - *What/Why:* Automatically adjusts service size based on load.
    - *How:* Use `aws_appautoscaling_target` and `aws_appautoscaling_policy` for ECS service.
- [ ] **Application Load Balancer (ALB)**
  - [ ] HTTPS listener: certificate `api.mentalhealthaide.com`
    - *What/Why:* Provides secure, scalable entry point for your API.
    - *How:* Use `aws_lb`, `aws_lb_listener`, and attach ACM certificate ARN (from outputs or data source).
  - [ ] Target group: ECS tasks (health check `/`)
    - *What/Why:* Routes traffic to healthy backend containers.
    - *How:* Use `aws_lb_target_group` and set health check path to `/`.
  - [ ] (Optional) WAF ACL
    - *What/Why:* Protects against common web attacks (OWASP Top 10).
    - *How:* Use `aws_wafv2_web_acl` and associate with ALB.
- [ ] **S3 Static Website Bucket** (`app.mentalhealthaide.com`)
  - [ ] Block public ACLs; allow only OAC/OAI from CloudFront
    - *What/Why:* Prevents direct public access, only allows CloudFront to serve content.
    - *How:* Use `aws_s3_bucket`, set `block_public_acls` and `block_public_policy` to true. Create OAI/OAC and attach bucket policy.
  - [ ] Static hosting enabled; index & error = `index.html`
    - *What/Why:* Allows S3 to serve your React app as a static website.
    - *How:* Set `website` block in `aws_s3_bucket` with `index_document` and `error_document`.
- [ ] **CloudFront Distribution** for frontend
  - [ ] Origin = S3 bucket (Origin Access Control)
    - *What/Why:* Distributes static content globally with low latency.
    - *How:* Use `aws_cloudfront_distribution`, set origin to S3 bucket website endpoint, use OAI/OAC.
  - [ ] Alternate domain = `app.mentalhealthaide.com`; attach SSL cert
    - *What/Why:* Enables custom domain and HTTPS for your frontend.
    - *How:* Set `aliases` to your domain, attach ACM cert ARN.
  - [ ] Default root object `index.html`
    - *What/Why:* Ensures React SPA works with direct URL access.
    - *How:* Set `default_root_object` to `index.html` in CloudFront resource.
  - [ ] (Optional) Security headers, caching rules
    - *What/Why:* Improves security and performance.
    - *How:* Use `default_cache_behavior` and `response_headers_policy_id`.
- [ ] **Route 53 Records**
  - [ ] A (alias) `app.mentalhealthaide.com` → CloudFront
    - *What/Why:* Maps your frontend domain to CloudFront distribution.
    - *How:* Use `aws_route53_record` with type `A` and alias to CloudFront.
  - [ ] A (alias) `api.mentalhealthaide.com` → ALB
    - *What/Why:* Maps your API domain to the ALB.
    - *How:* Use `aws_route53_record` with type `A` and alias to ALB DNS name.
- [ ] **Outputs (used later in CI/CD)**
  - [ ] `frontend_bucket_name`
    - *What/Why:* Needed for CI/CD to upload frontend build artifacts.
    - *How:* Output the S3 bucket name from Terraform.
  - [ ] `cloudfront_distribution_id`
    - *What/Why:* Needed for CI/CD to invalidate cache after deploy.
    - *How:* Output the CloudFront distribution ID from Terraform.
  - [ ] `backend_alb_dns` & `api_domain`
    - *What/Why:* Used for API endpoint and health checks.
    - *How:* Output the ALB DNS name and Route 53 API domain.
  - [ ] `ecr_repo_url`
    - *What/Why:* Used by CI/CD to push Docker images.
    - *How:* Output the ECR repo URL from Terraform.

### D. Terraform Execution Steps
- [x] **Change to the Terraform directory for your environment**
  - For dev:
    ```sh
    cd terraform
    terraform init -backend-config=envs/dev/backend.conf
    terraform plan -var-file=envs/dev/terraform.tfvars -out=tfplan.dev
    terraform apply tfplan.dev
    ```
  - For prod:
    ```sh
    cd terraform
    terraform init -backend-config=envs/prod/backend.conf
    terraform plan -var-file=envs/prod/terraform.tfvars -out=tfplan.prod
    terraform apply tfplan.prod
    ```
  - *Tip:* If you use workspaces:
    ```sh
    terraform workspace new dev   # (first time only)
    terraform workspace select dev
    terraform plan -var-file=envs/dev/terraform.tfvars -out=tfplan.dev
    terraform apply tfplan.dev
    ```
- [x] **After apply, DNS records and certificates are active; the infrastructure is ready for code.**
  - *Check outputs with:*
    ```sh
    terraform output
    ```
  - *If you need to destroy resources:*
    ```sh
    terraform destroy -var-file=envs/dev/terraform.tfvars
    ```

### E. Manual Touch-Points (one-time)
- [x] **Approve ACM DNS validations (Terraform can automate if zone in same account)**
  - *Go to AWS Console → ACM → Check certificate status. If pending, copy DNS CNAME records to Route 53 as instructed.*
- [ ] **Add any additional TXT records (SPF, DKIM) not managed by Terraform**
  - *Go to AWS Console → Route 53 → Hosted Zones → Add Record.*

---

## PART 2: CI/CD (Automate Code & Content Deployment)

### A. Required GitHub Secrets
- [ ] **Set up AWS credentials in GitHub**
  - *GitHub UI: Settings → Secrets and variables → Actions → New repository secret*
  - *Use the access key and secret from the IAM user/role with the `cicd-deploy-policy.json` attached (see deployments/README.md)*

### B. GitHub Actions Workflow (`.github/workflows/deploy.yml`)
- [ ] **Create workflow file**
  - ```sh
    mkdir -p .github/workflows
    touch .github/workflows/deploy.yml
    ```
- [ ] **Backend job details**
  - *Build and push Docker image:*
    ```sh
    docker build -t $IMAGE .
    docker push $IMAGE
    ```
  - *Update ECS task definition and deploy:*
    ```sh
    aws ecs register-task-definition --cli-input-json file://taskdef.json
    aws ecs update-service --cluster <cluster> --service <service> --force-new-deployment
    ```
- [ ] **Frontend job details**
  - *Build React app:*
    ```sh
    REACT_APP_API_URL=https://api.mentalhealthaide.com npm run build
    ```
  - *Sync to S3:*
    ```sh
    aws s3 sync build/ s3://$S3_BUCKET_FRONTEND/ --delete
    ```
  - *Invalidate CloudFront cache:*
    ```sh
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths '/*'
    ```

### How to Upload/Sync React Build to S3 and Invalidate CloudFront

- **Build your React app:**
  ```sh
  cd client
  npm run build
  ```
- **Sync to S3:**
  Replace `<your-bucket-name>` with your actual S3 bucket name (e.g., `mentalhealthaide-dev-frontend`):
  ```sh
  aws s3 sync build/ s3://<your-bucket-name>/ --delete
  ```
  Example:
  ```sh
  aws s3 sync build/ s3://mentalhealthaide-dev-frontend/ --delete
  ```
- **Get your CloudFront Distribution ID:**
  - In the AWS Console: Go to CloudFront, look for the distribution with your domain (e.g., `app.mentalhealthaide.com`). The ID is in the 'ID' column.
  - Or, use the AWS CLI:
    ```sh
    aws cloudfront list-distributions --query "DistributionList.Items[].{Id:Id, DomainName:DomainName, Aliases:Aliases.Items}" --output table
    ```
  - Or, if managed by Terraform, run:
    ```sh
    terraform output cloudfront_distribution_id
    ```
  - For this project, the distribution ID is: `E2R6BEZYMY6YK2`
- **Invalidate CloudFront cache:**
  ```sh
  aws cloudfront create-invalidation --distribution-id E2R6BEZYMY6YK2 --paths '/*'
  ```
- **Required AWS CLI permissions:**
  - `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` for the S3 bucket
  - `cloudfront:CreateInvalidation` for the CloudFront distribution

### C. Job ordering & concurrency
- [ ] *In deploy.yml, set:*
  ```yaml
  needs: backend
  concurrency:
    group: deploy
    cancel-in-progress: true
  ```

### D. When Infrastructure Changes (Terraform in CI)
- [ ] *Add a job in your workflow to run:*
  ```sh
  terraform fmt -check
  terraform validate
  terraform plan -var-file=envs/dev/terraform.tfvars -out=tfplan.dev
  # (manual approval step)
  terraform apply tfplan.dev
  ```

### E. Branch-based Environments
- [ ] *For dev branch:*
  ```sh
  terraform plan -var-file=envs/dev/terraform.tfvars -out=tfplan.dev
  terraform apply tfplan.dev
  ```
- [ ] *For prod branch:*
  ```sh
  terraform plan -var-file=envs/prod/terraform.tfvars -out=tfplan.prod
  terraform apply tfplan.prod
  ```

---

## PART 3: Operational Checklist
- [ ] **Scaling**
  - [ ] *Verify ECS Service Auto-Scaling*
    - Run `aws application-autoscaling describe-scalable-targets --service-namespace ecs --region $AWS_REGION | jq '.ScalableTargets[] | select(.ResourceId | contains("service/"))'` and confirm a target with `MinCapacity` / `MaxCapacity` is present for your ECS service.
    - Confirm CPU target tracking policy with:
      ```sh
      aws application-autoscaling describe-scaling-policies --service-namespace ecs \
        | jq '.ScalingPolicies[] | select(.PolicyType=="TargetTrackingScaling")'
      ```
  - [ ] *Check ALB Request-Count Scaling (optional)*
    - Confirm an Application Auto Scaling target exists for `ResourceId == "app/<alb-name>/<id>"`.
  - [ ] *RDS Instance Class & Storage Auto-Scaling*
    - In AWS Console → RDS → Databases, verify instance class is `db.t3.micro` (dev) and `Storage Autoscaling` is **Enabled**.

- [ ] **Monitoring & Logging**
  - [ ] *ALB Access Logs to S3*
    - Navigate to EC2 → Load Balancers → **Attributes** tab → verify **Access logs** enabled, bucket ARN points to log bucket.
  - [ ] *CloudWatch Log Groups Exist & Receiving Events*
    - Run `aws logs describe-log-groups --log-group-name-prefix mentalhealthaide` and confirm frontend, backend, rds groups.
    - Tail one group: `aws logs tail /aws/ecs/backend --since 5m`.
  - [ ] *CloudWatch Alarms*
    - List alarms: `aws cloudwatch describe-alarms --alarm-names "ECS-CPU-High" "ECS-Mem-High" "ALB-5XX"` and verify `StateValue` is `OK`.
  - [ ] *RDS Enhanced Monitoring*
    - In RDS console, DB instance → **Monitoring** tab should show Enhanced metrics. Terraform: `monitoring_interval = 60`.

- [ ] **Backups & DR**
  - [ ] *Automated RDS Snapshots*
    - DB instance details → **Maintenance & backups** → `Automated backups` shows retention ≥ 7 days.
  - [ ] *Cross-Region Snapshot Copy*
    - Check RDS → Snapshots → `Snapshot Actions` → `Copy Snapshot` automation or Terraform `aws_db_snapshot_copy` exists.
  - [ ] *S3 Versioning & Lifecycle Rules*
    - `aws s3api get-bucket-versioning --bucket <bucket>` returns `Enabled`.
    - `aws s3api get-bucket-lifecycle-configuration --bucket <bucket>` shows Glacier/IA transitions.

- [ ] **Security Hardening**
  - [ ] *WAF Association*
    - `aws wafv2 list-web-acls --scope CLOUDFRONT` → find ACL ID; `aws wafv2 list-resources-for-web-acl` confirms attached to distribution/ALB.
  - [ ] *ALB SG Ports*
    - Describe SG: `aws ec2 describe-security-groups --group-ids <alb_sg>`; only port 443 should be open to 0.0.0.0/0.
  - [ ] *Secrets Rotation*
    - For each secret: `aws secretsmanager describe-secret --secret-id <arn>`; check `RotationEnabled: true`.
  - [ ] *KMS Encryption Checks*
    - `aws rds describe-db-instances --db-instance-identifier <id> | jq '.DBInstances[0].StorageEncrypted'` returns true.
    - `aws cloudwatch logs describe-log-groups --log-group-name-prefix mentalhealthaide | jq '.logGroups[].kmsKeyId'` non-null.

- [ ] **Cost Optimisation**
  - [ ] *Resource Tagging Audit*
    - `aws resourcegroupstaggingapi get-resources --tag-filters Key=project,Values=mental-health` should list all core resources.
  - [ ] *Savings Plan Coverage*
    - In AWS Console → Cost Management → Savings Plans → verify active plan or run cost explorer `coverage` report.
  - [ ] *CloudFront Cache Hit Ratio*
    - CloudFront console → Monitoring → `Cache hit rate` chart ≥ 90% for static assets.

- [ ] **CloudTrail enabled and logs stored in encrypted, versioned S3 bucket**
  - [ ] *Trail Status*
    - `aws cloudtrail describe-trails` → `IsMultiRegionTrail: true`, `HomeRegion: us-east-1`.
  - [ ] *S3 Bucket Policy & Encryption*
    - `aws s3api get-bucket-policy --bucket <trail-bucket>` contains `cloudtrail.amazonaws.com` principal.
    - `aws s3api get-bucket-encryption --bucket <trail-bucket>` returns `SSEAlgorithm` AES256 or aws:kms.

- [ ] **CloudWatch Log Groups created for all major workloads**
  - [ ] Log groups for frontend, backend, and RDS exist
  - [ ] Log groups are encrypted with KMS CMK
  - [ ] Log retention set (e.g., 30 days)

- [ ] **KMS Customer Managed Key (CMK) created and used**
  - [ ] *Key Rotation*
    - `aws kms get-key-rotation-status --key-id <keyId>` returns `KeyRotationEnabled: true`.

- [ ] **AWS Inspector v2 enabled for ECR and EC2**
  - [ ] *Inspector Coverage*
    - `aws inspector2 list-enablement-status --resource-types ECR EC2` ensure `STATUS: ENABLED`.

- [ ] **Cognito User Pool for authentication**
  - [ ] *Hosted UI test*
    - Open `https://<userpool-domain>.auth.<region>.amazoncognito.com/login?client_id=<client_id>&response_type=code&redirect_uri=https://app.mentalhealthaide.com/auth/callback` – login page should display.

- [ ] **ALB OIDC authentication with Cognito**
  - [ ] *401→Cognito Redirect*
    - Curl the API: `curl -I https://api.mentalhealthaide.com/` should respond `HTTP 302` redirecting to Cognito domain.

- [ ] **Terraform outputs for CI/CD and DNS**
  - [ ] *Check Outputs*
    - Run `terraform output` and verify Cognito, ALB, CloudFront, RDS, and ECR values are present.

---

## ECR/ECS: Where to docker push and how does ECS know?

- **Where to push:**
  - Push your Docker image to the ECR repository created by your Terraform code.
  - Find the ECR repo URL in the AWS Console or via Terraform output (e.g., `module.ecr.repository_url`).
  - Example push workflow:
    ```sh
    docker build -t mentalhealthaide-dev-backend:latest .
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
    docker tag mentalhealthaide-dev-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/mentalhealthaide-dev-backend:latest
    docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/mentalhealthaide-dev-backend:latest
    ```

- **How does ECS know which image to use?**
  - In your ECS module, you specify the image in the `container_image` variable (or in your `terraform.tfvars`).
  - Example:
    ```hcl
    container_image = "<account-id>.dkr.ecr.us-east-1.amazonaws.com/mentalhealthaide-dev-backend:latest"
    ```
  - ECS will pull this image from ECR when launching tasks.

- **Where can I find or create the ECS task definition?**
  - If you use Terraform, the ECS task definition is created by the `aws_ecs_task_definition` resource, usually in `terraform/modules/ecs/main.tf`.
  - Example snippet:
    ```hcl
    resource "aws_ecs_task_definition" "main" {
      family                   = "${var.project}-${var.environment}-task"
      network_mode             = "awsvpc"
      requires_compatibilities = ["FARGATE"]
      cpu                      = var.cpu
      memory                   = var.memory
      execution_role_arn       = var.execution_role_arn
      task_role_arn            = var.task_role_arn
      container_definitions    = jsonencode([
        {
          name      = "backend"
          image     = var.container_image
          portMappings = [{ containerPort = var.container_port }]
          essential = true
          environment = [for k, v in var.env_vars : { name = k, value = v }]
        }
      ])
    }
    ```
  - You can find the actual task definition in the AWS Console under ECS → Task Definitions, or manage it entirely via Terraform as above.

# 🚀 YOU ARE READY! 

aws cloudfront get-distribution --id E2R6BEZYMY6YK2 \
  --query 'Distribution.Status'