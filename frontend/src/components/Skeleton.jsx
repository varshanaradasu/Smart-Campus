const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const Skeleton = ({ className = '' }) => <div className={joinClasses('skeleton-shimmer rounded-lg', className)} />;

export const TableSkeleton = ({ columns = 5, rows = 6 }) => {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-md backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            {Array.from({ length: columns }).map((_, columnIndex) => (
                                <th key={`header-${columnIndex}`} className="px-4 py-3">
                                    <Skeleton className="h-4 w-24" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr
                                key={`row-${rowIndex}`}
                                className={`border-t border-slate-100 ${rowIndex % 2 === 0 ? 'bg-white/80' : 'bg-slate-50/70'}`}
                            >
                                {Array.from({ length: columns }).map((__, cellIndex) => (
                                    <td key={`cell-${rowIndex}-${cellIndex}`} className="px-4 py-3">
                                        <Skeleton className="h-4 w-full max-w-[9rem]" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const ChartSkeleton = () => (
    <div className="glass-card rounded-2xl p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-4 h-72 rounded-xl border border-slate-100 bg-white/70 p-3">
            <Skeleton className="h-full w-full rounded-lg" />
        </div>
    </div>
);

export const TimetableGridSkeleton = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 p-3 shadow-md backdrop-blur-sm">
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
                <thead>
                    <tr>
                        {Array.from({ length: 11 }).map((_, index) => (
                            <th key={`tt-head-${index}`} className="border border-slate-200 px-2 py-2">
                                <Skeleton className="h-4 w-16" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 6 }).map((_, rowIndex) => (
                        <tr key={`tt-row-${rowIndex}`}>
                            {Array.from({ length: 11 }).map((__, columnIndex) => (
                                <td key={`tt-cell-${rowIndex}-${columnIndex}`} className="border border-slate-200 px-2 py-3">
                                    <Skeleton className="h-4 w-full" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white/80 p-4">
            <Skeleton className="h-5 w-40" />
            <div className="mt-3 space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={`tt-detail-${index}`} className="h-4 w-full" />
                ))}
            </div>
        </div>
    </div>
);

export default Skeleton;