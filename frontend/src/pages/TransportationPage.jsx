import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { ChartSkeleton, TableSkeleton } from '../components/Skeleton';
import { fetchTransportRoutes } from '../services/operationsService';

const formatStatus = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    return raw === 'maintenance' ? 'Maintenance' : 'Active';
};

const TransportationPage = () => {
    const [loading, setLoading] = useState(true);
    const [routes, setRoutes] = useState([]);

    const load = async () => {
        setLoading(true);
        try {
            const response = await fetchTransportRoutes();
            setRoutes(response.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const tableRows = useMemo(
        () =>
            (routes || []).map((route) => ({
                ...route,
                currentUtilization: `${Number(route.currentUtilization) || 0}%`,
                status: formatStatus(route.status),
            })),
        [routes]
    );

    return (
        <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
                <h2 className="panel-title">Campus Transportation</h2>
                <p className="text-sm text-slate-500">Route-based university transport utilization and service status.</p>
            </div>

            {loading ? (
                <TableSkeleton columns={5} rows={7} />
            ) : (
                <DataTable
                    columns={[
                        { key: 'routeName', label: 'Route Name' },
                        { key: 'busNumber', label: 'Bus Number' },
                        { key: 'capacity', label: 'Capacity' },
                        { key: 'currentUtilization', label: 'Utilization (%)' },
                        { key: 'status', label: 'Status' },
                    ]}
                    rows={tableRows}
                />
            )}

            {loading ? (
                <ChartSkeleton />
            ) : (
                <ChartCard title="Transport Route Utilization" subtitle="Current bus utilization across official routes">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={routes}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                            <XAxis dataKey="routeName" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="currentUtilization" fill="#3f4f75" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            )}
        </div>
    );
};

export default TransportationPage;
