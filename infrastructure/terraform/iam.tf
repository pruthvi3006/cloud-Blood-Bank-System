data "aws_iam_policy_document" "app_s3" {
  statement {
    sid    = "ListBucketPrefix"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = [aws_s3_bucket.medical.arn]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["medical-reports/*", "fitness-certificates/*"]
    }
  }

  statement {
    sid    = "ObjectReadWrite"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = ["${aws_s3_bucket.medical.arn}/*"]
  }
}

resource "aws_iam_policy" "app_s3" {
  name        = "${var.project_name}-app-s3-${var.environment}"
  description = "Least privilege for Blood Bank API: presigned medical + fitness objects only"
  policy      = data.aws_iam_policy_document.app_s3.json
}

resource "aws_iam_role" "ec2_app" {
  name = "${var.project_name}-ec2-app-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_app_s3" {
  role       = aws_iam_role.ec2_app.name
  policy_arn = aws_iam_policy.app_s3.arn
}

resource "aws_iam_instance_profile" "ec2_app" {
  name = "${var.project_name}-ec2-${var.environment}"
  role = aws_iam_role.ec2_app.name
}

resource "aws_iam_user_policy_attachment" "optional_dev_user" {
  count      = var.attach_s3_policy_to_iam_user != "" ? 1 : 0
  user       = var.attach_s3_policy_to_iam_user
  policy_arn = aws_iam_policy.app_s3.arn
}
