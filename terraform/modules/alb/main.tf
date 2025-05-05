resource "aws_security_group" "alb" {
  name        = "${var.project}-${var.environment}-alb-sg"
  description = "Allow inbound HTTPS from the internet"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "main" {
  name               = "${var.project}-${var.environment}-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [aws_security_group.alb.id]
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

resource "aws_lb_listener_rule" "allow_options" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecs.arn
  }

  condition {
    http_request_method {
      values = ["OPTIONS"]
    }
  }
}

output "alb_dns" { value = aws_lb.main.dns_name }
output "alb_arn" { value = aws_lb.main.arn }
output "target_group_arn" { value = aws_lb_target_group.ecs.arn } 