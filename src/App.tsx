import { AnimatePresence, motion } from 'framer-motion'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { EnrichmentPage } from './pages/EnrichmentPage'
import { LowEffortValidationPage } from './pages/LowEffortValidationPage'
import { ManualValidationPage } from './pages/ManualValidationPage'
import { UploadPage } from './pages/UploadPage'
import { useLeadStore } from './store/useLeadStore'

const screens = {
  upload: UploadPage,
  lowEffort: LowEffortValidationPage,
  manual: ManualValidationPage,
  enrichment: EnrichmentPage,
  dashboard: DashboardPage,
}

function App() {
  const currentStep = useLeadStore((state) => state.currentStep)
  const Screen = screens[currentStep]

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  )
}

export default App
