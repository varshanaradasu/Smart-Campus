const ChartCard = ({ title, subtitle, children }) => (
    <section className="glass-card rounded-2xl p-6">
        <div className="mb-5">
            <h3 className="panel-title">{title}</h3>
            {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
        </div>
        <div className="h-72">{children}</div>
    </section>
);

export default ChartCard;
