import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { TableSkeleton } from '../components/Skeleton';
import { createLabSchedule, fetchLabSchedules } from '../services/operationsService';
import { useAuth } from '../context/AuthContext';

const LabSchedulingPage = () => {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [form, setForm] = useState({
        labName: '',
        department: '',
        subject: '',
        day: 'MON',
        timeSlot: '10:10-11:00',
        batch: 'CSE_3A',
        faculty: '',
    });
    const { user } = useAuth();

    const load = async () => {
        setLoading(true);
        try {
            const response = await fetchLabSchedules();
            setRows(response.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        await createLabSchedule({ ...form, faculty: user.id || user._id });
        setOpenModal(false);
        await load();
    };

    const tableRows = useMemo(
        () =>
            (rows || []).map((row) => ({
                id: row.id || row._id,
                labName: row.labName,
                department: row.department,
                status: row.status,
                currentClass: row.currentClass,
                facultyName: row.facultyName,
            })),
        [rows]
    );

    return (
        <div className="space-y-4">
            <div className="glass-card flex items-center justify-between rounded-2xl p-5">
                <div>
                    <h2 className="panel-title">Lab Scheduling</h2>
                    <p className="text-sm text-slate-500">Live lab occupancy based on current timetable window.</p>
                </div>
                {user?.role === 'admin' ? (
                    <button onClick={() => setOpenModal(true)} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                        Add Lab Slot
                    </button>
                ) : null}
            </div>

            {loading ? (
                <TableSkeleton columns={5} rows={7} />
            ) : (
                <DataTable
                    columns={[
                        { key: 'labName', label: 'Lab Name' },
                        { key: 'department', label: 'Department' },
                        { key: 'status', label: 'Status' },
                        { key: 'currentClass', label: 'Current Class' },
                        { key: 'facultyName', label: 'Faculty Name' },
                    ]}
                    rows={tableRows}
                />
            )}

            <Modal open={openModal && user?.role === 'admin'} onClose={() => setOpenModal(false)} title="Create Lab Schedule">
                <form className="space-y-3" onSubmit={submit}>
                    <input className="w-full rounded-xl border px-3 py-2" placeholder="Lab name" value={form.labName} onChange={(e) => setForm((prev) => ({ ...prev, labName: e.target.value }))} required />
                    <input className="w-full rounded-xl border px-3 py-2" placeholder="Department" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} required />
                    <input className="w-full rounded-xl border px-3 py-2" placeholder="Subject" value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} required />
                    <input className="w-full rounded-xl border px-3 py-2" placeholder="Section" value={form.batch} onChange={(e) => setForm((prev) => ({ ...prev, batch: e.target.value }))} required />
                    <div className="grid grid-cols-2 gap-3">
                        <input className="rounded-xl border px-3 py-2" placeholder="Day" value={form.day} onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value }))} required />
                        <input className="rounded-xl border px-3 py-2" placeholder="Time Slot" value={form.timeSlot} onChange={(e) => setForm((prev) => ({ ...prev, timeSlot: e.target.value }))} required />
                    </div>
                    <button className="w-full rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white" type="submit">
                        Save
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default LabSchedulingPage;
