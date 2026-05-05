import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  PlusCircle,
  Users
} from 'lucide-react'

export default async function RecruiterDashboardPage() {
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
    .select('*')
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: false })

  // Get all applications for recruiter's jobs
  const jobIds = jobs?.map(j => j.id) || []
  
  let applications: any[] = []
  if (jobIds.length > 0) {
    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(*),
        candidate:candidates(*)
      `)
      .in('job_id', jobIds)
      .order('created_at', { ascending: false })
    applications = data || []
  }

  const stats = {
    totalJobs: jobs?.length || 0,
    totalApplications: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  const recentApplications = applications.slice(0, 5)

  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Refusée', color: 'bg-red-100 text-red-800' },
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userRole="recruiter" userName={profile?.full_name} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Bonjour, {profile?.full_name || 'Recruteur'}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gérez vos offres d&apos;emploi et consultez les candidatures reçues.
            </p>
          </div>
          <Button asChild>
            <Link href="/recruiter/jobs/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer une offre
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Offres publiées
              </CardTitle>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Candidatures
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalApplications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acceptées
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Refusées
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dernières candidatures</CardTitle>
                <CardDescription>Les candidatures les plus récentes</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/recruiter/applications">Voir tout</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplications.map((application) => {
                    const status = statusConfig[application.status as keyof typeof statusConfig]
                    return (
                      <div
                        key={application.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {application.candidate?.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {application.job?.title}
                          </p>
                        </div>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    Aucune candidature pour le moment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href="/recruiter/jobs/create"
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <PlusCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Créer une offre</p>
                    <p className="text-sm text-muted-foreground">
                      Publiez une nouvelle offre d&apos;emploi
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link
                href="/recruiter/jobs"
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Briefcase className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Gérer mes offres</p>
                    <p className="text-sm text-muted-foreground">
                      Voir et modifier vos offres
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link
                href="/recruiter/applications"
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Voir les candidatures</p>
                    <p className="text-sm text-muted-foreground">
                      Gérez toutes les candidatures reçues
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
