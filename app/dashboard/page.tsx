import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase, FileText, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

export default async function CandidateDashboardPage() {
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

  // Get candidate info
  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get applications with job details
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs(*)
    `)
    .eq('candidate_id', candidate?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Count applications by status
  const { data: allApplications } = await supabase
    .from('applications')
    .select('status')
    .eq('candidate_id', candidate?.id)

  const stats = {
    total: allApplications?.length || 0,
    pending: allApplications?.filter(a => a.status === 'pending').length || 0,
    accepted: allApplications?.filter(a => a.status === 'accepted').length || 0,
    rejected: allApplications?.filter(a => a.status === 'rejected').length || 0,
  }

  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { label: 'Refusée', color: 'bg-red-100 text-red-800', icon: XCircle },
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userRole="candidate" userName={profile?.full_name} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Bonjour, {profile?.full_name || 'Candidat'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Bienvenue sur votre tableau de bord. Suivez vos candidatures et trouvez de nouvelles opportunités.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Candidatures
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
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
            <CardHeader>
              <CardTitle>Dernières candidatures</CardTitle>
              <CardDescription>
                Vos candidatures les plus récentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications && applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application: any) => {
                    const status = statusConfig[application.status as keyof typeof statusConfig]
                    return (
                      <div
                        key={application.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {application.job?.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {application.job?.company} - {application.job?.location}
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
                  <Button asChild className="mt-4">
                    <Link href="/jobs">Voir les offres</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Accédez rapidement aux fonctionnalités principales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href="/jobs"
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Parcourir les offres</p>
                    <p className="text-sm text-muted-foreground">
                      Découvrez les dernières opportunités
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
