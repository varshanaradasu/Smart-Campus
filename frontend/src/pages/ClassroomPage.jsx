import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { School } from 'lucide-react';
import { createClassroom, fetchClassrooms } from '../services/operationsService';
import { useAuth } from '../context/AuthContext';

const ClassroomPage = () => {
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState({ roomNumber: '', building: '', capacity: 40, type: 'classroom' });
    const { user } = useAuth();

    const load = async () => {
        setLoading(true);
        try {
            const response = await fetchClassrooms();
            setRows(response.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const submitClassroom = async (e) => {
        e.preventDefault();
        await createClassroom({
            roomNumber: form.roomNumber,
            name: form.roomNumber,
            building: form.building,
            capacity: Number(form.capacity),
            type: form.type,
        });
        setOpenModal(false);
        setForm({ roomNumber: '', building: '', capacity: 40, type: 'classroom' });
        await load();
    };

    const tableRows = useMemo(
        () =>
            (rows || []).map((row) => ({
                id: row._id,
                roomNumber: row.roomNumber,
                floor: row.floor,
                capacity: row.capacity,
                status: row.status,
                currentSection: row.currentSection,
                subject: row.subject,
                faculty: row.faculty,
            })),
        [rows]
    );

    return (
        <div className="space-y-4">
            <div className="glass-card flex flex-col justify-between gap-3 rounded-2xl p-5 md:flex-row md:items-center">
                <div>
                    <h2 className="panel-title">Classroom Allocation</h2>
                    <p className="text-sm text-slate-500">Real-time classroom occupancy mapped from timetable data.</p>
                </div>
                {user?.role === 'admin' ? (
                    <button className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setOpenModal(true)}>
                        Add Classroom
                    </button>
                ) : null}
            </div>

            {loading ? (
                <Loader text="Loading classrooms" />
            ) : !tableRows.length ? (
                <EmptyState
                    icon={School}
                    title="No classroom occupancy data"
                    description="Classroom occupancy data is not available yet. Add a classroom or refresh to pull the latest occupancy state."
                    actionLabel={user?.role === 'admin' ? 'Add Classroom' : 'Refresh Data'}
                    onAction={user?.role === 'admin' ? () => setOpenModal(true) : load}
                />
            ) : (
                <DataTable
                    columns={[
                        { key: 'roomNumber', label: 'Room Number' },
                        { key: 'floor', label: 'Floor' },
                        { key: 'capacity', label: 'Capacity' },
                        { key: 'status', label: 'Status' },
                        { key: 'currentSection', label: 'Current Section' },
                        { key: 'subject', label: 'Subject' },
                        { key: 'faculty', label: 'Faculty' },
                    ]}
                    rows={tableRows}
                />
            )}

            <Modal open={openModal} onClose={() => setOpenModal(false)} title="Add Classroom">
                <form className="space-y-3" onSubmit={submitClassroom}>
                    <input className="w-full rounded-xl border px-3 py-2" placeholder="Classroom Number" value={form.roomNumber} onChange={(e) => setForm((prev) => ({ ...prev, roomNumber: e.target.value }))} required />
                    <input className="w-full rounded-xl border px-3 py-2" placeholder="Block" value={form.building} onChange={(e) => setForm((prev) => ({ ...prev, building: e.target.value }))} required />
                    <input className="w-full rounded-xl border px-3 py-2" type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))} required />
                    <select className="w-full rounded-xl border px-3 py-2" value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}>
                        <option value="classroom">Classroom</option>
                        <option value="lab">Lab</option>
                        <option value="hall">Hall</option>
                    </select>
                    <button className="w-full rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white" type="submit">
                        Save Classroom
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default ClassroomPage;
