# ACM Module

This module provisions an AWS Certificate Manager (ACM) certificate for your domain and subdomains, validated via DNS using Route 53.

## Inputs
- `domain_name`: The domain name for the certificate (e.g., `mentalhealthaide.com`).
- `route53_zone_id`: The Route 53 hosted zone ID for DNS validation.

## Outputs
- `certificate_arn`: The ARN of the validated ACM certificate. 