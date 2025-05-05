# IAM Module

This module provisions IAM roles for ECS Fargate tasks:
- ECS Task Execution Role (for pulling images, logging, etc.)
- ECS Task Role (for app access to AWS resources, e.g., Secrets Manager)

## Inputs
- `project`: Project name for tagging and naming
- `environment`: Deployment environment (dev, staging, prod)

## Outputs
- `ecs_execution_role_arn`: ARN of the ECS task execution role
- `ecs_task_role_arn`: ARN of the ECS task role 