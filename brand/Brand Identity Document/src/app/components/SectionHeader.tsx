export function SectionHeader({
  code,
  title,
  subtitle,
}: {
  code: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-16">
      <div className="font-mono text-[10px] tracking-[0.4em] text-slate mb-3">
        §{code}
      </div>
      <h1 className="font-mono tracking-tight text-ink mb-2" style={{ fontSize: '2rem', lineHeight: 1.1 }}>
        {title}
      </h1>
      {subtitle && (
        <p className="font-mono text-[13px] text-slate tracking-wide max-w-xl mt-4">
          {subtitle}
        </p>
      )}
      <div className="mt-6 h-px bg-ink w-full" />
    </div>
  );
}

export function SubSection({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-12 ${className}`}>
      <div className="font-mono text-[10px] tracking-[0.3em] text-slate uppercase mb-4">
        {label}
      </div>
      {children}
    </div>
  );
}
