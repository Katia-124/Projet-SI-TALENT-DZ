'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashboardNav } from '@/components/dashboard-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Upload, FileText, CheckCircle, Building2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Job, Profile, Candidate } from '@/types/database'

export default function ApplyPage() {
  const [job, setJob] = useState<Job | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const jobId = params.jobId as string

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileData?.role !== 'candidate') {
        router.push('/recruiter/dashboard')
        return
      }

      setProfile(profileData)

      // Get candidate
      const { data: candidateData } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setCandidate(candidateData)

      // Get job
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (!jobData) {
        router.push('/jobs')
        return
      }

      setJob(jobData)

      // Check if already applied
      if (candidateData) {
        const { data: existingApp } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', jobId)
          .eq('candidate_id', candidateData.id)
          .single()

        if (existingApp) {
          setAlreadyApplied(true)
        }
      }

      setLoading(false)
    }

    loadData()
  }, [jobId, router])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Format invalide', {
          description: 'Veuillez sélectionner un fichier PDF',
        })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Fichier trop volumineux', {
          description: 'La taille maximale est de 5 Mo',
        })
        return
      }
      setCvFile(file)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!candidate || !job) return

    setSubmitting(true)
    const supabase = createClient()

    try {
      let cvUrl = candidate.resume_url

      // Upload CV if provided
      if (cvFile) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Non authentifié')

        const fileName = `${user.id}/${Date.now()}-${cvFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, cvFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName)

        cvUrl = publicUrl

        // Update candidate's resume_url
        await supabase
          .from('candidates')
          .update({ resume_url: cvUrl })
          .eq('id', candidate.id)
      }

      // Create application
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          candidate_id: candidate.id,
          cover_letter: coverLetter || null,
          cv_pdf_url: cvUrl,
          status: 'pending',
        })

      if (error) throw error

      toast.success('Candidature envoyée', {
        description: 'Votre candidature a été soumise avec succès',
      })

      router.push('/dashboard')
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Une erreur s\'est produite',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (alreadyApplied) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav userRole="candidate" userName={profile?.full_name} />
        <main className="container mx-auto px-4 py-8">
          <Card className="mx-auto max-w-md">
            <CardContent className="flex flex-col items-center py-12">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <h2 className="mt-4 text-xl font-bold text-foreground">
                Déjà postulé
              </h2>
              <p className="mt-2 text-center text-muted-foreground">
                Vous avez déjà soumis votre candidature pour cette offre
              </p>
              <Button asChild className="mt-6">
                <Link href="/dashboard">Voir mes candidatures</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userRole="candidate" userName={profile?.full_name} />
      
      <main className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/jobs/${jobId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l&apos;offre
          </Link>
        </Button>

        <div className="mx-auto max-w-2xl">
          {/* Job Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{job?.title}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job?.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job?.location}
                </span>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle>Soumettre votre candidature</CardTitle>
              <CardDescription>
                Complétez le formulaire ci-dessous pour postuler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* CV Upload */}
                <div className="space-y-2">
                  <Label>CV (PDF)</Label>
                  <div className="flex flex-col gap-4">
                    {candidate?.resume_url && !cvFile && (
                      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          CV existant disponible
                        </span>
                        <a
                          href={candidate.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-sm text-primary hover:underline"
                        >
                          Voir
                        </a>
                      </div>
                    )}
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-primary/5">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {cvFile ? cvFile.name : 'Cliquez pour télécharger un nouveau CV'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PDF uniquement, max 5 Mo
                      </p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {cvFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCvFile(null)}
                      >
                        Supprimer le fichier
                      </Button>
                    )}
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="space-y-2">
                  <Label htmlFor="coverLetter">Lettre de motivation (optionnel)</Label>
                  <Textarea
                    id="coverLetter"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Présentez-vous et expliquez pourquoi vous êtes le candidat idéal..."
                    rows={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Envoyer ma candidature
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
