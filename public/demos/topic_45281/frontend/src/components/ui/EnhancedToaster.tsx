import React from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * Enhanced toast notification system.
 * Wraps sonner with custom styling and animation.
 */
export const Toaster: React.FC = () => (
  <SonnerToaster
    position="top-right"
    gap={8}
    toastOptions={{
      duration: 3500,
      style: {
        background: "var(--card)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "12px 16px",
        fontSize: "14px",
        boxShadow: "0 8px 24px -8px var(--shadow-color)",
      },
      className: "motion-feedback-success",
    }}
    closeButton
    richColors
  />
);

/**
 * Show a success toast notification
 */
export const showSuccess = (message: string) => {
  toast.success(message, {
    style: {
      border: "1px solid color-mix(in srgb, var(--success) 40%, transparent)",
      background: "color-mix(in srgb, var(--success) 8%, var(--card))",
    },
  });
};

/**
 * Show an error toast notification
 */
export const showError = (message: string) => {
  toast.error(message, {
    style: {
      border: "1px solid color-mix(in srgb, var(--destructive) 40%, transparent)",
      background: "color-mix(in srgb, var(--destructive) 8%, var(--card))",
    },
  });
};

/**
 * Show a warning toast notification
 */
export const showWarning = (message: string) => {
  toast.warning(message, {
    style: {
      border: "1px solid color-mix(in srgb, var(--warning) 40%, transparent)",
      background: "color-mix(in srgb, var(--warning) 8%, var(--card))",
    },
  });
};

/**
 * Show an info toast notification
 */
export const showInfo = (message: string) => {
  toast.info(message);
};

/**
 * Show a loading toast that can be dismissed later
 */
export const showLoading = (message: string) => {
  return toast.loading(message, {
    style: {
      border: "1px solid var(--border)",
      background: "var(--card)",
    },
  });
};

/**
 * Dismiss a toast by its ID
 */
export const dismissToast = (id: string | number) => {
  toast.dismiss(id);
};

export default Toaster;
