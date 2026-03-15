const Loader = ({ text = 'Loading...' }) => (
    <div className="glass-card rounded-2xl p-8 text-center text-slate-600">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
        <p className="text-sm font-medium">{text}</p>
    </div>
);

export default Loader;
