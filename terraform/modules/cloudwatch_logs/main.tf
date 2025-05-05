locals {
  default_log_groups = [
    "${var.project}-${var.environment}-frontend",
    "${var.project}-${var.environment}-backend",
    "${var.project}-${var.environment}-rds"
  ]
  all_log_groups = concat(local.default_log_groups, var.log_group_names)
}

resource "aws_cloudwatch_log_group" "this" {
  for_each          = toset(local.all_log_groups)
  name              = each.key
  retention_in_days = var.retention_in_days
  kms_key_id        = var.kms_key_id
}

output "log_group_names" {
  value = [for lg in aws_cloudwatch_log_group.this : lg.name]
} 