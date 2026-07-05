import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 900,
  suffix = "",
  prefix = "",
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    let raf: number;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const cur = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(cur);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const isInt = Number.isInteger(value);
  const shown = isInt ? Math.round(display) : display.toFixed(1);

  return (
    <span className={className}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
