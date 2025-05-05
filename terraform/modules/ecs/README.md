# ECS (Fargate) Module

This module provisions a production-grade ECS Fargate cluster, service, and task definition for the backend API.

## Features
- ECS cluster
- Fargate service (2 tasks by default)
- Task definition (image, CPU, memory configurable)
- Security group (only allows ALB)
- Uses private subnets from VPC

## Inputs
- `project`: Project name for tagging and naming
- `environment`: Deployment environment (dev, staging, prod)
- `subnet_ids`: List of private subnet IDs for ECS tasks
- `vpc_id`: VPC ID for ECS and security group
- `container_image`: Docker image for the backend service
- `container_port`: Port the container listens on (default: 4000)
- `cpu`: CPU units for the task (default: 256)
- `memory`: Memory (MiB) for the task (default: 512)
- `execution_role_arn`: ARN of the IAM role for ECS task execution
- `task_role_arn`: ARN of the IAM role for the ECS task

## Outputs
- `cluster_id`: ECS cluster ID
- `service_id`: ECS service ID
- `task_definition_arn`: Task definition ARN
- `ecs_security_group_id`: Security group ID for ECS tasks 