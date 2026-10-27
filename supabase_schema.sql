-- ============================================================
--  Paw Quest · Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Main applications table
CREATE TABLE IF NOT EXISTS applications (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now(),
  full_name       text NOT NULL,
  roll_no         text NOT NULL,
  degree_sem      text,
  uni_email       text,
  whatsapp_no     text NOT NULL,
  past_volunteering text,
  volunteer_details text,
  first_team      text,
  team_role       text DEFAULT 'Member',
  second_team     text,
  why_team        text,
  q10_care_meaning text,
  q11_helped_stray text,
  q12_skills      text,
  q13_comfort     text,
  q14_miss_class  text,
  q15_leniency    text,
  q16_hours       text,
  q17_campus      text,
  q18_responsibility text,
  q25_anything_else text,
  rescuer_id      text,
  status          text DEFAULT 'submitted'
    CHECK (status IN ('submitted','shortlisted','rejected','selected'))
);

-- 2. Rescue-only sensitive details (admin-only via RLS)
CREATE TABLE IF NOT EXISTS rescue_details (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id  uuid REFERENCES applications(id) ON DELETE CASCADE,
  q19_call_hour   text,
  q20_response_time text,
  q21_transport   text,
  q22_handling    text,
  shots_status    text[],
  q23b_willing_shots text,
  q24_scenario    text
);

-- 3. Team-specific answers (stored as JSON per team)
CREATE TABLE IF NOT EXISTS team_answers (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id  uuid REFERENCES applications(id) ON DELETE CASCADE,
  team            text,
  answers         jsonb
);

-- ============================================================
--  Row-Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE applications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_answers    ENABLE ROW LEVEL SECURITY;

-- Public can INSERT applications (submit the form)
CREATE POLICY "Anyone can submit application"
  ON applications FOR INSERT
  WITH CHECK (true);

-- Public can INSERT rescue_details linked to their own app
CREATE POLICY "Anyone can submit rescue details"
  ON rescue_details FOR INSERT
  WITH CHECK (true);

-- Public can INSERT team answers
CREATE POLICY "Anyone can submit team answers"
  ON team_answers FOR INSERT
  WITH CHECK (true);

-- Public CANNOT read any submissions (no SELECT policy)
-- Only service-role key (used in your admin dashboard) can read

-- ============================================================
--  DONE. Your tables are ready.
-- ============================================================
