import { useMemo, useState } from "react";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import { cn } from "@/lib/utils";
import { Columns2, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  language?: string;
  className?: string;
}

export function DiffViewer({
  oldCode,
  newCode,
  language = "text",
  className,
}: DiffViewerProps) {
  const [viewType, setViewType] = useState<"unified" | "split">("unified");

  const diffText = useMemo(() => {
    const oldLines = oldCode.split("\n");
    const newLines = newCode.split("\n");

    const hunks: string[] = [];
    hunks.push(`diff --git a/file.${language} b/file.${language}`);
    hunks.push(`--- a/file.${language}`);
    hunks.push(`+++ b/file.${language}`);

    // Simple diff generation using LCS-like approach
    let i = 0;
    let j = 0;

    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        hunks.push(` ${oldLines[i]}`);
        i++;
        j++;
      } else if (j < newLines.length && (i >= oldLines.length || !oldLines.slice(i).includes(newLines[j]))) {
        hunks.push(`+${newLines[j]}`);
        j++;
      } else if (i < oldLines.length) {
        hunks.push(`-${oldLines[i]}`);
        i++;
      } else {
        hunks.push(`+${newLines[j]}`);
        j++;
      }
    }

    return hunks.join("\n");
  }, [oldCode, newCode, language]);

  const files = useMemo(() => {
    try {
      return parseDiff(diffText);
    } catch {
      return [];
    }
  }, [diffText]);

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-bg-primary overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-secondary">
        <span className="text-xs text-text-secondary">
          {language.toUpperCase()} Diff
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant={viewType === "unified" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setViewType("unified")}
              >
                <Rows3 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Unified</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant={viewType === "split" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setViewType("split")}
              >
                <Columns2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Diff Content */}
      <div className="overflow-auto text-sm diff-dark-theme">
        {files.map((file, idx) => (
          <Diff
            key={idx}
            diffType={file.type}
            hunks={file.hunks}
            viewType={viewType}
          >
            {(hunks) =>
              hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
            }
          </Diff>
        ))}
      </div>

      {/* Dark theme overrides */}
      <style>{`
        .diff-dark-theme {
          --diff-background-color: #1e1e2e;
          --diff-text-color: #cdd6f4;
          --diff-selection-background-color: #45475a;
          --diff-selection-text-color: #cdd6f4;
          --diff-gutter-insert-background-color: #1e3a2f;
          --diff-gutter-insert-text-color: #a6e3a1;
          --diff-gutter-delete-background-color: #3a1e1e;
          --diff-gutter-delete-text-color: #f38ba8;
          --diff-gutter-selected-background-color: #313244;
          --diff-gutter-selected-text-color: #cdd6f4;
          --diff-code-insert-background-color: #1e3a2f;
          --diff-code-insert-text-color: #a6e3a1;
          --diff-code-delete-background-color: #3a1e1e;
          --diff-code-delete-text-color: #f38ba8;
          --diff-code-insert-edit-background-color: #2d5a3d;
          --diff-code-insert-edit-text-color: #a6e3a1;
          --diff-code-delete-edit-background-color: #5a2d2d;
          --diff-code-delete-edit-text-color: #f38ba8;
          --diff-code-selected-background-color: #313244;
          --diff-code-selected-text-color: #cdd6f4;
          --diff-omit-gutter-line-color: #f38ba8;
          --diff-word-insert-background-color: rgba(166, 227, 161, 0.3);
          --diff-word-insert-text-color: #a6e3a1;
          --diff-word-delete-background-color: rgba(243, 139, 168, 0.3);
          --diff-word-delete-text-color: #f38ba8;
          --diff-font-family: 'JetBrains Mono', 'Fira Code', Consolas, Courier, monospace;
        }
        .diff-dark-theme .diff-gutter {
          color: #6c7086;
        }
        .diff-dark-theme .diff-line {
          font-family: var(--diff-font-family);
        }
      `}</style>
    </div>
  );
}
