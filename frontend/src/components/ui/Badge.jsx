const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const toneClasses = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    danger: 'bg-rose-100 text-rose-700 border border-rose-200',
    info: 'bg-sky-100 text-sky-700 border border-sky-200',
    brand: 'bg-brand-100 text-brand-700 border border-brand-200',
};

const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-sm px-3 py-2',
};

const Badge = ({
    children,
    className = '',
    tone = 'neutral',
    size = 'md',
    rounded = 'full',
    ...props
}) => {
    const roundedClass = rounded === 'md' ? 'rounded-md' : 'rounded-full';

    return (
        <span
            className={joinClasses(
                'inline-flex items-center font-medium leading-none',
                roundedClass,
                toneClasses[tone] || toneClasses.neutral,
                sizeClasses[size] || sizeClasses.md,
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
