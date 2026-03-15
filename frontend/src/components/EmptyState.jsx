const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = '',
}) => {
    return (
        <section
            className={`glass-card flex flex-col items-center rounded-2xl border border-slate-200/80 px-6 py-10 text-center shadow-md ${className}`}
        >
            {Icon ? (
                <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500">
                    <Icon size={36} strokeWidth={1.8} />
                </div>
            ) : null}

            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            {description ? <p className="mt-2 max-w-xl text-sm text-slate-500">{description}</p> : null}

            {actionLabel && onAction ? (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg"
                >
                    {actionLabel}
                </button>
            ) : null}
        </section>
    );
};

export default EmptyState;