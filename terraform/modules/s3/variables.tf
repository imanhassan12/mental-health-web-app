variable "project" {
  description = "Project name for tagging and resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

variable "bucket_name" {
  description = "Name of the S3 bucket."
  type        = string
} 