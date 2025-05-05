# VPC Module

This module provisions a production-grade VPC with:
- 2 public subnets (for ALB, NAT Gateway)
- 2 private subnets (for ECS, RDS)
- 1 NAT Gateway (cost-effective)
- Internet Gateway
- Outputs for VPC ID, subnet IDs, and NAT Gateway ID

## Inputs
- `project`: Project name for tagging and naming
- `environment`: Deployment environment (dev, staging, prod)
- `vpc_cidr`: CIDR block for the VPC (e.g., `10.0.0.0/16`)
- `azs`: List of availability zones (e.g., `["us-east-1a", "us-east-1b"]`)

## Outputs
- `vpc_id`: The VPC ID
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `nat_gateway_id`: The NAT Gateway ID 