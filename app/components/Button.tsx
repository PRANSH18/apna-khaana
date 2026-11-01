import Link from 'next/link';

type Variant = 'solid' | 'outline' | 'ghost';

export function Button({
  children,
  href,
  variant = 'solid',
  type = 'button',
  onClick,
  disabled,
  full,
}: {
  children: React.ReactNode;
  href?: string;
  variant?: Variant;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition active:scale-[0.98]';
  const width = full ? 'w-full' : '';
  const variants: Record<Variant, string> = {
    solid: 'bg-chili text-white shadow-pop hover:bg-chili-dark disabled:bg-ink/20 disabled:shadow-none',
    outline: 'border-2 border-ink/15 text-ink hover:border-leaf hover:text-leaf disabled:opacity-50',
    ghost: 'text-leaf hover:bg-wash disabled:opacity-50',
  };
  const className = `${base} ${variants[variant]} ${width}`;

  if (href && !disabled) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} type={type} disabled={disabled} className={className}>
      {children}
    </button>
  );
}
