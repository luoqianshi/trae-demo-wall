import { useState, useEffect, useRef } from "react";

export function useCountUp(target: number, duration: number = 1500, start: boolean = true) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!start) return;

    const startTime = performance.now();
    const startValue = countRef.current;
    const diff = target - startValue;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = Math.round(startValue + diff * easedProgress);

      setCount(current);
      countRef.current = current;

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration, start]);

  return count;
}

export default useCountUp;
