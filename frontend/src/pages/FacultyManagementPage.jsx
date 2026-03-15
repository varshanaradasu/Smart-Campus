import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { TableSkeleton } from '../components/Skeleton';
import { createFaculty, fetchFaculty } from '../services/operationsService';
import { useAuth } from '../context/AuthContext';

const FacultyManagementPage = () => {
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('All');
    const [submitError, setSubmitError] = useState('');
    const [form, setForm] = useState({
        name: '',
        facultyId: '',
        department: '',
        subjects: '',
        email: '',
        phone: '',
        assignedSections: '',
    });
    const { user } = useAuth();

    const load = async () => {
        setLoading(true);
        try {
            const response = await fetchFaculty();
            setRows(response.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const submitFaculty = async (e) => {
        e.preventDefault();
        setSubmitError('');
        const normalizedFacultyId = String(form.facultyId || '').trim();
        const generatedPassword = normalizedFacultyId.length >= 6 ? normalizedFacultyId : `${normalizedFacultyId}123456`.slice(0, 6);

        try {
            await createFaculty({
                name: form.name,
                registrationNumber: normalizedFacultyId,
                department: form.department,
                subjects: String(form.subjects || '')
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                email: form.email,
                phone: form.phone,
                assignedSections: String(form.assignedSections || '')
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                password: generatedPassword,
            });
            setOpenModal(false);
            setForm({
                name: '',
                facultyId: '',
                department: '',
                subjects: '',
                email: '',
                phone: '',
                assignedSections: '',
            });
            await load();
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Unable to add faculty');
        }
    };

    const departments = useMemo(() => {
        const items = new Set(['All']);
        (rows || []).forEach((row) => items.add(row.department || 'General'));
        return Array.from(items);
    }, [rows]);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();

        return (rows || [])
            .filter((row) => (department === 'All' ? true : (row.department || 'General') === department))
            .filter((row) => {
                if (!q) return true;
                return String(row.name || '').toLowerCase().includes(q);
            })
            .map((row) => ({
                ...row,
                subjects: Array.isArray(row.subjects) && row.subjects.length ? row.subjects.join(', ') : '-',
                assignedSections:
                    Array.isArray(row.assignedSections) && row.assignedSections.length
                        ? row.assignedSections.join(', ')
                        : '-',
                email: row.email || '-',
                phone: row.phone || '-',
            }));
    }, [rows, search, department]);

    return (
        <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h2 className="panel-title">Faculty Management</h2>
                        <p className="text-sm text-slate-500">Full timetable-backed faculty directory with assigned subjects and sections.</p>
                    </div>
                    {user?.role === 'admin' ? (
                        <button className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setOpenModal(true)}>
                            Add Faculty
                        </button>
                    ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <input
                        className="rounded-xl border px-3 py-2"
                        placeholder="Search by faculty name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="rounded-xl border px-3 py-2"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                    >
                        {departments.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                    <div className="rounded-xl border px-3 py-2 text-sm text-slate-600">
                        Faculties Listed: <span className="font-semibold">{filteredRows.length}</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <TableSkeleton columns={6} rows={8} />
            ) : (
                <DataTable
                    columns={[
                        { key: 'name', label: 'Name' },
                        { key: 'department', label: 'Department' },
                        { key: 'subjects', label: 'Subjects' },
                        { key: 'email', label: 'Email' },
                        { key: 'phone', label: 'Phone Number' },
                        { key: 'assignedSections', label: 'Assigned Sections' },
                    ]}
                    rows={filteredRows}
                    emptyMessage="No faculty records found for selected filters"
                />
            )}

            <Modal open={openModal && user?.role === 'admin'} onClose={() => setOpenModal(false)} title="Add Faculty">
                <form className="space-y-3" onSubmit={submitFaculty}>
                    <input
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="Faculty Name"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <input
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="Faculty ID"
                        value={form.facultyId}
                        onChange={(e) => setForm((prev) => ({ ...prev, facultyId: e.target.value }))}
                        required
                    />
                    <input
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="Department"
                        value={form.department}
                        onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                        required
                    />
                    <input
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="Subjects (comma separated)"
                        value={form.subjects}
                        onChange={(e) => setForm((prev) => ({ ...prev, subjects: e.target.value }))}
                    />
                    <input
                        className="w-full rounded-xl border px-3 py-2"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        required
                    />
                    <input
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                    <input
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="Assigned Sections (comma separated)"
                        value={form.assignedSections}
                        onChange={(e) => setForm((prev) => ({ ...prev, assignedSections: e.target.value }))}
                    />
                    {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="rounded-xl border px-4 py-2 font-semibold text-slate-700" type="button" onClick={() => setOpenModal(false)}>
                            Cancel
                        </button>
                        <button className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white" type="submit">
                            Save
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FacultyManagementPage;
