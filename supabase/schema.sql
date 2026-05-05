-- RecrutPro Database Schema
-- Plateforme de Recrutement

-- =============================================
-- TABLE: profiles (Gestion des rôles utilisateurs)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('recruiter', 'candidate')),
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- TABLE: candidates (Profils des candidats)
-- =============================================
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- TABLE: jobs (Offres d'emploi)
-- =============================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLE: applications (Candidatures)
-- =============================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  cover_letter TEXT,
  cv_pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- CANDIDATES POLICIES
CREATE POLICY "candidates_select_own" ON public.candidates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "candidates_insert_own" ON public.candidates FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'candidate')
);
CREATE POLICY "candidates_update_own" ON public.candidates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "candidates_select_for_recruiters" ON public.candidates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    WHERE a.candidate_id = candidates.id AND j.recruiter_id = auth.uid()
  )
);

-- JOBS POLICIES
CREATE POLICY "jobs_select_all" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "jobs_insert_recruiter" ON public.jobs FOR INSERT WITH CHECK (
  auth.uid() = recruiter_id AND
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'recruiter')
);
CREATE POLICY "jobs_update_own" ON public.jobs FOR UPDATE USING (auth.uid() = recruiter_id);
CREATE POLICY "jobs_delete_own" ON public.jobs FOR DELETE USING (auth.uid() = recruiter_id);

-- APPLICATIONS POLICIES
CREATE POLICY "applications_select_candidate" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.candidates WHERE id = applications.candidate_id AND user_id = auth.uid())
);
CREATE POLICY "applications_select_recruiter" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = applications.job_id AND recruiter_id = auth.uid())
);
CREATE POLICY "applications_insert_candidate" ON public.applications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.candidates WHERE id = applications.candidate_id AND user_id = auth.uid()) AND
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'candidate')
);
CREATE POLICY "applications_update_recruiter" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = applications.job_id AND recruiter_id = auth.uid())
);

-- =============================================
-- TRIGGER: Auto-create profile and candidate on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, role, full_name, email)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'candidate'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;

  IF COALESCE(NEW.raw_user_meta_data ->> 'role', 'candidate') = 'candidate' THEN
    INSERT INTO public.candidates (user_id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Candidat'),
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STORAGE: Bucket for CVs/Resumes
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "resumes_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
CREATE POLICY "resumes_insert_authenticated" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND 
  auth.role() = 'authenticated'
);
CREATE POLICY "resumes_update_own" ON storage.objects FOR UPDATE USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "resumes_delete_own" ON storage.objects FOR DELETE USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
