import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, RefreshCw, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface MessageActionsProps {
  content: string;
  onRegenerate?: () => void;
  className?: string;
  disabled?: boolean;
}

export function MessageActions({
  content,
  onRegenerate,
  className,
  disabled = false,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {/* Copy Button */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            disabled={disabled}
          >
            {copied ? (
              <Check className="size-3.5 text-green-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {copied ? "Copied!" : "Copy message"}
        </TooltipContent>
      </Tooltip>

      {/* More Actions */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                disabled={disabled}
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>More actions</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="size-4" />
            Copy message
          </DropdownMenuItem>

          {onRegenerate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRegenerate}>
                <RefreshCw className="size-4" />
                Regenerate
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
