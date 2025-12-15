import { SettingsLinkCard } from '@/components/ui/settings-link-card'

export default function SettingsPage() {
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
    </div>
  )
}
