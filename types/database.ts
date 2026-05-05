export type UserRole = 'recruiter' | 'candidate'

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  full_name: string | null
  email: string | null
  created_at: string
}

export interface Candidate {
  id: string
  user_id: string
  full_name: string
  email: string
  resume_url: string | null
  created_at: string
}

export interface Job {
  id: string
  recruiter_id: string
  title: string
  description: string
  company: string
  location: string
  created_at: string
}

export interface Application {
  id: string
  job_id: string
  candidate_id: string
  cover_letter: string | null
  cv_pdf_url: string | null
  status: ApplicationStatus
  created_at: string
}

export interface ApplicationWithDetails extends Application {
  job?: Job
  candidate?: Candidate
}

export interface JobWithApplicationCount extends Job {
  application_count?: number
}
