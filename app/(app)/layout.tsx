import { AppSidebar } from '@/components/layouts/app-sidebar'
import { AppHeader } from '@/components/layouts/app-header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        {/* Responsive padding: smaller on mobile, larger on desktop */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
