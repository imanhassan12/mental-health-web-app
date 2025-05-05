variable "project" {
  description = "Project name for tagging and resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

variable "aws_region" {
  description = "AWS region to deploy resources in."
  type        = string
} 