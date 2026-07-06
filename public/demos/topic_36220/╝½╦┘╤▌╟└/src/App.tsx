import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider, useApp } from './context/AppContext'
import ParticleBackground from './components/ParticleBackground'
import HomePage from './pages/HomePage'
import AnalysisPage from './pages/AnalysisPage'
import PreparePage from './pages/PreparePage'
import SimulatePage from './pages/SimulatePage'
import ResultPage from './pages/ResultPage'

function Router() {
  const { state } = useApp()

  const pageMap = {
    home: <HomePage />,
    analysis: <AnalysisPage />,
    prepare: <PreparePage />,
    simulate: <SimulatePage />,
    result: <ResultPage />,
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.currentPage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {pageMap[state.currentPage]}
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ParticleBackground />
      <Router />
    </AppProvider>
  )
}
