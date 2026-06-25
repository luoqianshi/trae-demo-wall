import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Paperclip } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface FileUploadProps {
  onFile: (content: string, filename: string) => void;
  className?: string;
  disabled?: boolean;
}

const ACCEPTED_EXTENSIONS = [
  ".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".txt",
  ".css", ".html", ".yaml", ".yml", ".toml", ".xml", ".csv", ".sh",
];

const ACCEPT_STRING = ACCEPTED_EXTENSIONS.join(",");

export function FileUpload({
  onFile,
  className,
  disabled = false,
}: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!ACCEPTED_EXTENSIONS.includes(ext)) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileName(file.name);
        onFile(content, file.name);
      };
      reader.readAsText(file);
    },
    [onFile]
  );

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFile(files[0]);
    e.target.value = "";
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            fileName && "text-green-400",
            className
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_STRING}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
          <Paperclip className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {fileName ? fileName : "上传文件"}
      </TooltipContent>
    </Tooltip>
  );
}
