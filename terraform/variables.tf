variable "aws_region" {
  description = "AWS region to deploy resources in."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Root domain name (e.g., mentalhealthaide.com)"
  type        = string
}

variable "project" {
  description = "Project name for tagging and resource naming."
  type        = string
  default     = "mentalhealthaide"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "List of availability zones to use."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "twilio_account_sid" {
  description = "Twilio Account SID for SMS integration."
  type        = string
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token for SMS integration."
  type        = string
}

variable "twilio_phone_number" {
  description = "Twilio phone number for SMS integration."
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API key for AI features."
  type        = string
}

variable "container_image" {
  description = "Container Image for Backend"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "Optional list of CIDR blocks for public subnets (if you want to override defaults)."
  type        = list(string)
  default     = null
}

variable "private_subnet_cidrs" {
  description = "Optional list of CIDR blocks for private subnets (if you want to override defaults)."
  type        = list(string)
  default     = null
}

variable "backend_container_port" {
  description = "Port that the backend container listens on (override default 4000)."
  type        = number
  default     = 4000
}

variable "frontend_domain" {
  description = "Optional subdomain for frontend (e.g., app.example.com)."
  type        = string
  default     = null
}

variable "api_domain" {
  description = "Optional subdomain for the API (e.g., api.example.com)."
  type        = string
  default     = null
}

variable "alb_certificate_arn" {
  description = "Existing ACM certificate ARN for the API ALB (api.mentalhealthaide.com)."
  type        = string
}

variable "cloudfront_certificate_arn" {
  description = "Existing ACM certificate ARN for the CloudFront distribution (app.mentalhealthaide.com)."
  type        = string
}

variable "cloudfront_domain_alias" {
  description = "Custom domain alias for the CloudFront distribution (e.g., app.mentalhealthaide.com)."
  type        = string
}

variable "db_username" {
  description = "Database master username."
  type        = string
}

variable "db_name" {
  description = "Database name to create/use in RDS."
  type        = string
} 