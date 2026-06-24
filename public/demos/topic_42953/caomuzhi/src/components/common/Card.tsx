import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

const Card = ({
  children,
  className = '',
  hoverable = false,
  onClick
}: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-card shadow-card overflow-hidden ${
        hoverable ? 'card-hover cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
