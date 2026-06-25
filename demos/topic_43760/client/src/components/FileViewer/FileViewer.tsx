import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { Copy, Check, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface FileViewerProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function FileViewer({
  code,
  language = "text",
  filename,
  className,
}: FileViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayFilename = filename || `file.${language === "text" ? "txt" : language}`;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border bg-bg-primary overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-secondary">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="size-4 shrink-0 text-text-secondary" />
          <span className="text-xs text-text-primary truncate">
            {displayFilename}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="size-3.5 text-green-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copied ? "Copied!" : "Copy code"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Code Content */}
      <div className="overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "#1e1e2e",
            fontSize: "0.8125rem",
            lineHeight: "1.5",
          }}
          lineNumberStyle={{
            color: "#6c7086",
            minWidth: "2.5em",
            paddingRight: "1em",
            userSelect: "none",
          }}
          codeTagProps={{
            style: {
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Courier, monospace",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
