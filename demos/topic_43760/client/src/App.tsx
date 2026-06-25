import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyRound, Menu, PanelRightOpen, Settings, Smartphone, X } from 'lucide-react';
import { TerminalView, type TerminalViewHandle } from './components/Terminal/TerminalView';
import { LeftPanel } from './components/Panels/LeftPanel';
import { RightPanel } from './components/Panels/RightPanel';
import { useAgentStore } from './stores/agentStore';
import { useConsoleStore } from './stores/consoleStore';
import { useWorkspaceStore } from './stores/workspaceStore';
import { Button } from './components/ui/button';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const terminalRef = useRef<TerminalViewHandle>(null);
  const { fetchAgents } = useAgentStore();
  const { fetchWorkspaces, token } = useConsoleStore();
  const { setToken } = useWorkspaceStore();

  // Sync token between stores
  useEffect(() => {
    setToken(token);
  }, [token, setToken]);

  useEffect(() => {
    fetchAgents();
    fetchWorkspaces();
  }, [fetchAgents, fetchWorkspaces]);

  const handleCreateTerminal = useCallback((cwd?: string) => {
    terminalRef.current?.createTerminal(cwd);
  }, []);

  return (
    <div className="h-full w-full overflow-hidden bg-gradient-to-br from-[#0f0f1a] via-[#13131f] to-[#1a1a2e] text-foreground">
      <div className="flex h-full">
        {/* Left panel: Agent selection + Sessions */}
        <div className="border-r border-white/5">
          <LeftPanel onCreateTerminal={handleCreateTerminal} />
        </div>

        {/* Center: Terminal (main content) */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/5 px-3 lg:hidden">
            <Button variant="ghost" size="icon-sm">
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Smartphone className="h-3.5 w-3.5" />
              Agent Everywhere
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
                <PanelRightOpen className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Desktop toolbar */}
          <div className="hidden h-10 shrink-0 items-center justify-end border-b border-white/5 px-3 lg:flex">
            <Button variant="ghost" size="icon-sm" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
              <PanelRightOpen className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Terminal fills remaining space */}
          <div className="min-h-0 flex-1 p-1">
            <div className="h-full overflow-hidden rounded-lg border border-white/10 shadow-2xl">
              <TerminalView ref={terminalRef} />
            </div>
          </div>
        </main>

        {/* Right panel: Status/Files/Memory */}
        {rightPanelOpen && (
          <div className="border-l border-white/5">
            <RightPanel />
          </div>
        )}
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <KeyRound className="h-4 w-4" />
                Settings
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setSettingsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <label className="text-xs text-muted-foreground">AGENT_ACCESS_TOKEN</label>
            <input
              value={token}
              onChange={(e) => useConsoleStore.getState().setToken(e.target.value)}
              placeholder="Remote access token (optional)"
              className="mt-2 h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Set this token when the backend has AGENT_ACCESS_TOKEN configured for remote access.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
