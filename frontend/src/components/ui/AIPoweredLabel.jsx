import { Sparkles } from 'lucide-react';

const AIPoweredLabel = ({ className = '' }) => {
    return (
        <div className={`ai-powered-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${className}`}>
            <Sparkles size={14} className="text-cyan-200" />
            <span className="ai-powered-text text-xs font-bold uppercase tracking-[0.18em]">AI Powered</span>
        </div>
    );
};

export default AIPoweredLabel;