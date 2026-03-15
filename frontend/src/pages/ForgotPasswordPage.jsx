import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { forgotPassword } from '../services/authService';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const response = await forgotPassword({ identifier });
            navigate('/verify-otp', {
                state: {
                    identifier: response.identifier || identifier.trim(),
                    otpSessionId: response.otpSessionId,
                    identifierType: response.identifierType,
                },
            });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to send OTP. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 md:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.3),transparent_38%),radial-gradient(circle_at_55%_90%,rgba(16,185,129,0.22),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:36px_36px]" />

            <div className="relative mx-auto w-full max-w-xl rounded-3xl border border-white/35 bg-white/16 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.34)] backdrop-blur-xl md:p-8">
                <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
                <p className="mt-2 text-sm text-slate-200">We will send a 6-digit OTP to your registered email.</p>

                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                    <label className="text-sm font-medium text-slate-100">Enter your registered Email</label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        {/* <Phone className="pointer-events-none absolute left-8 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /> */}
                        <input
                            type="text"
                            value={identifier}
                            onChange={(event) => setIdentifier(event.target.value)}
                            placeholder="Enter Email"
                            className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-3 pl-14 pr-4 text-slate-800 outline-none focus:border-sky-500"
                            required
                        />
                    </div>

                    {error ? <p className="text-sm text-rose-200">{error}</p> : null}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(29,78,216,0.35)] transition duration-200 hover:scale-[1.02] hover:shadow-[0_18px_34px_rgba(14,116,144,0.45)] disabled:opacity-60"
                    >
                        {submitting ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </form>

                <div className="mt-5 text-sm text-slate-200">
                    <Link to="/login" className="font-medium text-cyan-200 transition hover:text-cyan-100">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
