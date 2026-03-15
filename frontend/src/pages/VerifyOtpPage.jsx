import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { verifyOtp, forgotPassword } from '../services/authService';

const VerifyOtpPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [otp, setOtp] = useState('');
    const [otpSessionId, setOtpSessionId] = useState(location.state?.otpSessionId || '');
    const [identifier, setIdentifier] = useState(location.state?.identifier || '');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        if (!location.state?.identifier) {
            navigate('/forgot-password', { replace: true });
            return;
        }

        setIdentifier(location.state.identifier);
        setOtpSessionId(location.state.otpSessionId || '');
    }, [location.state, navigate]);

    const onVerify = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);

        try {
            const response = await verifyOtp({
                identifier,
                otp,
                otpSessionId,
            });

            navigate('/reset-password', {
                state: {
                    identifier,
                    resetToken: response.resetToken,
                },
            });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to verify OTP.');
        } finally {
            setSubmitting(false);
        }
    };

    const onResend = async () => {
        setError('');
        setMessage('');
        setResending(true);

        try {
            const response = await forgotPassword({ identifier });
            setOtpSessionId(response.otpSessionId || '');
            setMessage('OTP resent successfully. Please check your inbox/messages.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to resend OTP.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 md:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.3),transparent_38%),radial-gradient(circle_at_55%_90%,rgba(16,185,129,0.22),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:36px_36px]" />

            <div className="relative mx-auto w-full max-w-xl rounded-3xl border border-white/35 bg-white/16 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.34)] backdrop-blur-xl md:p-8">
                <h1 className="text-2xl font-bold text-white">OTP Verification</h1>
                <p className="mt-2 text-sm text-slate-200">Enter the 6-digit OTP sent to {identifier || 'your contact'}.</p>

                <form className="mt-6 space-y-4" onSubmit={onVerify}>
                    <input
                        type="text"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-3 px-4 tracking-[0.35em] text-slate-800 outline-none focus:border-sky-500"
                        minLength={6}
                        maxLength={6}
                        required
                    />

                    {error ? <p className="text-sm text-rose-200">{error}</p> : null}
                    {message ? <p className="text-sm text-emerald-200">{message}</p> : null}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(29,78,216,0.35)] transition duration-200 hover:scale-[1.02] hover:shadow-[0_18px_34px_rgba(14,116,144,0.45)] disabled:opacity-60"
                    >
                        {submitting ? 'Verifying OTP...' : 'Verify OTP'}
                    </button>
                </form>

                <div className="mt-5 flex items-center justify-between text-sm text-slate-200">
                    <button
                        type="button"
                        onClick={onResend}
                        disabled={resending}
                        className="font-medium text-cyan-200 transition hover:text-cyan-100 disabled:opacity-60"
                    >
                        {resending ? 'Resending OTP...' : 'Resend OTP'}
                    </button>
                    <Link to="/login" className="font-medium text-cyan-200 transition hover:text-cyan-100">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtpPage;
