import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';

const StatCard = ({
    title,
    count,
    value,
    subtitle,
    icon: Icon,
    accent = 'from-brand-500 to-brand-700',
    delay = 0,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay }}
            whileHover={{ scale: 1.03, y: -2 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${accent} p-5 text-white shadow-md`}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_55%)]" />
            <div className="relative mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-white/90">{title}</p>
                    <AnimatedNumber value={count ?? value} />
                </div>
                <div className="rounded-xl border border-white/30 bg-white/15 p-3 text-white shadow-sm backdrop-blur-sm">
                    {Icon ? <Icon size={20} strokeWidth={2.2} /> : null}
                </div>
            </div>
            <p className="relative text-xs font-medium text-white/85">{subtitle}</p>
        </motion.div>
    );
};

export default StatCard;
