variable "project" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "certificate_arn" { type = string }
variable "ecs_sg_id" { type = string }
variable "alb_listener_port" {
  type    = number
  default = 443
}
variable "container_port" {
  type    = number
  default = 4000
}
variable "oidc_enabled" {
  type    = bool
  default = false
}
variable "oidc_client_id" {
  type    = string
  default = null
}
variable "oidc_user_pool_arn" {
  type    = string
  default = null
}
variable "oidc_domain" {
  type    = string
  default = null
}
variable "oidc_session_timeout" {
  type    = number
  default = 3600
} 