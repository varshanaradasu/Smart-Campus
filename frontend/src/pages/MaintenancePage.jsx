import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import AIPoweredLabel from '../components/ui/AIPoweredLabel';
import EmptyState from '../components/EmptyState';
import { BellOff } from 'lucide-react';
import {
    createMaintenanceRecord,
    fetchMaintenance,
    uploadMaintenanceCsv,
} from '../services/operationsService';
import { useAuth } from '../context/AuthContext';

const MaintenancePage = () => {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [csvFile, setCsvFile] = useState(null);
    const [form, setForm] = useState({
        facility: '',
        type: 'Electrical',
        priority: 'medium',
        status: 'open',
        sensorScore: 55,
        lastServiceDate: '',
        notes: '',
    });
    const { user } = useAuth();

    const load = async () => {
        setLoading(true);
        try {
            const response = await fetchMaintenance();
            setRecords(response.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onSubmitRecord = async (e) => {
        e.preventDefault();

        await createMaintenanceRecord({
            ...form,
            sensorScore: Number(form.sensorScore),
            lastServiceDate: form.lastServiceDate || undefined,
        });

        setForm({
            facility: '',
            type: 'Electrical',
            priority: 'medium',
            status: 'open',
            sensorScore: 55,
            lastServiceDate: '',
            notes: '',
        });
        setStatusMessage('Maintenance record added successfully');
        await load();
    };

    const onUploadCsv = async () => {
        if (!csvFile) return;
        const response = await uploadMaintenanceCsv(csvFile);
        setStatusMessage(response.message || `Uploaded ${response.count || 0} records`);
        setCsvFile(null);
        await load();
    };

    return (
        <div className="space-y-4">
            {user?.role === 'admin' ? (
                <section className="grid gap-4 lg:grid-cols-2">
                    <div className="glass-card rounded-2xl p-5">
                        <h3 className="panel-title">Add Maintenance Record</h3>
                        <form className="mt-3 grid gap-3" onSubmit={onSubmitRecord}>
                            <input className="rounded-xl border px-3 py-2" placeholder="Facility" value={form.facility} onChange={(e) => setForm((prev) => ({ ...prev, facility: e.target.value }))} required />
                            <input className="rounded-xl border px-3 py-2" placeholder="Equipment Type (Electrical, Mechanical...)" value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} required />
                            <div className="grid grid-cols-2 gap-3">
                                <select className="rounded-xl border px-3 py-2" value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                                <select className="rounded-xl border px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input className="rounded-xl border px-3 py-2" type="number" min="0" max="100" placeholder="Sensor Score" value={form.sensorScore} onChange={(e) => setForm((prev) => ({ ...prev, sensorScore: e.target.value }))} required />
                                <input className="rounded-xl border px-3 py-2" type="date" value={form.lastServiceDate} onChange={(e) => setForm((prev) => ({ ...prev, lastServiceDate: e.target.value }))} />
                            </div>
                            <textarea className="rounded-xl border px-3 py-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
                            <button className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit">
                                Save Record
                            </button>
                        </form>
                    </div>

                    <div className="glass-card rounded-2xl p-5">
                        <h3 className="panel-title">Bulk CSV Upload</h3>
                        <p className="mt-1 text-sm text-slate-500">Columns: facility,type,priority,status,sensorScore,lastServiceDate,<br></br>nextServiceDate,notes</p>
                        <div className="mt-4 flex flex-col gap-3">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                className="rounded-xl border bg-white p-2"
                            />
                            <button
                                onClick={onUploadCsv}
                                disabled={!csvFile}
                                className="rounded-xl bg-slateBlue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                Upload CSV
                            </button>
                        </div>
                    </div>
                </section>
            ) : null}

            <div className="glass-card rounded-2xl p-5">
                <AIPoweredLabel className="mb-3" />
                <h2 className="panel-title">Predictive Maintenance Monitoring</h2>
                <p className="text-sm text-slate-500">Operational health score view for critical university facilities.</p>
            </div>

            {statusMessage ? <p className="text-sm font-medium text-brand-700">{statusMessage}</p> : null}

            {loading ? (
                <Loader text="Loading maintenance records" />
            ) : !records.length ? (
                <EmptyState
                    icon={BellOff}
                    title="No maintenance alerts"
                    description="No maintenance alerts are active right now. You can refresh to check again or add a new record."
                    actionLabel="Refresh Alerts"
                    onAction={load}
                />
            ) : (
                <DataTable
                    columns={[
                        { key: 'facility', label: 'Facility' },
                        { key: 'type', label: 'Type' },
                        { key: 'priority', label: 'Priority' },
                        { key: 'status', label: 'Status' },
                        { key: 'sensorScore', label: 'Sensor Score' },
                    ]}
                    rows={records}
                />
            )}
        </div>
    );
};

export default MaintenancePage;
