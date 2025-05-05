resource "aws_inspector2_enabler" "this" {
  account_ids    = [data.aws_caller_identity.current.account_id]
  for_each       = toset(var.resource_types)
  resource_types = [each.key]
}

data "aws_caller_identity" "current" {}

output "resource_types_enabled" {
  value = flatten([for e in aws_inspector2_enabler.this : e.resource_types])
} 