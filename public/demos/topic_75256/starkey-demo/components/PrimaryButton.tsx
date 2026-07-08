import React from 'react';
import styles from './PrimaryButton.module.css';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'text';
  fullWidth?: boolean;
  className?: string;
}

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  fullWidth = false,
  className = '',
}: PrimaryButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
