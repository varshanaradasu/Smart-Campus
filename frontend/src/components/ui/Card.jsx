const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const variantClasses = {
    default: 'glass-card',
    glass: 'glass-card border border-white/30 shadow-md',
    subtle: 'border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/70 shadow-sm',
};

const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
};

const Card = ({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    as: Component = 'div',
    ...props
}) => {
    return (
        <Component
            className={joinClasses(
                'rounded-2xl transition-all duration-200 hover:shadow-lg',
                variantClasses[variant] || variantClasses.default,
                paddingClasses[padding] || paddingClasses.md,
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
};

export default Card;
