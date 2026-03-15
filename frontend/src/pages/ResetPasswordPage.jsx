import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { resetPassword } from '../services/authService';

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState(location.state?.identifier || '');
    const [resetToken, setResetToken] = useState(location.state?.resetToken || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!location.state?.identifier || !location.state?.resetToken) {
            navigate('/forgot-password', { replace: true });
            return;
        }

        setIdentifier(location.state.identifier);
        setResetToken(location.state.resetToken);
    }, [location.state, navigate]);

    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        setSubmitting(true);
        try {
            await resetPassword({ identifier, resetToken, newPassword });
            navigate('/login', {
                replace: true,
                state: { message: 'Password reset successful. Please login again.' },
            });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to reset password.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 md:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.3),transparent_38%),radial-gradient(circle_at_55%_90%,rgba(16,185,129,0.22),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:36px_36px]" />

            <div className="relative mx-auto w-full max-w-xl rounded-3xl border border-white/35 bg-white/16 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.34)] backdrop-blur-xl md:p-8">
                <h1 className="text-2xl font-bold text-white">Reset Password</h1>
                <p className="mt-2 text-sm text-slate-200">Set your new password for {identifier || 'your account'}.</p>

                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-3 pl-10 pr-4 text-slate-800 outline-none focus:border-sky-500"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-3 pl-10 pr-4 text-slate-800 outline-none focus:border-sky-500"
                            required
                        />
                    </div>

                    {error ? <p className="text-sm text-rose-200">{error}</p> : null}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(29,78,216,0.35)] transition duration-200 hover:scale-[1.02] hover:shadow-[0_18px_34px_rgba(14,116,144,0.45)] disabled:opacity-60"
                    >
                        {submitting ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-5 text-sm text-slate-200">
                    <Link to="/login" className="font-medium text-cyan-200 transition hover:text-cyan-100">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
