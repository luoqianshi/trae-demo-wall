import React from "react";
import { Clock, AlertTriangle } from "lucide-react";

type QueueType = "normal" | "emergency" | "vip";

interface QueueNumberProps {
  number: string | number;
  type?: QueueType;
  showIcon?: boolean;
  className?: string;
}

const queueStyles: Record<QueueType, { icon: typeof Clock; color: string; bgColor: string }> = {
  normal: {
    icon: Clock,
    color: "text-primary",
    bgColor: "bg-pink-100",
  },
  emergency: {
    icon: AlertTriangle,
    color: "text-error",
    bgColor: "bg-red-100",
  },
  vip: {
    icon: Clock,
    color: "text-tertiary",
    bgColor: "bg-amber-100",
  },
};

const QueueNumber: React.FC<QueueNumberProps> = ({
  number,
  type = "normal",
  showIcon = true,
  className = "",
}) => {
  const style = queueStyles[type];
  const IconComponent = style.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <IconComponent
          size={18}
          className={`${style.color}`}
          style={type === "emergency" ? { fontVariationSettings: "'FILL' 1" } : undefined}
        />
      )}
      <span className={`font-mono text-sm font-bold ${style.color}`}>
        #{number}
      </span>
    </div>
  );
};

export default QueueNumber;
