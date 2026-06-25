import { Heart, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="no-print relative mt-24 border-t border-paper-300/60 bg-paper-100/60">
      <div className="container py-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <span className="font-display font-semibold text-ink-600">AI 错题整理助手</span>
            <span className="text-ink-300">·</span>
            <span>让每一道错题都成为进步的台阶</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-400">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-coral" fill="currentColor" />
              免费开源
            </span>
            <span className="flex items-center gap-1">
              <Github className="h-3.5 w-3.5" />
              Demo 演示版
            </span>
            <span>© 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
