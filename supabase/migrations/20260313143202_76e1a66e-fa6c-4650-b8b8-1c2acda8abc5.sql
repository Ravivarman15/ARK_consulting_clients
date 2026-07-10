
-- Create table for storing audit submissions
CREATE TABLE public.audit_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  student_strength TEXT NOT NULL,
  monthly_revenue TEXT NOT NULL,
  avg_fee_per_student TEXT NOT NULL,
  highest_annual_fee TEXT NOT NULL,
  avg_students_per_batch TEXT NOT NULL,
  total_batches_per_day TEXT NOT NULL,
  total_teaching_area TEXT NOT NULL,
  salary_percent_of_revenue TEXT NOT NULL,
  fee_collection_method TEXT NOT NULL,
  fee_pending_percentage TEXT NOT NULL,
  monthly_enquiries TEXT NOT NULL,
  conversion_rate TEXT NOT NULL,
  student_dropout_rate TEXT NOT NULL,
  teacher_leave_impact TEXT NOT NULL,
  owner_daily_involvement TEXT NOT NULL,
  efficiency_percent NUMERIC,
  health_verdict TEXT,
  total_leakage_low NUMERIC,
  total_leakage_high NUMERIC,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form, no auth required)
CREATE POLICY "Anyone can submit audit" ON public.audit_submissions
  FOR INSERT WITH CHECK (true);

-- Only allow reading own submission by matching email (for future use)
CREATE POLICY "No public reads" ON public.audit_submissions
  FOR SELECT USING (false);
