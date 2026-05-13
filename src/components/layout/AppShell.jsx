import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { ProgressStepper } from '../workflow/ProgressStepper'
import { ToastViewport } from '../ui/toast'

export function AppShell({ children }) {
  return (
    <div className="min-h-screen text-brand-ink">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header />
          <ProgressStepper />
          <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
      <ToastViewport />
    </div>
  )
}
