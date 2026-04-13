-- Run once against existing databases after pulling this change.
ALTER TABLE blood_requests
  ADD COLUMN medical_report_s3_key TEXT NULL,
  ADD COLUMN fitness_certificate_s3_key TEXT NULL,
  ADD COLUMN bank_message TEXT NULL;
