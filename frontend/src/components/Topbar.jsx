import { FaBell, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Topbar = () => {
    const { user, logout } = useAuth();

    return (
        <header className="glass-card mb-6 flex items-center justify-between rounded-2xl px-5 py-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Campus Operations Center</h2>
                <p className="panel-subtitle">Welcome back, {user?.name}</p>
            </div>

            <div className="flex items-center gap-3">
                {/* <button className="rounded-xl border border-white/70 bg-white/90 p-3 text-slate-500 shadow-sm hover:text-brand-600">
                    <FaBell />
                </button> */}
                <div className="hidden items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm text-slate-600 md:flex">
                    <FaUserCircle size={18} />
                    {user?.role}
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-slateBlue px-4 py-2 text-sm font-semibold text-white hover:shadow-lg"
                >
                    <FaSignOutAlt />
                    Logout
                </button>
            </div>
        </header>
    );
};

export default Topbar;
