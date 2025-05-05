variable "project" {
  description = "Project name for tagging and resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

variable "subnet_ids" {
  description = "List of private subnet IDs for ECS tasks."
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID for ECS and security group."
  type        = string
}

variable "container_image" {
  description = "Docker image for the backend service."
  type        = string
}

variable "container_port" {
  description = "Port the container listens on."
  type        = number
  default     = 4000
}

variable "cpu" {
  description = "CPU units for the task."
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory (MiB) for the task."
  type        = number
  default     = 512
}

variable "execution_role_arn" {
  description = "ARN of the IAM role for ECS task execution."
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the IAM role for the ECS task."
  type        = string
}

variable "env_vars" {
  description = "Environment variables to pass to the container."
  type        = map(string)
  default     = {}
}

variable "target_group_arn" {
  description = "ARN of the ALB target group for ECS service."
  type        = string
  default     = null
}

variable "log_group_name" {
  description = "CloudWatch Logs group name for container logs; defaults to <project>-<environment>-backend."
  type        = string
  default     = null
}

variable "aws_region" {
  description = "AWS region (needed for awslogs)."
  type        = string
} 