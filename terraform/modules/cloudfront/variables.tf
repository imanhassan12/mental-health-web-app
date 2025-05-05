variable "project" {
  description = "Project name for tagging and resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

variable "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket origin."
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS."
  type        = string
}

variable "domain_alias" {
  description = "Custom domain alias for the distribution (e.g., mentalhealthaide.com)."
  type        = string
}

variable "web_acl_id" {
  description = "The ARN of the WAF Web ACL to associate with this distribution."
  type        = string
  default     = null
} 