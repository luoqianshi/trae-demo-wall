import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Copy,
  Check,
  Download,
  FileCode,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Artifact } from "@/types";

interface ArtifactPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifacts: Artifact[];
  className?: string;
}

function getArtifactIcon(type: Artifact["type"]) {
  switch (type) {
    case "code":
      return <FileCode className="size-4" />;
    case "image":
      return <ImageIcon className="size-4" />;
    case "file":
      return <FileText className="size-4" />;
    case "markdown":
      return <FileText className="size-4" />;
    default:
      return <FileText className="size-4" />;
  }
}

function getArtifactBadgeColor(type: Artifact["type"]) {
  switch (type) {
    case "code":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "image":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "file":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case "markdown":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    default:
      return "";
  }
}

export function ArtifactPanel({
  open,
  onOpenChange,
  artifacts,
  className,
}: ArtifactPanelProps) {
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId) || null;

  const handleCopy = async () => {
    if (!activeArtifact) return;
    try {
      await navigator.clipboard.writeText(activeArtifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = activeArtifact.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!activeArtifact) return;
    const blob = new Blob([activeArtifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeArtifact.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn("w-[600px] max-w-[90vw] sm:max-w-[600px] p-0", className)}
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-sm font-medium">
            Artifacts ({artifacts.length})
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Artifact List Sidebar */}
          <div className="w-48 shrink-0 border-r border-border overflow-y-auto">
            <div className="p-2 space-y-1">
              {artifacts.length === 0 && (
                <p className="text-xs text-text-secondary px-2 py-4 text-center">
                  No artifacts yet
                </p>
              )}
              {artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => setActiveArtifactId(artifact.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors",
                    activeArtifactId === artifact.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted text-text-secondary hover:text-text-primary"
                  )}
                >
                  {getArtifactIcon(artifact.type)}
                  <span className="truncate">{artifact.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Artifact Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeArtifact ? (
              <>
                {/* Content Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary">
                  <div className="flex items-center gap-2 min-w-0">
                    {getArtifactIcon(activeArtifact.type)}
                    <span className="text-sm text-text-primary truncate">
                      {activeArtifact.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0", getArtifactBadgeColor(activeArtifact.type))}
                    >
                      {activeArtifact.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={handleCopy}
                        >
                          {copied ? (
                            <Check className="size-3.5 text-green-400" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {copied ? "Copied!" : "Copy content"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={handleDownload}
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Content Body */}
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {activeArtifact.type === "image" ? (
                      <div className="flex items-center justify-center">
                        <img
                          src={activeArtifact.content}
                          alt={activeArtifact.name}
                          className="max-w-full rounded-md"
                        />
                      </div>
                    ) : (
                      <pre className="text-sm text-text-primary whitespace-pre-wrap break-words font-mono leading-relaxed bg-bg-primary rounded-md p-3">
                        <code>{activeArtifact.content}</code>
                      </pre>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-secondary">
                <p className="text-sm">Select an artifact to view</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
