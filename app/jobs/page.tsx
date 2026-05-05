import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase, MapPin, Building2, Calendar, ArrowRight } from 'lucide-react'

export default async function JobsPage() {
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

  if (profile?.role !== 'candidate') {
    redirect('/recruiter/dashboard')
  }

  // Get all jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  // Get candidate ID for checking existing applications
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Get candidate's applications
  const { data: applications } = await supabase
    .from('applications')
    .select('job_id')
    .eq('candidate_id', candidate?.id)

  const appliedJobIds = new Set(applications?.map(a => a.job_id) || [])

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userRole="candidate" userName={profile?.full_name} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Offres d&apos;emploi</h1>
          <p className="mt-1 text-muted-foreground">
            Découvrez les dernières opportunités et postulez en un clic
          </p>
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="grid gap-6">
            {jobs.map((job) => {
              const hasApplied = appliedJobIds.has(job.id)
              return (
                <Card key={job.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(job.created_at)}
                          </span>
                        </div>
                      </div>
                      {hasApplied ? (
                        <Badge variant="secondary" className="shrink-0">
                          Déjà postulé
                        </Badge>
                      ) : (
                        <Button asChild className="shrink-0 gap-2">
                          <Link href={`/apply/${job.id}`}>
                            Postuler
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-muted-foreground">
                      {job.description}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Voir les détails
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Briefcase className="h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-foreground">
                Aucune offre disponible
              </p>
              <p className="mt-1 text-muted-foreground">
                Revenez plus tard pour découvrir de nouvelles opportunités
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
