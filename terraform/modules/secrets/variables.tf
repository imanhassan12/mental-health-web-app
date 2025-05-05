variable "project" {
  description = "Project name for tagging and resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

variable "twilio_account_sid" {
  description = "Twilio Account SID to store in Secrets Manager."
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token to store in Secrets Manager."
  type        = string
  sensitive   = true
}

variable "twilio_phone_number" {
  description = "Twilio Phone Number to store in Secrets Manager."
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API Key to store in Secrets Manager."
  type        = string
  sensitive   = true
}

variable "kms_key_id" {
  description = "KMS key ARN for encrypting secrets."
  type        = string
  default     = null
}

variable "db_rotation_lambda_arn" {
  description = "ARN of Lambda function for rotating DB password secret; set to null to disable rotation resource."
  type        = string
  default     = null
}

variable "jwt_rotation_lambda_arn" {
  description = "ARN of Lambda function for rotating JWT secret; set to null to disable rotation resource."
  type        = string
  default     = null
} 