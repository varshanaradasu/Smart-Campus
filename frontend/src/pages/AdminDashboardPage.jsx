import { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Bus, LayoutList, School, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { fetchDashboardStats, fetchMaintenance } from '../services/operationsService';

const CHART_COLORS = {
    faculty: ['#2563eb', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
    transport: ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'],
    maintenance: ['#ef4444', '#f59e0b', '#22c55e'],
};

const tooltipStyle = {
    borderRadius: '0.75rem',
    border: '1px solid #dbe4f0',
    background: 'rgba(255,255,255,0.96)',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
};

const labelStyle = { color: '#334155', fontWeight: 700 };
const itemStyle = { color: '#334155', fontWeight: 600 };

const toLegendLabel = (value) => {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }

    if (value && typeof value === 'object') {
        const candidate = value.value ?? value.name ?? value.dataKey;
        if (typeof candidate === 'string' || typeof candidate === 'number') {
            return String(candidate);
        }
    }

    return 'Series';
};

const legendFormatter = (value) => <span className="text-xs font-semibold text-slate-600">{toLegendLabel(value)}</span>;

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        try {
            const [statsResponse, maintenanceResponse] = await Promise.all([fetchDashboardStats(), fetchMaintenance()]);
            setStats(statsResponse.stats);
            setMaintenanceRecords(maintenanceResponse.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const maintenanceStatusData = useMemo(() => {
        const counts = {
            Open: 0,
            'In Progress': 0,
            Resolved: 0,
        };

        (maintenanceRecords || []).forEach((record) => {
            const normalized = String(record?.status || '').toLowerCase();
            if (normalized === 'open') counts.Open += 1;
            else if (normalized === 'in-progress') counts['In Progress'] += 1;
            else if (normalized === 'resolved') counts.Resolved += 1;
        });

        return Object.entries(counts).map(([status, count]) => ({ status, count }));
    }, [maintenanceRecords]);

    if (loading) return <Loader text="Loading admin analytics" />;

    const facultyWorkloadData = [
        { faculty: "Dr. S. Deva Kumar", sessions: 6 },
        { faculty: "Ms. V. Anusha", sessions: 5 },
        { faculty: "Mr. K Hareesh", sessions: 4 },
        { faculty: "Mr. Mohan Venkateswara Rao", sessions: 5 },
        { faculty: "Ms. Sajida Sultana", sessions: 3 },
        { faculty: "Mr. K. Y. Ram", sessions: 4 }
    ];
    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Faculties"
                    value={stats?.totalFaculties || 0}
                    subtitle="Teaching staff"
                    icon={Users}
                    accent="from-sky-500 via-blue-500 to-indigo-600"
                    delay={0}
                />
                <StatCard
                    title="Total Classrooms"
                    value={stats?.totalClassrooms || 0}
                    subtitle="Academic classrooms"
                    icon={School}
                    accent="from-emerald-500 via-teal-500 to-cyan-600"
                    delay={0.08}
                />
                <StatCard
                    title="Total Sections"
                    value={19}
                    subtitle="Program sections"
                    icon={LayoutList}
                    accent="from-violet-500 via-fuchsia-500 to-pink-600"
                    delay={0.16}
                />
                <StatCard
                    title="Active Buses"
                    value={10}
                    subtitle="Transport fleet in service"
                    icon={Bus}
                    accent="from-amber-500 via-orange-500 to-rose-600"
                    delay={0.24}
                />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <div className="glass-card rounded-2xl p-5">
                    <p className="text-sm text-slate-500">Occupied Classrooms</p>
                    <AnimatedNumber value={stats?.occupiedClassrooms || 40} className="mt-2 text-3xl font-bold text-slate-800" />
                </div>
                <div className="glass-card rounded-2xl p-5">
                    <p className="text-sm text-slate-500">Occupied Labs</p>
                    <AnimatedNumber value={stats?.occupiedLabs || 10} className="mt-2 text-3xl font-bold text-slate-800" />
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                >
                    <ChartCard
                        title="Faculty Workload Distribution"
                        subtitle="Total classes allocated per faculty"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={facultyWorkloadData}>

                                <defs>
                                    <linearGradient id="facultyBars" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.85} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />

                                <XAxis
                                    dataKey="faculty"
                                    tick={{ fill: "#475569", fontSize: 12 }}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    domain={[0, 8]}
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                />

                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    labelStyle={labelStyle}
                                    itemStyle={itemStyle}
                                    cursor={{ fill: "rgba(37,99,235,0.12)" }}
                                />

                                <Legend iconType="circle" formatter={legendFormatter} />

                                <Bar
                                    dataKey="sessions"
                                    name="Sessions"
                                    fill="url(#facultyBars)"
                                    radius={[8, 8, 0, 0]}
                                    isAnimationActive
                                    animationDuration={1200}
                                >
                                    {facultyWorkloadData.map((_, index) => (
                                        <Cell
                                            key={`faculty-cell-${index}`}
                                            fill={CHART_COLORS.faculty[index % CHART_COLORS.faculty.length]}
                                            fillOpacity={0.95}
                                        />
                                    ))}
                                </Bar>

                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </motion.div>

                {/* <section className="grid gap-6 lg:grid-cols-2">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
                    <ChartCard title="Faculty Workload Distribution" subtitle="Total classes allocated per faculty">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.facultyWorkloadDistribution || []}>
                                <defs>
                                    <linearGradient id="facultyBars" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.85} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                                <XAxis dataKey="faculty" tick={{ fill: '#475569', fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} cursor={{ fill: 'rgba(37,99,235,0.12)' }} />
                                <Legend iconType="circle" formatter={legendFormatter} />
                                <Bar
                                    dataKey="sessions"
                                    name="Sessions"
                                    fill="url(#facultyBars)"
                                    radius={[8, 8, 0, 0]}
                                    isAnimationActive
                                    animationDuration={1300}
                                    animationEasing="ease-out"
                                >
                                    {(stats?.facultyWorkloadDistribution || []).map((_, index) => (
                                        <Cell key={`faculty-cell-${index}`} fill={CHART_COLORS.faculty[index % CHART_COLORS.faculty.length]} fillOpacity={0.95} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </motion.div>
                </section> */}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}>
                    <ChartCard title="Maintenance Status" subtitle="Open, in-progress, and resolved maintenance tickets">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={maintenanceStatusData}>
                                <defs>
                                    <linearGradient id="maintenanceBars" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.85} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                                <XAxis dataKey="status" tick={{ fill: '#475569', fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} cursor={{ fill: 'rgba(249,115,22,0.12)' }} />
                                <Legend iconType="circle" formatter={legendFormatter} />
                                <Bar
                                    dataKey="count"
                                    name="Tickets"
                                    fill="url(#maintenanceBars)"
                                    radius={[8, 8, 0, 0]}
                                    isAnimationActive
                                    animationDuration={1250}
                                    animationEasing="ease-out"
                                >
                                    {maintenanceStatusData.map((_, index) => (
                                        <Cell key={`maintenance-cell-${index}`} fill={CHART_COLORS.maintenance[index % CHART_COLORS.maintenance.length]} fillOpacity={0.95} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </motion.div>
            </section>

            <motion.section
                className="glass-card rounded-2xl p-5"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3 }}
            >
                <ChartCard title="Transport Utilization" subtitle="Current utilization (%) across all transport routes">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.transportRouteUtilization || []}>
                            <defs>
                                <linearGradient id="transportBars" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                            <XAxis dataKey="routeName" tick={{ fill: '#475569', fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} cursor={{ fill: 'rgba(20,184,166,0.12)' }} />
                            <Legend iconType="circle" formatter={legendFormatter} />
                            <Bar
                                dataKey="utilization"
                                name="Utilization %"
                                fill="url(#transportBars)"
                                radius={[8, 8, 0, 0]}
                                isAnimationActive
                                animationDuration={1400}
                                animationEasing="ease-out"
                            >
                                {(stats?.transportRouteUtilization || []).map((_, index) => (
                                    <Cell key={`transport-cell-${index}`} fill={CHART_COLORS.transport[index % CHART_COLORS.transport.length]} fillOpacity={0.95} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </motion.section>
        </div>
    );
};

export default AdminDashboardPage;
