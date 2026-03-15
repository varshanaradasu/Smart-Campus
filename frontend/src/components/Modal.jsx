import { motion } from 'framer-motion';

const Modal = ({ open, title, children, onClose }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="glass-card w-full max-w-lg rounded-2xl p-6"
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">
                        x
                    </button>
                </div>
                {children}
            </motion.div>
        </div>
    );
};

export default Modal;
