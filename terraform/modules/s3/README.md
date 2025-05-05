# S3 Module

This module provisions a production-grade S3 bucket for static frontend hosting.

## Features
- Private bucket (blocks all public access)
- Versioning enabled
- Server-side encryption (AES256)
- Tags for project and environment

## Inputs
- `project`: Project name for tagging and naming
- `environment`: Deployment environment (dev, staging, prod)
- `bucket_name`: Name of the S3 bucket

## Outputs
- `bucket_name`: Name of the S3 bucket
- `bucket_arn`: ARN of the S3 bucket 