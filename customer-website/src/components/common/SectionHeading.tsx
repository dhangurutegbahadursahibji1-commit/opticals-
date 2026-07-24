interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export default function SectionHeading({ eyebrow, title, subtitle, align = 'left' }: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-2xl mb-10 ${alignClass}`}>
      {eyebrow && (
        <span className="inline-block text-accent font-mono text-xs tracking-[0.2em] uppercase mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-primary dark:text-surface leading-tight">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-muted dark:text-surface/70 text-base md:text-lg">{subtitle}</p>}
    </div>
  );
}
