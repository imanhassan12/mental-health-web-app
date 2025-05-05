# CloudFront Module

This module provisions a production-grade CloudFront distribution for serving the static frontend from S3.

## Features
- CloudFront distribution for S3 origin
- Origin Access Control (OAC) for S3
- HTTPS only (ACM certificate)
- Custom domain alias support
- Tags for project and environment

## Inputs
- `project`: Project name for tagging and naming
- `environment`: Deployment environment (dev, staging, prod)
- `s3_bucket_domain_name`: Domain name of the S3 bucket origin
- `acm_certificate_arn`: ARN of the ACM certificate for HTTPS
- `domain_alias`: Custom domain alias for the distribution (e.g., mentalhealthaide.com)

## Outputs
- `distribution_domain_name`: CloudFront distribution domain name
- `distribution_id`: CloudFront distribution ID 