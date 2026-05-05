'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ApplicationActionsProps {
  applicationId: string
}

export function ApplicationActions({ applicationId }: ApplicationActionsProps) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const router = useRouter()

  async function updateStatus(status: 'accepted' | 'rejected') {
    setLoading(status === 'accepted' ? 'accept' : 'reject')
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId)

      if (error) throw error

      toast.success(
        status === 'accepted' ? 'Candidature acceptée' : 'Candidature refusée',
        {
          description: 'Le statut a été mis à jour',
        }
      )

      router.refresh()
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Une erreur s\'est produite',
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-3 border-t pt-4">
      <Button
        onClick={() => updateStatus('accepted')}
        disabled={loading !== null}
        className="gap-2 bg-green-600 hover:bg-green-700"
      >
        {loading === 'accept' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        Accepter
      </Button>
      <Button
        onClick={() => updateStatus('rejected')}
        disabled={loading !== null}
        variant="outline"
        className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        {loading === 'reject' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        Refuser
      </Button>
    </div>
  )
}
