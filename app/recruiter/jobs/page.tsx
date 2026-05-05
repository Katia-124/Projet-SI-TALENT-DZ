import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  PlusCircle, 
  Users,
  MoreVertical,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteJobButton } from '@/components/delete-job-button'

export default async function RecruiterJobsPage() {
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

  // Get recruiter's jobs with application count
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: false })

  // Get application counts for each job
  const jobsWithCounts = await Promise.all(
    (jobs || []).map(async (job) => {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', job.id)
      return { ...job, application_count: count || 0 }
    })
  )

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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes offres d&apos;emploi</h1>
            <p className="mt-1 text-muted-foreground">
              Gérez vos offres et consultez les candidatures reçues
            </p>
          </div>
          <Button asChild>
            <Link href="/recruiter/jobs/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer une offre
            </Link>
          </Button>
        </div>

        {jobsWithCounts.length > 0 ? (
          <div className="grid gap-6">
            {jobsWithCounts.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(job.created_at)}
                        </span>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {job.application_count} candidature{job.application_count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/recruiter/applications?job=${job.id}`}>
                          Voir les candidatures
                        </Link>
                      </Button>
                      <DeleteJobButton jobId={job.id} jobTitle={job.title} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-muted-foreground">
                    {job.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Briefcase className="h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-foreground">
                Aucune offre publiée
              </p>
              <p className="mt-1 text-muted-foreground">
                Créez votre première offre d&apos;emploi pour commencer à recevoir des candidatures
              </p>
              <Button asChild className="mt-6">
                <Link href="/recruiter/jobs/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Créer une offre
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
