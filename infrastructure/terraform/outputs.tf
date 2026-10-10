output "instance_public_ip" {
  description = "Public IP address of the Blood Bank EC2 server"
  value       = aws_instance.bloodbank_server.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the Blood Bank EC2 server"
  value       = aws_instance.bloodbank_server.public_dns
}