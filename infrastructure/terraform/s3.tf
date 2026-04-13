resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "medical" {
  bucket = "${var.project_name}-medical-${var.environment}-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_public_access_block" "medical" {
  bucket = aws_s3_bucket.medical.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "medical" {
  bucket = aws_s3_bucket.medical.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "medical" {
  bucket = aws_s3_bucket.medical.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Browser uploads/downloads use presigned URLs — S3 must allow your frontend origin.
resource "aws_s3_bucket_cors_configuration" "medical" {
  bucket = aws_s3_bucket.medical.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Deny non-TLS access to objects (defense in depth with bucket policy).
resource "aws_s3_bucket_policy" "medical_tls_only" {
  bucket = aws_s3_bucket.medical.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.medical.arn,
          "${aws_s3_bucket.medical.arn}/*",
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.medical]
}
