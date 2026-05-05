import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Users, FileText, CheckCircle, ArrowRight, Building2, MapPin } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">RecrutPro</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Inscription</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Trouvez votre prochain{' '}
              <span className="text-primary">talent</span> ou{' '}
              <span className="text-accent">emploi</span>
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              RecrutPro connecte les meilleurs candidats avec les entreprises qui recrutent. 
              Simplifiez votre processus de recrutement ou trouvez l&apos;opportunité de carrière idéale.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/register?role=candidate">
                  Je cherche un emploi
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/register?role=recruiter">
                  Je recrute
                  <Building2 className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Une plateforme complète pour le recrutement
            </h2>
            <p className="mt-4 text-muted-foreground">
              Que vous soyez candidat ou recruteur, nous avons les outils qu&apos;il vous faut.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 border-transparent transition-colors hover:border-primary/20">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">CV en un clic</CardTitle>
                <CardDescription>
                  Téléchargez votre CV PDF et postulez instantanément aux offres qui vous intéressent.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-transparent transition-colors hover:border-primary/20">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="mt-4">Gestion des candidatures</CardTitle>
                <CardDescription>
                  Suivez l&apos;état de vos candidatures en temps réel et recevez des notifications.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-transparent transition-colors hover:border-primary/20">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">Processus simplifié</CardTitle>
                <CardDescription>
                  Interface intuitive pour gérer vos offres, candidatures et communications.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Prêt à commencer ?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Rejoignez des milliers d&apos;entreprises et de candidats qui utilisent RecrutPro.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">Créer un compte gratuit</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">RecrutPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 RecrutPro. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
