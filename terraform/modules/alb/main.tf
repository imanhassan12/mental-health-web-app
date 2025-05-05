resource "aws_lb" "main" {
  name               = "${var.project}-${var.environment}-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [var.ecs_sg_id]
}

resource "aws_lb_target_group" "ecs" {
  name        = "${var.project}-${var.environment}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id
  health_check {
    path                = "/"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200-399"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = var.alb_listener_port
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn

  dynamic "default_action" {
    for_each = var.oidc_enabled ? [1] : []
    content {
      type = "authenticate-cognito"
      authenticate_cognito {
        user_pool_arn       = var.oidc_user_pool_arn
        user_pool_client_id = var.oidc_client_id
        user_pool_domain    = var.oidc_domain
        session_timeout     = var.oidc_session_timeout
      }
      order = 1
    }
  }

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecs.arn
  }
}

output "alb_dns" { value = aws_lb.main.dns_name }
output "alb_arn" { value = aws_lb.main.arn }
output "target_group_arn" { value = aws_lb_target_group.ecs.arn } 