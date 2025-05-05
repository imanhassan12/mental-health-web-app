terraform {
  backend "s3" {}
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source      = "./modules/vpc"
  project     = var.project
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  azs         = var.azs
}

module "iam" {
  source      = "./modules/iam"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region
  kms_key_id  = module.kms.kms_key_arn
}

module "secrets" {
  source      = "./modules/secrets"
  project     = var.project
  environment = var.environment
  twilio_account_sid = var.twilio_account_sid
  twilio_auth_token  = var.twilio_auth_token
  twilio_phone_number = var.twilio_phone_number
  openai_api_key     = var.openai_api_key
  kms_key_id         = module.kms.kms_key_arn
}

module "s3" {
  source      = "./modules/s3"
  project     = var.project
  environment = var.environment
  bucket_name = "${var.project}-${var.environment}-frontend"
}

module "ecs" {
  source              = "./modules/ecs"
  project             = var.project
  environment         = var.environment
  subnet_ids          = module.vpc.private_subnet_ids
  vpc_id              = module.vpc.vpc_id
  container_image     = var.container_image
  container_port      = 4000
  cpu                 = 256
  memory              = 512
  execution_role_arn  = module.iam.ecs_execution_role_arn
  task_role_arn       = module.iam.ecs_task_role_arn
  env_vars = {
    DB_PASSWORD_SECRET_ARN      = module.secrets.db_password_secret_arn
    JWT_SECRET_ARN              = module.secrets.jwt_secret_arn
    TWILIO_ACCOUNT_SID_ARN      = module.secrets.twilio_account_sid_arn
    TWILIO_AUTH_TOKEN_ARN       = module.secrets.twilio_auth_token_arn
    TWILIO_PHONE_NUMBER_ARN     = module.secrets.twilio_phone_number_arn
    OPENAI_API_KEY_ARN          = module.secrets.openai_api_key_arn
    DB_USERNAME                 = var.db_username
    DB_NAME                     = var.db_name
    DB_HOST                     = element(split(":", module.rds.db_endpoint), 0)
    DB_DIALECT                  = "mysql"
  }
  target_group_arn = module.alb.target_group_arn
  aws_region        = var.aws_region
  alb_sg_id         = module.alb.alb_sg_id
}

module "ecr" {
  source      = "./modules/ecr"
  project     = var.project
  environment = var.environment
}

module "kms" {
  source      = "./modules/kms"
  project     = var.project
  environment = var.environment
  alias       = "${var.project}-${var.environment}-main"
}

module "rds" {
  source                = "./modules/rds"
  project               = var.project
  environment           = var.environment
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = module.secrets.db_password
  subnet_ids            = module.vpc.private_subnet_ids
  vpc_id                = module.vpc.vpc_id
  ecs_security_group_id = module.ecs.ecs_security_group_id
  kms_key_id            = module.kms.kms_key_arn
}

module "cloudfront" {
  source                = "./modules/cloudfront"
  project               = var.project
  environment           = var.environment
  s3_bucket_domain_name = "${module.s3.bucket_name}.s3.amazonaws.com"
  acm_certificate_arn   = var.cloudfront_certificate_arn
  domain_alias          = var.cloudfront_domain_alias
  web_acl_id            = module.waf.web_acl_arn
}

# --- Allow CloudFront distribution to read from the private S3 bucket ---

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "frontend_bucket_policy" {
  statement {
    sid    = "AllowCloudFrontRead"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${module.s3.bucket_arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${module.cloudfront.distribution_id}"]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = module.s3.bucket_name
  policy = data.aws_iam_policy_document.frontend_bucket_policy.json
}

module "cloudtrail" {
  source         = "./modules/cloudtrail"
  project        = var.project
  environment    = var.environment
  s3_bucket_name = "${var.project}-${var.environment}-cloudtrail-logs"
}

module "cloudwatch_logs" {
  source            = "./modules/cloudwatch_logs"
  project           = var.project
  environment       = var.environment
  retention_in_days = 30
  # additional log groups can be passed via log_group_names variable
  kms_key_id        = module.kms.kms_key_arn
}

module "alb" {
  source              = "./modules/alb"
  project             = var.project
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  certificate_arn     = var.alb_certificate_arn
  container_port      = 4000
  oidc_enabled        = true
  oidc_client_id      = module.cognito.user_pool_client_id
  oidc_user_pool_arn  = module.cognito.user_pool_arn
  oidc_domain         = module.cognito.user_pool_domain
}

module "waf" {
  source      = "./modules/waf"
  project     = var.project
  environment = var.environment
}

module "inspector" {
  source      = "./modules/inspector"
  project     = var.project
  environment = var.environment
  resource_types = ["ECR", "EC2"]
}

module "cognito" {
  source      = "./modules/cognito"
  project     = var.project
  environment = var.environment
  callback_urls = ["https://${var.cloudfront_domain_alias}/auth/callback"]
  logout_urls   = ["https://${var.cloudfront_domain_alias}/logout"]
} 