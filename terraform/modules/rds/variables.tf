variable "project" {
  description = "Project name for tagging and resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

variable "db_name" {
  description = "Database name."
  type        = string
}

variable "db_username" {
  description = "Master username."
  type        = string
}

variable "db_password" {
  description = "Master password."
  type        = string
  sensitive   = true
}

variable "subnet_ids" {
  description = "List of private subnet IDs for RDS."
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID for security group."
  type        = string
}

variable "ecs_security_group_id" {
  description = "Security group ID for ECS tasks (to allow DB access)."
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ARN for RDS encryption."
  type        = string
  default     = null
} 