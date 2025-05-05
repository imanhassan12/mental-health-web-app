variable "project" { type = string }
variable "environment" { type = string }

variable "log_group_names" {
  description = "Extra log group names to create in addition to defaults."
  type        = list(string)
  default     = []
}

variable "retention_in_days" {
  description = "Retention period for logs."
  type        = number
  default     = 30
}

variable "kms_key_id" {
  description = "KMS key ARN for log group encryption."
  type        = string
  default     = null
} 