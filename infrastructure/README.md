# AWS network and security (Terraform)

This folder defines a **baseline AWS layout** for the Blood Bank System:

- **VPC** with two **public** subnets (app / load balancer) and two **private** subnets (database).
- **Security groups**: app tier allows **HTTP/HTTPS** from the internet and **SSH** only from `developer_ip_cidr`; database tier allows **MySQL (3306) only from the app security group** (when RDS is enabled).
- **S3** bucket for medical reports and fitness certificates: **encryption**, **versioning**, **block all public access**, **CORS** for your frontend origins (presigned browser uploads), and a **bucket policy** that **denies non-TLS** traffic.
- **IAM**: **least-privilege** policy for `s3:GetObject` / `s3:PutObject` / scoped `s3:ListBucket` on this bucket; **EC2 instance profile** for production (no long-lived keys on the server). Optionally attach the same policy to an existing **IAM user** for local development.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) `>= 1.3`
- AWS credentials configured (`aws configure` or environment variables) with rights to create VPC, S3, IAM, and optionally RDS.

## Quick start

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars: set developer_ip_cidr and cors_allowed_origins

terraform init
terraform plan
terraform apply
```

After apply, note the outputs:

- `s3_bucket_name` → set **`MEDICAL_REPORTS_BUCKET`** in `backend/.env`
- `aws_region` → set **`AWS_REGION`**
- `iam_instance_profile_name` → attach this profile to your **EC2** instance (recommended instead of access keys on the server)
- `security_group_app_id` → assign to the EC2 ENI when launching or modifying the instance
- `rds_endpoint` / `rds_database_url_template` → only if `enable_rds = true`; set **`DATABASE_URL`** and **`DATABASE_SSL=true`** in `backend/.env` (see **[docs/aws-rds-mysql.md](../docs/aws-rds-mysql.md)**)

## CORS and presigned URLs

The SPA uploads directly to S3 using a presigned `PUT`. The bucket **CORS** `allowed_origins` must include every origin you use (local Vite URL and production site). After changing origins, run `terraform apply` again.

## Optional RDS

Set `enable_rds = true` and provide a password **without storing it in git**:

```bash
export TF_VAR_db_password='your-secure-password'
terraform apply
```

RDS is created **private** (no public IP) and only the **app** security group can reach port **3306**. After apply, run **`backend/schema.sql`** (and any **`backend/migrations/`** scripts) against the new database, then point the API at it using **`DATABASE_URL`** and **`DATABASE_SSL=true`** as described in **[docs/aws-rds-mysql.md](../docs/aws-rds-mysql.md)**.

## Detach quarantine / compromised-key policies

If AWS attached **`AWSCompromisedKeyQuarantineV3`** to your IAM user, fix keys in the IAM console first; Terraform cannot override explicit **Deny** from that policy.

## State file

By default Terraform keeps **`terraform.tfstate`** locally. For teams, configure a **remote backend** (e.g. S3 + DynamoDB locking) in `versions.tf`.
