'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Briefcase, 
  LayoutDashboard, 
  FileText, 
  LogOut, 
  Menu,
  X,
  Building2,
  Users,
  PlusCircle
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { UserRole } from '@/types/database'

interface DashboardNavProps {
  userRole: UserRole
  userName?: string | null
}

export function DashboardNav({ userRole, userName }: DashboardNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const candidateLinks = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/jobs', label: 'Offres d\'emploi', icon: Briefcase },
  ]

  const recruiterLinks = [
    { href: '/recruiter/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/recruiter/jobs', label: 'Mes offres', icon: Briefcase },
    { href: '/recruiter/jobs/create', label: 'Créer une offre', icon: PlusCircle },
    { href: '/recruiter/applications', label: 'Candidatures', icon: FileText },
  ]

  const links = userRole === 'recruiter' ? recruiterLinks : candidateLinks

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Déconnexion réussie')
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={userRole === 'recruiter' ? '/recruiter/dashboard' : '/dashboard'} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">RecrutPro</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              {userRole === 'recruiter' ? (
                <Building2 className="h-4 w-4 text-primary" />
              ) : (
                <Users className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">{userName || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground">
                {userRole === 'recruiter' ? 'Recruteur' : 'Candidat'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex">
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
            <div className="my-2 border-t" />
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                {userRole === 'recruiter' ? (
                  <Building2 className="h-4 w-4 text-primary" />
                ) : (
                  <Users className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">{userName || 'Utilisateur'}</p>
                <p className="text-xs text-muted-foreground">
                  {userRole === 'recruiter' ? 'Recruteur' : 'Candidat'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
