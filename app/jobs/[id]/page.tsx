import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Building2, Calendar, ArrowLeft, ArrowRight } from 'lucide-react'

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params
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

  // Get job details
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) {
    notFound()
  }

  // Check if already applied
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', job.id)
    .eq('candidate_id', candidate?.id)
    .single()

  const hasApplied = !!existingApplication

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
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux offres
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
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
                      Publié le {formatDate(job.created_at)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <h3 className="text-lg font-semibold">Description du poste</h3>
                  <div className="whitespace-pre-wrap text-muted-foreground">
                    {job.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Postuler à cette offre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entreprise</span>
                    <span className="font-medium text-foreground">{job.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Localisation</span>
                    <span className="font-medium text-foreground">{job.location}</span>
                  </div>
                </div>

                {hasApplied ? (
                  <div className="space-y-3">
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      Vous avez déjà postulé
                    </Badge>
                    <p className="text-center text-sm text-muted-foreground">
                      Suivez l&apos;état de votre candidature dans votre tableau de bord
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard">Voir mes candidatures</Link>
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="w-full gap-2">
                    <Link href={`/apply/${job.id}`}>
                      Postuler maintenant
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
