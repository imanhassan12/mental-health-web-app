resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name      = "${var.project}-${var.environment}-db-password"
  kms_key_id = var.kms_key_id
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name      = "${var.project}-${var.environment}-jwt-secret"
  kms_key_id = var.kms_key_id
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

resource "aws_secretsmanager_secret" "twilio_account_sid" {
  name = "${var.project}/${var.environment}/twilio-account-sid"
  description = "Twilio Account SID for ${var.project} ${var.environment}"
}

resource "aws_secretsmanager_secret_version" "twilio_account_sid" {
  secret_id     = aws_secretsmanager_secret.twilio_account_sid.id
  secret_string = var.twilio_account_sid
}

resource "aws_secretsmanager_secret" "twilio_auth_token" {
  name = "${var.project}/${var.environment}/twilio-auth-token"
  description = "Twilio Auth Token for ${var.project} ${var.environment}"
}

resource "aws_secretsmanager_secret_version" "twilio_auth_token" {
  secret_id     = aws_secretsmanager_secret.twilio_auth_token.id
  secret_string = var.twilio_auth_token
}

resource "aws_secretsmanager_secret" "twilio_phone_number" {
  name = "${var.project}/${var.environment}/twilio-phone-number"
  description = "Twilio Phone Number for ${var.project} ${var.environment}"
}

resource "aws_secretsmanager_secret_version" "twilio_phone_number" {
  secret_id     = aws_secretsmanager_secret.twilio_phone_number.id
  secret_string = var.twilio_phone_number
}

resource "aws_secretsmanager_secret_rotation" "db_password" {
  count  = var.db_rotation_lambda_arn != null ? 1 : 0
  secret_id = aws_secretsmanager_secret.db_password.id
  rotation_lambda_arn = var.db_rotation_lambda_arn
  rotation_rules {
    automatically_after_days = 30
  }
  depends_on = [aws_secretsmanager_secret_version.db_password]
}

resource "aws_secretsmanager_secret_rotation" "jwt_secret" {
  count  = var.jwt_rotation_lambda_arn != null ? 1 : 0
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  rotation_lambda_arn = var.jwt_rotation_lambda_arn
  rotation_rules {
    automatically_after_days = 30
  }
  depends_on = [aws_secretsmanager_secret_version.jwt_secret]
}

resource "aws_secretsmanager_secret" "openai_api_key" {
  name        = "${var.project}/${var.environment}/openai-api-key"
  description = "OpenAI API Key for ${var.project} ${var.environment}"
  kms_key_id  = var.kms_key_id
}

resource "aws_secretsmanager_secret_version" "openai_api_key" {
  secret_id     = aws_secretsmanager_secret.openai_api_key.id
  secret_string = var.openai_api_key
}

output "db_password_secret_arn" {
  value = aws_secretsmanager_secret.db_password.arn
}

output "jwt_secret_arn" {
  value = aws_secretsmanager_secret.jwt_secret.arn
}

output "twilio_account_sid_arn" {
  value = aws_secretsmanager_secret.twilio_account_sid.arn
}

output "twilio_auth_token_arn" {
  value = aws_secretsmanager_secret.twilio_auth_token.arn
}

output "twilio_phone_number_arn" {
  value = aws_secretsmanager_secret.twilio_phone_number.arn
}

output "openai_api_key_arn" {
  value = aws_secretsmanager_secret.openai_api_key.arn
}

output "db_password" {
  value = random_password.db_password.result
  sensitive = true
}

output "jwt_secret" {
  value = random_password.jwt_secret.result
  sensitive = true
}

output "db_password_secret_name" {
  value = aws_secretsmanager_secret.db_password.name
}

output "jwt_secret_name" {
  value = aws_secretsmanager_secret.jwt_secret.name
}

output "twilio_account_sid_name" {
  value = aws_secretsmanager_secret.twilio_account_sid.name
}

output "twilio_auth_token_name" {
  value = aws_secretsmanager_secret.twilio_auth_token.name
}

output "twilio_phone_number_name" {
  value = aws_secretsmanager_secret.twilio_phone_number.name
} 