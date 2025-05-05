resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}-cluster"
}

resource "aws_security_group" "ecs" {
  name        = "${var.project}-${var.environment}-ecs-sg"
  description = "Allow inbound traffic from ALB on 4000"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [var.alb_sg_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_task_definition" "main" {
  family                   = "${var.project}-${var.environment}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn
  runtime_platform {
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }
  container_definitions    = jsonencode([
    {
      name      = "backend"
      image     = var.container_image
      portMappings = [{ containerPort = var.container_port }]
      essential = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.aws_region != null ? var.aws_region : "us-east-1"
          awslogs-stream-prefix = "ecs"
        }
      }
      environment = [for k, v in var.env_vars : { name = k, value = v }]
    }
  ])
}

resource "aws_ecs_service" "main" {
  name            = "${var.project}-${var.environment}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  launch_type     = "FARGATE"
  desired_count   = 2
  network_configuration {
    subnets         = var.subnet_ids
    security_groups = [aws_security_group.ecs.id]
    assign_public_ip = false
  }
  dynamic "load_balancer" {
    for_each = var.target_group_arn != null ? [1] : []
    content {
      target_group_arn = var.target_group_arn
      container_name   = "backend"
      container_port   = var.container_port
    }
  }
  depends_on = [aws_ecs_task_definition.main]
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = var.log_group_name != null ? var.log_group_name : "${var.project}-${var.environment}-backend"
  retention_in_days = 30
}

output "cluster_id" {
  value = aws_ecs_cluster.main.id
}

output "service_id" {
  value = aws_ecs_service.main.id
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.main.arn
}

output "ecs_security_group_id" {
  value = aws_security_group.ecs.id
} 