import { motion } from 'framer-motion';

const PageContainer = ({
    children,
    className = '',
    animate = true,
    maxWidthClass = 'max-w-7xl',
    ...props
}) => {
    const content = (
        <div className={`mx-auto w-full ${maxWidthClass} ${className}`} {...props}>
            {children}
        </div>
    );

    if (!animate) {
        return content;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            {content}
        </motion.div>
    );
};

export default PageContainer;
