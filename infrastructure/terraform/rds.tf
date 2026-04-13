resource "aws_db_subnet_group" "main" {
  count      = var.enable_rds ? 1 : 0
  name       = "${var.project_name}-db-subnets-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "mysql" {
  count = var.enable_rds && var.db_password != "" ? 1 : 0

  identifier                 = "${var.project_name}-mysql-${var.environment}"
  engine                     = "mysql"
  engine_version             = "8.0"
  instance_class             = "db.t3.micro"
  allocated_storage          = 20
  max_allocated_storage      = 50
  storage_encrypted          = true
  db_name                    = var.db_name
  username                   = var.db_username
  password                   = var.db_password
  db_subnet_group_name       = aws_db_subnet_group.main[0].name
  vpc_security_group_ids     = [aws_security_group.database[0].id]
  skip_final_snapshot        = true
  publicly_accessible        = false
  backup_retention_period    = 7
  auto_minor_version_upgrade = true
  deletion_protection        = var.environment == "prod"

  lifecycle {
    prevent_destroy = false
  }
}
