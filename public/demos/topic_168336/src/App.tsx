import { useEffect } from 'react'
import { FileMonitor } from './components/FileMonitor'
import { LanguageSelector } from './components/LanguageSelector'
import './i18n/config'

function App() {
  return (
    <div>
      <LanguageSelector />
      <FileMonitor />
    </div>
  )
}

export default App 