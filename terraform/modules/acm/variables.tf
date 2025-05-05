variable "domain_name" {
  description = "The domain name for the ACM certificate."
  type        = string
}
 
variable "route53_zone_id" {
  description = "The Route 53 hosted zone ID for DNS validation."
  type        = string
} 