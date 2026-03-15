import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Building2, BusFront, Lock, Mail, UsersRound, Wrench, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const featureCards = [
    {
        icon: Bot,
        title: 'AI Timetable Generation',
        description: 'Automatically generate optimized academic timetables.',
    },
    {
        icon: Building2,
        title: 'Smart Classroom Allocation',
        description: 'Allocate classrooms based on availability and capacity.',
    },
    {
        icon: UsersRound,
        title: 'Faculty Workload Optimization',
        description: 'Balance teaching workload across faculty members.',
    },
    {
        icon: BusFront,
        title: 'Campus Transportation Optimization',
        description: 'Analyze bus routes and utilization.',
    },
    {
        icon: Wrench,
        title: 'Predictive Maintenance',
        description: 'Monitor campus facilities and predict failures.',
    },
    {
        icon: School,
        title: 'Laboratory & Classroom Scheduling',
        description: 'Efficiently schedule labs and classrooms for courses.',
    }
];

const LoginPage = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = location.state?.message || '';

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const response = await login(form);
            navigate(response.user.role === 'admin' ? '/admin' : '/timetable');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to login');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 md:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.3),transparent_38%),radial-gradient(circle_at_55%_90%,rgba(16,185,129,0.22),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(135deg,rgba(14,165,233,0.12),rgba(37,99,235,0.06),rgba(20,184,166,0.08),rgba(14,165,233,0.12))] [background-size:220%_220%] animate-[pulse_9s_ease-in-out_infinite]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:36px_36px]" />

            <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="relative mx-auto w-full max-w-6xl"
            >
                {/* <div className="mb-6 flex justify-center">
                    <motion.div
                        className="relative"
                        animate={{ y: [0, -6, 0] }}
                    >
                        <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/30 via-cyan-400/28 to-violet-500/30 blur-xl" />

                        <div className="relative rounded-2xl bg-white px-10 py-4 shadow-[0_10px_30px_rgba(37,99,235,0.22)] flex items-center justify-center w-[620px]">
                            <img
                                src="/vignan-logo.png"
                                alt="Vignan University logo"
                                className="h-[190px] w-auto object-contain"
                            />
                        </div>

                    </motion.div>
                </div> */}
                <div className="mb-6 flex justify-center">
                    <motion.div
                        className="relative flex justify-center"
                        animate={{ y: [0, -6, 0] }}
                    >
                        {/* Glow effect behind logo */}
                        <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-r from-blue-500/30 via-cyan-400/30 to-violet-500/30 blur-2xl" />

                        {/* Logo */}
                        <img
                            src="/vignan-logo.png"
                            alt="Vignan University logo"
                            className="relative h-[190px] w-auto object-contain"
                        />
                    </motion.div>
                </div>

                <div className="mx-auto max-w-3xl text-center text-white">
                    <h1 className="text-3xl font-bold tracking-tight text-[#FFFFFF] whitespace-nowrap [text-shadow:0_0_16px_rgba(56,189,248,0.28)] md:text-4xl lg:text-[2.6rem]">
                        Smart Scheduling and Campus Operations
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[rgba(255,255,255,0.8)] md:text-[1.06rem]">
                        AI-powered platform for intelligent campus resource optimization.
                    </p>
                </div>

                <div className="mx-auto mt-8 w-full max-w-xl rounded-3xl border border-white/35 bg-white/16 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.34)] backdrop-blur-xl transition duration-300 hover:shadow-[0_26px_62px_rgba(37,99,235,0.3)] md:p-8">
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-3 pl-10 pr-4 text-slate-800 outline-none focus:border-sky-500"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-3 pl-10 pr-4 text-slate-800 outline-none focus:border-sky-500"
                                required
                            />
                        </div>

                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm font-medium text-cyan-200 transition hover:text-cyan-100">
                                Forgot Password?
                            </Link>
                        </div>

                        {successMessage ? <p className="text-sm text-emerald-200">{successMessage}</p> : null}

                        {error ? <p className="text-sm text-red-200">{error}</p> : null}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(29,78,216,0.35)] transition duration-200 hover:scale-[1.02] hover:shadow-[0_18px_34px_rgba(14,116,144,0.45)] disabled:opacity-60"
                        >
                            {submitting ? 'Signing in...' : 'Login'}
                        </button>
                    </form>
                </div>

                <div className="mx-auto mt-8 grid w-full max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {featureCards.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className="rounded-2xl border border-white/30 bg-gradient-to-b from-white/20 via-sky-400/10 to-blue-500/12 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.22)] backdrop-blur-lg transition duration-300 ease-out hover:-translate-y-[6px] hover:border-cyan-300/70 hover:shadow-[0_18px_38px_rgba(34,211,238,0.26)]"
                            >
                                <Icon className="mb-3 h-6 w-6 text-cyan-300" />
                                <h3 className="text-base font-semibold leading-tight text-[#FFFFFF]">{feature.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.85)]">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
