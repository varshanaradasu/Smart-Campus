import { NavLink } from 'react-router-dom';
import {
    Bus,
    Calendar,
    FlaskConical,
    LayoutDashboard,
    School,
    Sparkles,
    Users,
    Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, adminOnly: true },
    { to: '/faculty-management', label: 'Faculty Management', icon: Users, adminOnly: true },
    { to: '/timetable', label: 'Timetable Viewer', icon: Calendar },
    { to: '/timetable-generator', label: 'Timetable Generator', icon: Sparkles, adminOnly: true },
    { to: '/classrooms', label: 'Classroom Allocation', icon: School },
    { to: '/labs', label: 'Lab Scheduling', icon: FlaskConical },
    { to: '/transport', label: 'Transportation', icon: Bus, adminOnly: true },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench, adminOnly: true },
];

const Sidebar = () => {
    const { user } = useAuth();

    return (
        <aside className="hidden w-80 -ml-12 shrink-0 rounded-3xl border border-white/40 bg-gradient-to-b from-slate-100 via-blue-50 to-cyan-50 p-4 shadow-glass lg:block">
            
            <div className="mb-8 rounded-2xl bg-gradient-to-br from-brand-500 via-slateBlue to-brand-700 p-5 text-white">
                <h1 className="text-xl font-bold">Smart Campus Operations</h1>
                <p className="mt-2 text-xs text-white/90">AI-powered scheduling and operations</p>
            </div>

            <nav className="space-y-2">
                {menuItems
                    .filter((item) => !item.adminOnly || user?.role === 'admin')
                    .map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `group relative flex items-center gap-3 rounded-xl border-l-2 px-3 py-2 text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'border-l-brand-600 bg-white text-brand-700 shadow-sm'
                                    : 'border-l-transparent text-slate-700 hover:border-l-brand-500 hover:bg-white/80 hover:text-brand-700'
                                }`
                            }
                        >
                            <Icon size={16} className="shrink-0" />
                            {label}
                        </NavLink>
                    ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
