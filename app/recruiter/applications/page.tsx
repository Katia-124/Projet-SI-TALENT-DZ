import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, User, Briefcase, ExternalLink } from 'lucide-react'
import { ApplicationActions } from '@/components/application-actions'

interface ApplicationsPageProps {
  searchParams: Promise<{ job?: string }>
}

export default async function RecruiterApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const { job: jobFilter } = await searchParams
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'recruiter') {
    redirect('/dashboard')
  }

  // Get recruiter's jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('recruiter_id', user.id)

  const jobIds = jobs?.map(j => j.id) || []

  // Get applications
  let applicationsQuery = supabase
    .from('applications')
    .select(`
      *,
      job:jobs(*),
      candidate:candidates(*)
    `)
    .in('job_id', jobIds)
    .order('created_at', { ascending: false })

  if (jobFilter) {
    applicationsQuery = applicationsQuery.eq('job_id', jobFilter)
  }

  const { data: applications } = await applicationsQuery

  // Get job title for filter
  let filterJobTitle = ''
  if (jobFilter) {
    const { data: filterJob } = await supabase
      .from('jobs')
      .select('title')
      .eq('id', jobFilter)
      .single()
    filterJobTitle = filterJob?.title || ''
  }

  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Refusée', color: 'bg-red-100 text-red-800' },
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userRole="recruiter" userName={profile?.full_name} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {filterJobTitle ? `Candidatures pour "${filterJobTitle}"` : 'Toutes les candidatures'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Consultez et gérez les candidatures reçues pour vos offres
          </p>
        </div>

        {applications && applications.length > 0 ? (
          <div className="grid gap-6">
            {applications.map((application: any) => {
              const status = statusConfig[application.status as keyof typeof statusConfig]
              return (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-lg">
                            {application.candidate?.full_name}
                          </CardTitle>
                        </div>
                        <CardDescription className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {application.job?.title}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(application.created_at)}
                          </span>
                        </CardDescription>
                      </div>
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contact info */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Email: </span>
                      <a 
                        href={`mailto:${application.candidate?.email}`}
                        className="text-primary hover:underline"
                      >
                        {application.candidate?.email}
                      </a>
                    </div>

                    {/* Cover letter */}
                    {application.cover_letter && (
                      <div className="rounded-lg bg-muted/50 p-4">
                        <h4 className="mb-2 text-sm font-medium text-foreground">
                          Lettre de motivation
                        </h4>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {application.cover_letter}
                        </p>
                      </div>
                    )}

                    {/* CV Link */}
                    {application.cv_pdf_url && (
                      <div>
                        <a
                          href={application.cv_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                        >
                          <FileText className="h-4 w-4" />
                          Voir le CV
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    {application.status === 'pending' && (
                      <ApplicationActions applicationId={application.id} />
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-foreground">
                Aucune candidature
              </p>
              <p className="mt-1 text-muted-foreground">
                {filterJobTitle 
                  ? 'Aucune candidature reçue pour cette offre'
                  : 'Vous n\'avez pas encore reçu de candidatures'}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
