# RDS (MySQL) Module

This module provisions a production-grade RDS MySQL instance for your backend, with security and cost controls.

## Features
- MySQL 8.0, db.t3.micro (cost-effective)
- Encrypted storage
- Private subnets only (no public access)
- Security group allows only ECS tasks
- Automated backups (7 days)

## Inputs
- `project`: Project name for tagging and naming
- `environment`: Deployment environment (dev, staging, prod)
- `db_name`: Database name
- `db_username`: Master username
- `db_password`: Master password (sensitive)
- `subnet_ids`: List of private subnet IDs for RDS
- `vpc_id`: VPC ID for security group
- `ecs_security_group_id`: Security group ID for ECS tasks (to allow DB access)

## Outputs
- `db_instance_endpoint`: RDS endpoint
- `db_instance_id`: RDS instance ID
- `rds_security_group_id`: Security group ID for RDS 