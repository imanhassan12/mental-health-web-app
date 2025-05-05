variable "project" { type = string }
variable "environment" { type = string }

variable "callback_urls" {
  description = "List of callback URLs for OAuth2 flow."
  type        = list(string)
  default     = []
}

variable "logout_urls" {
  description = "List of logout URLs."
  type        = list(string)
  default     = []
}

variable "allowed_oauth_flows" {
  description = "OAuth flows to enable (code, implicit)."
  type        = list(string)
  default     = ["code"]
}

variable "allowed_oauth_scopes" {
  description = "OAuth scopes."
  type        = list(string)
  default     = ["email", "openid", "profile"]
} 