import { CheckCircle2, DoorClosed, DoorOpen, Wrench } from 'lucide-react';
import Badge from './ui/Badge';

const STATUS_META = {
    active: { label: 'Active', tone: 'success', Icon: CheckCircle2 },
    maintenance: { label: 'Maintenance', tone: 'warning', Icon: Wrench },
    vacant: { label: 'Vacant', tone: 'info', Icon: DoorOpen },
    occupied: { label: 'Occupied', tone: 'danger', Icon: DoorClosed },
};

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const renderCellValue = (columnKey, value) => {
    const normalized = normalizeStatus(value);
    const isStatusColumn = String(columnKey || '').toLowerCase().includes('status');
    const statusMeta = STATUS_META[normalized];

    if (isStatusColumn && statusMeta) {
        const { label, tone, Icon } = statusMeta;
        return (
            <Badge tone={tone} size="sm" className="gap-1.5 px-2.5 py-1.5">
                <Icon size={14} />
                <span>{label}</span>
            </Badge>
        );
    }

    return value ?? '-';
};

const DataTable = ({ columns, rows, emptyMessage = 'No data available' }) => {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-md backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[0.95rem] leading-relaxed">
                    <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            {columns.map((column) => (
                                <th key={column.key} className="px-4 py-3.5 font-semibold tracking-wide">
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length ? (
                            rows.map((row, rowIndex) => (
                                <tr
                                    key={row.id || rowIndex}
                                    className={`border-t border-slate-100 text-slate-700 transition-colors duration-150 ${rowIndex % 2 === 0 ? 'bg-white/80' : 'bg-slate-50/70'
                                        } hover:bg-sky-50/80`}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-4 py-3.5 font-normal">
                                            {renderCellValue(column.key, row[column.key])}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-10 text-center text-[0.95rem] text-slate-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
