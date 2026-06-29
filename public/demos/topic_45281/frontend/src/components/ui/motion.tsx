import React from "react";

interface MotionPageProps {
  children: React.ReactNode;
  className?: string;
}

export const MotionPage: React.FC<MotionPageProps> = ({ children, className = "" }) => {
  return <div className={`motion-page ${className}`}>{children}</div>;
};

interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className = "",
  index = 0,
}) => {
  return (
    <div
      className={`motion-card ${className}`}
      style={{ animationDelay: `${Math.min(index * 35, 180)}ms` }}
    >
      {children}
    </div>
  );
};

interface MotionRowProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export const MotionRow: React.FC<MotionRowProps> = ({
  children,
  className = "",
  index = 0,
}) => {
  return (
    <div
      className={`motion-row ${className}`}
      style={{ animationDelay: `${Math.min(index * 24, 120)}ms` }}
    >
      {children}
    </div>
  );
};
