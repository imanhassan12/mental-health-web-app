resource "aws_cognito_user_pool" "main" {
  name = "${var.project}-${var.environment}-user-pool"
  auto_verified_attributes = ["email"]
  alias_attributes        = ["email"]
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project}-${var.environment}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project}-${var.environment}-client"
  user_pool_id = aws_cognito_user_pool.main.id
  generate_secret = true
  allowed_oauth_flows = var.allowed_oauth_flows
  allowed_oauth_scopes = var.allowed_oauth_scopes
  allowed_oauth_flows_user_pool_client = true
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls
  supported_identity_providers = ["COGNITO"]
}

output "user_pool_id" { value = aws_cognito_user_pool.main.id }
output "user_pool_client_id" { value = aws_cognito_user_pool_client.main.id }
output "user_pool_domain" { value = aws_cognito_user_pool_domain.main.domain }
output "user_pool_arn" { value = aws_cognito_user_pool.main.arn } 