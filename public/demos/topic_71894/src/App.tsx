import { Toolbar } from './components/Toolbar/Toolbar';
import { MapCanvas } from './components/MapCanvas/MapCanvas';
import { StatsPanel } from './components/StatsPanel/StatsPanel';
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { EditHint } from './components/Hints/EditHint';

export default function App() {
  return (
    <div className="w-full h-screen overflow-hidden bg-slate-950">
      <MapCanvas />
      <Toolbar />
      <StatsPanel />
      <SettingsPanel />
      <OnboardingModal />
      <EditHint />
    </div>
  );
}
