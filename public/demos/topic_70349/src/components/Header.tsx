export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-[color:var(--color-rule)] pb-4">
      <div className="flex items-baseline gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[color:var(--color-accent)]" />
          <h1 className="text-2xl font-bold text-[color:var(--color-ink)]">
            饲料配方计算器
          </h1>
        </div>
        <span className="text-xs text-[color:var(--color-muted)] font-mono">v0.2</span>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
        <span>默认标准：</span>
        <a
          href="https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=8356B650897CEE7EB81904C9C83892E5"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-0.5 border border-[color:var(--color-rule)] rounded text-[color:var(--color-ink)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
        >
          GB/T 39235-2020
        </a>
        <a
          href="https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=B2CC8C71DCB70AB80F3A8F719A04693D"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-0.5 border border-[color:var(--color-rule)] rounded text-[color:var(--color-ink)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
        >
          GB/T 5915-2020
        </a>
      </div>
    </header>
  );
}
