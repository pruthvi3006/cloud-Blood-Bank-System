output "vpc_id" {
  description = "VPC ID — use when placing EC2 or other resources"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnets — typical placement for EC2 + load balancer"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnets — used for RDS"
  value       = aws_subnet.private[*].id
}

output "security_group_app_id" {
  description = "Attach this security group to the EC2 instance running Node/Nginx"
  value       = aws_security_group.app.id
}

output "s3_bucket_name" {
  description = "Set MEDICAL_REPORTS_BUCKET in backend .env to this value"
  value       = aws_s3_bucket.medical.bucket
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.medical.arn
}

output "iam_instance_profile_name" {
  description = "Attach to EC2 so the API can call S3 without static access keys"
  value       = aws_iam_instance_profile.ec2_app.name
}

output "iam_policy_app_s3_arn" {
  description = "Policy ARN (also attached to optional IAM user if configured)"
  value       = aws_iam_policy.app_s3.arn
}

output "aws_region" {
  value = var.aws_region
}

output "rds_endpoint" {
  description = "MySQL endpoint when enable_rds = true and password provided"
  value       = try(aws_db_instance.mysql[0].endpoint, null)
}

output "rds_port" {
  value = try(aws_db_instance.mysql[0].port, null)
}

output "rds_database_url_template" {
  description = "Template for backend .env DATABASE_URL — replace YOUR_PASSWORD (URL-encode if it contains @ : / etc.)"
  value = try(
    "mysql://${var.db_username}:YOUR_PASSWORD@${aws_db_instance.mysql[0].address}/${var.db_name}",
    null
  )
}
