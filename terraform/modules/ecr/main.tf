resource "aws_ecr_repository" "main" {
  name = "${var.project}-${var.environment}-backend"
  image_scanning_configuration {
    scan_on_push = true
  }
  image_tag_mutability = "MUTABLE"
}

output "repository_url" {
  value = aws_ecr_repository.main.repository_url
} 