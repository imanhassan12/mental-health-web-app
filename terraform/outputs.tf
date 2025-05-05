output "frontend_url" {
  description = "URL for the frontend (CloudFront distribution)"
  value       = module.cloudfront.distribution_domain_name
}

output "api_url" {
  description = "URL for the backend API (ALB DNS name)"
  value       = module.alb.alb_dns
}

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
}

output "alb_dns" {
  value = module.alb.alb_dns
}

output "cloudfront_domain" {
  value = module.cloudfront.distribution_domain_name
}

output "cognito_user_pool_id" { value = module.cognito.user_pool_id }
output "cognito_user_pool_client_id" { value = module.cognito.user_pool_client_id }
output "cognito_user_pool_domain" { value = module.cognito.user_pool_domain } 