import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import TimetablePage from './pages/TimetablePage';
import ClassroomPage from './pages/ClassroomPage';
import LabSchedulingPage from './pages/LabSchedulingPage';
import TransportationPage from './pages/TransportationPage';
import MaintenancePage from './pages/MaintenancePage';
import FacultyManagementPage from './pages/FacultyManagementPage';
import TimetableGeneratorPage from './pages/TimetableGeneratorPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/timetable'} replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/"
        element={<Navigate to={user?.role === 'admin' ? '/admin' : user ? '/timetable' : '/login'} replace />}
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/classrooms" element={<ClassroomPage />} />
        <Route path="/labs" element={<LabSchedulingPage />} />
        <Route
          path="/faculty-management"
          element={
            <ProtectedRoute roles={['admin']}>
              <FacultyManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transport"
          element={
            <ProtectedRoute roles={['admin']}>
              <TransportationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute roles={['admin']}>
              <MaintenancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timetable-generator"
          element={
            <ProtectedRoute roles={['admin']}>
              <TimetableGeneratorPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
