'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { SettingsLinkCard } from '@/components/ui/settings-link-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const { signOut } = useAuth()

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SettingsLinkCard
          title="Profile"
          description="Update your profile information"
          href="/settings/profile"
          buttonText="Edit Profile"
        />

        <SettingsLinkCard
          title="Preferences"
          description="Customize your learning experience"
          href="/settings/preferences"
          buttonText="Edit Preferences"
        />
      </div>

      {/* Sign Out Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
          <CardDescription>Sign out of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
