# Secrets Manager Module

This module provisions AWS Secrets Manager secrets for your application:
- Database password
- JWT secret

## Inputs
- `project`: Project name for tagging and naming
- `environment`: Deployment environment (dev, staging, prod)
- `db_password`: Database password to store in Secrets Manager (sensitive)
- `jwt_secret`: JWT secret to store in Secrets Manager (sensitive)

## Outputs
- `db_password_secret_arn`: ARN of the DB password secret
- `jwt_secret_arn`: ARN of the JWT secret
- `db_password_secret_name`: Name of the DB password secret
- `jwt_secret_name`: Name of the JWT secret 