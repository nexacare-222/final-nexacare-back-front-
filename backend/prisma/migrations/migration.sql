-- ====================================================================================
-- NexaCare Row Level Security (RLS) Migration
-- ====================================================================================
-- NOTE: 
-- Dedicated Database User for Migrations: 
-- Since RLS policies can block standard schema alterations if not careful, ensure 
-- that this migration execution script runs as the owner/superuser account 
-- (e.g., postgres in Supabase) which naturally bypasses RLS rules during deployment.
-- ====================================================================================

-- 1. Enable RLS on target tables
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VitalsReading" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LabReport" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------------
-- Policies for Patient
-- ------------------------------------------------------------------------------------

-- ADMIN and STAFF: full access
CREATE POLICY "Patient_admin_staff_all" ON "Patient"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) IN ('ADMIN', 'STAFF')
  );

-- DOCTOR and NURSE: read-only to all records
CREATE POLICY "Patient_doctor_nurse_select" ON "Patient"
  FOR SELECT
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) IN ('DOCTOR', 'NURSE')
  );

-- DOCTOR: update/delete restricted to their assigned patients only
CREATE POLICY "Patient_doctor_update_delete" ON "Patient"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) = 'DOCTOR' AND
    "assignedDoctorId" = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'DOCTOR' AND
    "assignedDoctorId" = current_setting('app.current_user_id', true)
  );

-- NURSE: update/delete restricted to their assigned patients only
CREATE POLICY "Patient_nurse_update_delete" ON "Patient"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) = 'NURSE' AND
    EXISTS (
      SELECT 1 FROM "PatientNurse"
      WHERE "PatientNurse"."patientId" = "Patient"."id"
      AND "PatientNurse"."nurseId" = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'NURSE' AND
    EXISTS (
      SELECT 1 FROM "PatientNurse"
      WHERE "PatientNurse"."patientId" = "Patient"."id"
      AND "PatientNurse"."nurseId" = current_setting('app.current_user_id', true)
    )
  );

-- PATIENT_PARTY: read restricted to their explicitly linked patient data
CREATE POLICY "Patient_patient_party_select" ON "Patient"
  FOR SELECT
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) = 'PATIENT_PARTY' AND
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User"."id" = current_setting('app.current_user_id', true)
      AND "User"."linkedPatientId" = "Patient"."id"
    )
  );


-- ------------------------------------------------------------------------------------
-- Policies for VitalsReading
-- ------------------------------------------------------------------------------------

-- ADMIN and STAFF: full access
CREATE POLICY "VitalsReading_admin_staff_all" ON "VitalsReading"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) IN ('ADMIN', 'STAFF')
  );

-- DOCTOR and NURSE: read-only to all records
CREATE POLICY "VitalsReading_doctor_nurse_select" ON "VitalsReading"
  FOR SELECT
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) IN ('DOCTOR', 'NURSE')
  );

-- DOCTOR: update/delete restricted to their assigned patients only
CREATE POLICY "VitalsReading_doctor_update_delete" ON "VitalsReading"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) = 'DOCTOR' AND
    EXISTS (
      SELECT 1 FROM "Patient"
      WHERE "Patient"."id" = "VitalsReading"."patientId"
      AND "Patient"."assignedDoctorId" = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'DOCTOR' AND
    EXISTS (
      SELECT 1 FROM "Patient"
      WHERE "Patient"."id" = "VitalsReading"."patientId"
      AND "Patient"."assignedDoctorId" = current_setting('app.current_user_id', true)
    )
  );

-- NURSE: update/delete restricted to their assigned patients only
CREATE POLICY "VitalsReading_nurse_update_delete" ON "VitalsReading"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) = 'NURSE' AND
    EXISTS (
      SELECT 1 FROM "PatientNurse"
      WHERE "PatientNurse"."patientId" = "VitalsReading"."patientId"
      AND "PatientNurse"."nurseId" = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'NURSE' AND
    EXISTS (
      SELECT 1 FROM "PatientNurse"
      WHERE "PatientNurse"."patientId" = "VitalsReading"."patientId"
      AND "PatientNurse"."nurseId" = current_setting('app.current_user_id', true)
    )
  );

-- PATIENT_PARTY: read restricted to their explicitly linked patient data
CREATE POLICY "VitalsReading_patient_party_select" ON "VitalsReading"
  FOR SELECT
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) = 'PATIENT_PARTY' AND
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User"."id" = current_setting('app.current_user_id', true)
      AND "User"."linkedPatientId" = "VitalsReading"."patientId"
    )
  );


-- ------------------------------------------------------------------------------------
-- Policies for LabReport
-- ------------------------------------------------------------------------------------

-- ADMIN and STAFF: full access
CREATE POLICY "LabReport_admin_staff_all" ON "LabReport"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) IN ('ADMIN', 'STAFF')
  );

-- DOCTOR and NURSE: read-only to all records
CREATE POLICY "LabReport_doctor_nurse_select" ON "LabReport"
  FOR SELECT
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) IN ('DOCTOR', 'NURSE')
  );

-- DOCTOR: update/delete restricted to their assigned patients only
CREATE POLICY "LabReport_doctor_update_delete" ON "LabReport"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) = 'DOCTOR' AND
    EXISTS (
      SELECT 1 FROM "Patient"
      WHERE "Patient"."id" = "LabReport"."patientId"
      AND "Patient"."assignedDoctorId" = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'DOCTOR' AND
    EXISTS (
      SELECT 1 FROM "Patient"
      WHERE "Patient"."id" = "LabReport"."patientId"
      AND "Patient"."assignedDoctorId" = current_setting('app.current_user_id', true)
    )
  );

-- NURSE: update/delete restricted to their assigned patients only
CREATE POLICY "LabReport_nurse_update_delete" ON "LabReport"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) = 'NURSE' AND
    EXISTS (
      SELECT 1 FROM "PatientNurse"
      WHERE "PatientNurse"."patientId" = "LabReport"."patientId"
      AND "PatientNurse"."nurseId" = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'NURSE' AND
    EXISTS (
      SELECT 1 FROM "PatientNurse"
      WHERE "PatientNurse"."patientId" = "LabReport"."patientId"
      AND "PatientNurse"."nurseId" = current_setting('app.current_user_id', true)
    )
  );

-- PATIENT_PARTY: read restricted to their explicitly linked patient data
CREATE POLICY "LabReport_patient_party_select" ON "LabReport"
  FOR SELECT
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) = 'PATIENT_PARTY' AND
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User"."id" = current_setting('app.current_user_id', true)
      AND "User"."linkedPatientId" = "LabReport"."patientId"
    )
  );
