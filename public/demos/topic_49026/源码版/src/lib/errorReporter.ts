export function reportError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  console.warn(`[${context}]`, error)
  window.dispatchEvent(new CustomEvent('app-error', { detail: { context, message } }))
}
