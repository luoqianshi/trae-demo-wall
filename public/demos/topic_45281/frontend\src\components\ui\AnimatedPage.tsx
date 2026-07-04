import React, { useEffect, useRef, useState, useCallback } from "react";

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  /** Entrance animation variant */
  variant?: "fade-up" | "scale-in" | "fade-left";
  /** Enable scroll-reveal on child cards */
  scrollReveal?: boolean;
}

/**
 * Universal page animation wrapper.
 * - Entrance animation on mount
 * - Optional scroll-reveal via IntersectionObserver
 * - Auto-staggers direct children
 */
const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  className = "",
  variant = "fade-up",
  scrollReveal = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollReveal || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("anim-reveal-visible");
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const cards = containerRef.current.querySelectorAll(".anim-reveal");
    cards.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [scrollReveal, children]);

  return (
    <div ref={containerRef} className={`anim-${variant} ${className}`}>
      {children}
    </div>
  );
};

export default AnimatedPage;
