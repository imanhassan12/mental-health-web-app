variable "project" { type = string }
variable "environment" { type = string }

variable "scope" {
  description = "Scope of the WAF ACL (CLOUDFRONT or REGIONAL)."
  type        = string
  default     = "CLOUDFRONT"
} 