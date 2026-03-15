import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-hero px-6 text-center">
            <h1 className="text-5xl font-extrabold text-slate-900">404</h1>
            <p className="mt-2 text-slate-600">The page you are looking for could not be found.</p>
            <Link to="/" className="mt-5 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">
                Back to dashboard
            </Link>
        </div>
    );
};

export default NotFoundPage;
