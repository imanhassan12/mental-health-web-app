variable "project" { type = string }
variable "environment" { type = string }

variable "key_usage" {
  description = "KMS key usage (ENCRYPT_DECRYPT, SIGN_VERIFY, etc.)"
  type        = string
  default     = "ENCRYPT_DECRYPT"
}

variable "alias" {
  description = "Alias for the KMS key."
  type        = string
  default     = null
} 