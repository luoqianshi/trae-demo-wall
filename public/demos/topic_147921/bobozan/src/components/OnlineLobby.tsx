import { useState } from "react";
import { motion } from "framer-motion";
import { Wifi, Users, ArrowRight, Copy, Check } from "lucide-react";

interface OnlineLobbyProps {
  connecting: boolean;
  roomCode: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onBack: () => void;
}

export function OnlineLobby({
  connecting,
  roomCode,
  onCreateRoom,
  onJoinRoom,
  onBack,
}: OnlineLobbyProps) {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#141414]/60 p-8 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <Wifi className="h-8 w-8 text-[#00e5ff]" />
        <h2 className="font-display text-3xl font-bold text-[#f5f0e8]">联机对战</h2>
      </div>
      <p className="text-sm text-[#f5f0e8]/50">与远程玩家实时对战</p>

      {connecting ? (
        <div className="flex items-center gap-2 py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-6 w-6 rounded-full border-2 border-[#00e5ff] border-t-transparent"
          />
          <span className="text-[#f5f0e8]/70">连接中...</span>
        </div>
      ) : (
        <>
          {/* 创建房间 */}
          <div className="flex w-full flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#f5f0e8]/40">
              创建房间
            </p>
            {roomCode ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-[#00e5ff]/30 bg-[#00e5ff]/5 px-4 py-3 text-center">
                  <span className="text-xs text-[#f5f0e8]/50">房间码</span>
                  <div className="font-mono text-2xl font-bold tracking-[0.3em] text-[#00e5ff]">
                    {roomCode}
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="rounded-xl border border-[#00e5ff]/30 bg-[#00e5ff]/10 p-3 text-[#00e5ff] transition-colors hover:bg-[#00e5ff]/20"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            ) : (
              <button
                onClick={onCreateRoom}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00e5ff]/20 px-6 py-4 font-bold text-[#00e5ff] transition-all hover:bg-[#00e5ff]/30"
              >
                <Users className="h-5 w-5" />
                创建房间
              </button>
            )}
          </div>

          <div className="flex w-full items-center gap-2">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-xs text-[#f5f0e8]/30">或</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* 加入房间 */}
          <div className="flex w-full flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#f5f0e8]/40">
              加入房间
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="输入4位房间码"
                maxLength={4}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-lg tracking-[0.3em] text-[#f5f0e8] placeholder-[#f5f0e8]/20 outline-none transition-colors focus:border-[#00e5ff]/50"
              />
              <button
                onClick={() => joinCode.length === 4 && onJoinRoom(joinCode)}
                disabled={joinCode.length !== 4}
                className="flex items-center gap-1 rounded-xl bg-[#00e5ff]/20 px-4 py-3 font-bold text-[#00e5ff] transition-all hover:bg-[#00e5ff]/30 disabled:opacity-30"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {roomCode && (
            <div className="flex items-center gap-2 pt-2">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-[#00e5ff]"
              />
              <span className="text-sm text-[#00e5ff]/70">等待对手加入...</span>
            </div>
          )}
        </>
      )}

      <button
        onClick={onBack}
        className="mt-2 text-sm text-[#f5f0e8]/40 transition-colors hover:text-[#f5f0e8]/70"
      >
        返回
      </button>
    </motion.div>
  );
}