# Terraform Infrastructure for MentalHealthAide

This Terraform configuration provisions all core AWS infrastructure for the MentalHealthAide project, including:
- VPC (networking)
- ECS (Fargate for backend)
- RDS (MySQL database)
- S3 (static frontend hosting)
- CloudFront (CDN for frontend)
- Route 53 (DNS)
- ACM (TLS/SSL certificates)

## Directory Structure
- `main.tf` – Root configuration, wires modules together
- `variables.tf` – Input variables
- `outputs.tf` – Outputs
- `modules/` – Custom modules for each major AWS component

## Prerequisites
- [Terraform](https://www.terraform.io/downloads.html) >= 1.3.0
- AWS CLI configured with appropriate credentials
- Domain name (e.g., `mentalhealthaide.com`) registered (can use Route 53 or external registrar)

## Step-by-Step Usage

1. **Clone the repository and cd into the terraform directory:**
   ```sh
   cd terraform
   ```

2. **Initialize Terraform:**
   ```sh
   terraform init
   ```

3. **Set variables (optional):**
   - Edit `variables.tf` or use a `terraform.tfvars` file to set your `domain_name` and other variables.

4. **Plan the deployment:**
   ```sh
   terraform plan
   ```

5. **Apply the configuration:**
   ```sh
   terraform apply
   ```
   - Review and approve the plan when prompted.

6. **Update your domain registrar:**
   - After the Route 53 hosted zone is created, update your domain's nameservers at your registrar to match the Route 53 name servers (output after apply).

7. **Verify ACM certificate validation:**
   - ACM will automatically validate via DNS using Route 53 records. Wait for validation to complete before using the certificate in CloudFront/ALB.

## CI/CD Pipeline
- Use GitHub Actions or another CI/CD tool to automate `terraform plan` and `terraform apply` on push/merge to main.
- Store AWS credentials securely (e.g., GitHub OIDC or repository secrets).
- Example workflows can be provided on request.

## Notes
- All resources are created in the region specified by `aws_region` (default: `us-east-1`).
- Destroy resources with `terraform destroy` when no longer needed.

## Best Practices: Handling Interruptions and Manual Resource Deletion

### If `terraform apply` or `terraform destroy` is Interrupted
- **Terraform is resumable and idempotent.**
- If interrupted (Ctrl+C, network loss, etc.), wait for the state lock to clear (if using remote state/DynamoDB lock).
- **To resume:**
  1. Re-run the same `terraform apply` or `terraform destroy` command.
  2. Terraform will continue from where it left off, reconciling the current state with AWS.

### If You Manually Delete a Resource in AWS
- **Terraform state will drift.**
- On next `terraform apply`, Terraform will attempt to re-create the missing resource.
- On next `terraform destroy`, Terraform will attempt to delete it, get a "not found" error, and remove it from state.
- **To clean up state for manually deleted resources:**
  - Use `terraform state rm <resource_address>` to remove the resource from state if you do not want it re-created.

### Common Destroy Issues and Fixes
- **DependencyViolation:** Resource (subnet, SG, IGW, etc.) still in use. Delete dependents (ENIs, NAT Gateways, EC2, etc.) first, then re-run destroy.
- **BucketNotEmpty:** S3 buckets must be empty before deletion. Empty manually or set `force_destroy = true` in the resource.
- **AuthFailure:** Ensure your IAM user/role has permissions to detach/delete all resources.
- **ENI Detach Issues:** Wait and retry, or manually detach ENIs in the AWS Console.

### General Recovery Steps
1. Fix blockers (empty buckets, detach ENIs, delete dependents).
2. Re-run `terraform destroy` until all resources are gone.
3. Use `terraform state rm` only if you are sure a resource is deleted in AWS but still tracked in state.

### How to Check for State Drift
- Run `terraform plan` to see what Terraform thinks is missing or changed.
- If you want to remove a resource from state (not re-create it), use `terraform state rm <resource_address>`.

---

For questions or help, see the module READMEs or contact the project maintainer. 