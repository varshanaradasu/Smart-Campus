import { AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import PageContainer from '../components/ui/PageContainer';

const DashboardLayout = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-hero px-4 py-5 md:px-6 md:py-7">
            <div className="mx-auto flex max-w-7xl gap-7">
                <Sidebar />
                <main className="w-full">
                    <Topbar />
                    <AnimatePresence mode="wait">
                        <PageContainer key={location.pathname} maxWidthClass="max-w-none" className="content-stack pt-3">
                            <Outlet />
                        </PageContainer>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
