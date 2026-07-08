'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Hide the close button in the header. */
  hideCloseButton?: boolean;
  /** Prevent closing when clicking the backdrop. */
  disableBackdropClose?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  hideCloseButton = false,
  disableBackdropClose = false,
}: ModalProps) {
  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableBackdropClose) onClose();
    };
    window.addEventListener('keydown', handler);
    // Lock body scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, disableBackdropClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!disableBackdropClose) onClose();
            }}
          />
          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            className={cn(
              'glass-card relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden',
              className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {(title || !hideCloseButton) && (
              <div className="flex items-start justify-between gap-4 border-b border-border p-6 pb-4">
                <div className="space-y-1">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold text-text"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-text-muted">{description}</p>
                  )}
                </div>
                {!hideCloseButton && (
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text focus-ring"
                    aria-label="关闭"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 12rem)' }}>
              {children}
            </div>
            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-border p-6 pt-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
