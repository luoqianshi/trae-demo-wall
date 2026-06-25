import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Animated number counter that counts from 0 to target.
 * Uses exponential ease-out for natural feel.
 */
export function useCountUp(target: number, duration = 1200, startOnMount = true) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const startedRef = useRef(false);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-quart: 1 - (1-t)^4
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  }, [target, duration]);

  useEffect(() => {
    if (startOnMount) start();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [startOnMount, start]);

  // Reset when target changes
  useEffect(() => {
    startedRef.current = false;
    setCount(0);
    if (startOnMount) {
      const id = setTimeout(() => start(), 100);
      return () => clearTimeout(id);
    }
  }, [target, startOnMount, start]);

  return { count, start };
}

/**
 * Hook that triggers once when element enters viewport (IntersectionObserver).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

/**
 * Hook that staggers children entrance by index and optional delay.
 * Returns a function: getDelay(index) => ms
 */
export function useStagger(staggerMs = 80, startDelay = 0) {
  return useCallback(
    (index: number) => ({
      animationDelay: `${startDelay + index * staggerMs}ms`,
    }),
    [staggerMs, startDelay]
  );
}

/**
 * Hook for ripple click effect. Returns a handler to spread on onClick.
 * Apply `ripple-container` class to the parent element.
 */
export function useRipple() {
  const handler = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;

    el.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  }, []);

  return handler;
}

/**
 * Hook for typing animation effect.
 */
export function useTypewriter(
  text: string,
  speed = 40,
  startOnMount = true
) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!startOnMount || !text) return;
    indexRef.current = 0;
    setDisplayed("");
    setDone(false);

    const interval = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current > text.length) {
        clearInterval(interval);
        setDone(true);
        return;
      }
      setDisplayed(text.slice(0, indexRef.current));
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, startOnMount]);

  return { displayed, done };
}
