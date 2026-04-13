variable "aws_region" {
  type        = string
  description = "AWS region for all resources"
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Short name used in resource names and tags"
  default     = "blood-bank"
}

variable "environment" {
  type        = string
  description = "Environment label (e.g. dev, staging, prod)"
  default     = "dev"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.20.0.0/16"
}

variable "developer_ip_cidr" {
  type        = string
  description = "Your public IP in CIDR form for SSH (e.g. 203.0.113.10/32). Use 0.0.0.0/0 only for quick tests — not recommended."
  default     = "0.0.0.0/0"
}

variable "cors_allowed_origins" {
  type        = list(string)
  description = "Browser origins allowed to PUT/GET objects via presigned URLs (your frontend URL(s))"
  default     = ["http://localhost:5173"]
}

variable "enable_rds" {
  type        = bool
  description = "Provision MySQL RDS in private subnets (extra cost). Set false to use only VPC + S3 + IAM."
  default     = false
}

variable "db_name" {
  type        = string
  description = "MySQL database name (when enable_rds = true)"
  default     = "bloodbank"
}

variable "db_username" {
  type        = string
  description = "MySQL master username (when enable_rds = true)"
  default     = "bloodbank_admin"
}

variable "db_password" {
  type        = string
  description = "MySQL master password (when enable_rds = true). Use TF_VAR_db_password or -var-file; never commit."
  sensitive   = true
  default     = ""
}

variable "attach_s3_policy_to_iam_user" {
  type        = string
  description = "Optional: existing IAM user name to attach the app S3 policy to (e.g. bloodbank-s3-user for local dev keys)"
  default     = ""
}
