variable "project" { type = string }
variable "environment" { type = string }

variable "resource_types" {
  description = "Resource types Inspector should scan (ECR, EC2, LAMBDA)."
  type        = list(string)
  default     = ["ECR", "EC2"]
} 