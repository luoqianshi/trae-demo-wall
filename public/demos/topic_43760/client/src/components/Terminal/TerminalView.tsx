import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Maximize2, Minimize2, Monitor, Plus, Wifi, WifiOff, X } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useAgentStore } from '@/stores/agentStore';
import { useConsoleStore } from '@/stores/consoleStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import '@xterm/xterm/css/xterm.css';

interface TerminalInstance {
  id: string;
  agent: string;
  cwd: string;
  terminal: Terminal;
  fitAddon: FitAddon;
  ws: WebSocket;
}

export interface TerminalViewHandle {
  createTerminal: (cwd?: string) => void;
}

export const TerminalView = forwardRef<TerminalViewHandle>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instancesRef = useRef<TerminalInstance[]>([]);
  const activeIndexRef = useRef(0);
  const [tabs, setTabs] = useState<{ id: string; agent: string; cwd: string }[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'offline' | 'connecting' | 'online'>('offline');
  const { agents, currentAgent, setCurrentAgent } = useAgentStore();
  const { workspaces, token } = useConsoleStore();

  const selectedWorkspace = workspaces[0]?.path ?? '';
  const selectedAgent = currentAgent ?? agents.find((a) => a.available)?.name ?? 'claude';

  // Show/hide active terminal
  useEffect(() => {
    instancesRef.current.forEach((inst, i) => {
      const el = inst.terminal.element;
      if (el) {
        el.style.display = i === activeIndex ? '' : 'none';
      }
    });
  }, [activeIndex]);

  // Fit on resize
  useEffect(() => {
    const handleResize = () => {
      const inst = instancesRef.current[activeIndex];
      if (inst) {
        try {
          inst.fitAddon.fit();
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  const createTerminal = useCallback(async (cwdOverride?: string) => {
    if (!containerRef.current || !selectedAgent) return;

    const cwd = cwdOverride || selectedWorkspace || '';
    const sessionId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'SF Mono', 'Fira Code', 'Consolas', 'Cascadia Code', monospace",
      theme: {
        background: '#1e1e2e',
        foreground: '#cdd6f4',
        cursor: '#f5e0dc',
        cursorAccent: '#1e1e2e',
        selectionBackground: 'rgba(137, 180, 250, 0.3)',
        black: '#45475a',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#f5c2e7',
        cyan: '#94e2d5',
        white: '#bac2de',
        brightBlack: '#585b70',
        brightRed: '#f38ba8',
        brightGreen: '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue: '#89b4fa',
        brightMagenta: '#f5c2e7',
        brightCyan: '#94e2d5',
        brightWhite: '#a6adc8',
      },
      allowProposedApi: true,
      allowTransparency: true,
      convertEol: true,
      scrollback: 10000,
      cols: 80,
      rows: 24,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    // Hide all existing terminals
    instancesRef.current.forEach((inst) => {
      const el = inst.terminal.element;
      if (el) el.style.display = 'none';
    });

    term.open(containerRef.current);
    if (term.element) {
      term.element.style.display = '';
    }

    // Fit after DOM paint
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch {
        // ignore
      }
    });

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${sessionId}${query}`;

    setConnectionStatus('connecting');
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionStatus('online');
      // Send config
      ws.send(JSON.stringify({
        type: 'config',
        agent: selectedAgent,
        cwd: cwd,
        cols: term.cols,
        rows: term.rows,
      }));
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ready') {
            const newTab = { id: msg.sessionId, agent: msg.agent, cwd: msg.cwd };
            const newInst: TerminalInstance = { id: msg.sessionId, agent: msg.agent, cwd: msg.cwd, terminal: term, fitAddon, ws };
            instancesRef.current.push(newInst);
            const newIdx = instancesRef.current.length - 1;
            activeIndexRef.current = newIdx;
            setActiveIndex(newIdx);
            setTabs((prev) => [...prev, newTab]);
          } else if (msg.type === 'exit') {
            term.write('\r\n\x1b[90m[Process exited]\x1b[0m\r\n');
          } else if (msg.type === 'error') {
            term.write(`\r\n\x1b[31m[Error] ${msg.message}\x1b[0m\r\n`);
          }
        } catch {
          // ignore
        }
      } else if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buf) => {
          term.write(new Uint8Array(buf));
        });
      } else if (event.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(event.data));
      }
    };

    ws.onclose = () => {
      setConnectionStatus('offline');
    };

    ws.onerror = () => {
      setConnectionStatus('offline');
    };

    // Terminal input -> WebSocket
    const onData = (data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    };

    // Terminal resize -> WebSocket
    const onResize = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };

    term.onData(onData);
    term.onResize(onResize);
  }, [selectedAgent, selectedWorkspace, token]);

  useImperativeHandle(ref, () => ({
    createTerminal,
  }));

  const closeTab = useCallback((index: number) => {
    const inst = instancesRef.current[index];
    if (inst) {
      inst.ws.close();
      inst.terminal.dispose();
      instancesRef.current.splice(index, 1);
      setTabs((prev) => prev.filter((_, i) => i !== index));
      if (activeIndex >= instancesRef.current.length) {
        const newIdx = Math.max(0, instancesRef.current.length - 1);
        activeIndexRef.current = newIdx;
        setActiveIndex(newIdx);
      }
      // Show the now-active terminal
      instancesRef.current.forEach((t, i) => {
        const el = t.terminal.element;
        if (el) el.style.display = i === activeIndexRef.current ? '' : 'none';
      });
    }
  }, []);

  const switchTab = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
    instancesRef.current.forEach((t, i) => {
      const el = t.terminal.element;
      if (el) el.style.display = i === index ? '' : 'none';
    });
    // Fit the newly visible terminal
    requestAnimationFrame(() => {
      const inst = instancesRef.current[index];
      if (inst) {
        try {
          inst.fitAddon.fit();
        } catch {
          // ignore
        }
      }
    });
  }, []);

  return (
    <div className={`relative flex h-full flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0a0a]' : ''}`}>
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Terminal</span>
          <div className="ml-2 flex gap-1">
            {agents.map((agent) => (
              <Badge
                key={agent.name}
                variant={selectedAgent === agent.name ? 'default' : 'secondary'}
                className={`cursor-pointer whitespace-nowrap text-[10px] ${!agent.available ? 'opacity-50' : ''}`}
                onClick={() => agent.available && setCurrentAgent(agent.name)}
              >
                {agent.displayName}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {connectionStatus === 'online' ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 items-center border-b bg-muted/30 px-2">
        <div className="flex flex-1 items-center gap-0.5 overflow-x-auto">
          {tabs.map((tab, i) => (
            <div
              key={tab.id}
              className={`group flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-1.5 text-xs transition ${
                i === activeIndex
                  ? 'border-b-2 border-foreground bg-background text-foreground'
                  : 'cursor-pointer text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
              onClick={() => switchTab(i)}
            >
              <span className="max-w-[120px] truncate">{tab.agent}</span>
              <span className="text-[10px] text-muted-foreground">{tab.cwd.split(/[\\/]/).pop()}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(i);
                }}
                className="ml-0.5 rounded p-0.5 opacity-0 transition hover:bg-muted group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={() => createTerminal()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Terminal container */}
      <div ref={containerRef} className="min-h-0 flex-1 bg-[#1e1e2e] p-2" />

      {/* Empty state */}
      {tabs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
              <Monitor className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Interactive Terminal</p>
              <p className="mt-1 text-xs">点击 + 打开一个 Claude Code 或 Codex 终端会话</p>
            </div>
            <Button size="sm" onClick={() => createTerminal()}>
              <Plus className="h-4 w-4" />
              打开终端
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
