resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.project}-${var.environment}-oac"
  description                       = "OAC for S3 frontend bucket"
  origin_access_control_origin_type  = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project}-${var.environment}-frontend"
  aliases             = [var.domain_alias]
  web_acl_id          = var.web_acl_id
  default_root_object = "index.html"

  origin {
    domain_name              = var.s3_bucket_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn = var.acm_certificate_arn
    ssl_support_method  = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Add custom error responses to fallback to index.html for SPA routing
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  tags = {
    Name = "${var.project}-${var.environment}-cloudfront"
  }
}

output "distribution_domain_name" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "distribution_id" {
  value = aws_cloudfront_distribution.main.id
} 