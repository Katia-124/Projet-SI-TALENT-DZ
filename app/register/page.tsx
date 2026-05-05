'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Briefcase, Loader2, Users, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { UserRole } from '@/types/database'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('candidate')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'recruiter' || roleParam === 'candidate') {
      setRole(roleParam)
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (error) {
        toast.error('Erreur d\'inscription', {
          description: error.message,
        })
        return
      }

      if (data.user) {
        toast.success('Compte créé avec succès', {
          description: 'Vérifiez votre email pour confirmer votre compte',
        })
        router.push('/login')
      }
    } catch {
      toast.error('Erreur', {
        description: 'Une erreur inattendue s\'est produite',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </Link>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez RecrutPro et trouvez votre prochaine opportunité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Je suis</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    role === 'candidate'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Users className={`h-6 w-6 ${role === 'candidate' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${role === 'candidate' ? 'text-primary' : 'text-muted-foreground'}`}>
                    Candidat
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    role === 'recruiter'
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <Building2 className={`h-6 w-6 ${role === 'recruiter' ? 'text-accent' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${role === 'recruiter' ? 'text-accent' : 'text-muted-foreground'}`}>
                    Recruteur
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer mon compte
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
