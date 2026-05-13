import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { ProgressStepper } from '../workflow/ProgressStepper'
import { ToastViewport } from '../ui/toast'
import { useLeadStore } from '../../store/useLeadStore'

export function AppShell({ children }) {
  const currentStep = useLeadStore((state) => state.currentStep)
  const isNewBusinessPage = currentStep === 'newBusiness'

  return (
    <div className="min-h-screen text-brand-ink">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header />
          {!isNewBusinessPage && <ProgressStepper />}
          <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
      <ToastViewport />
    </div>
  )
}
