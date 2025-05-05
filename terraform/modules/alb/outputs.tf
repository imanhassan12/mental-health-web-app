output "alb_sg_id" {
  description = "The security group ID of the ALB."
  value       = aws_security_group.alb.id
} 