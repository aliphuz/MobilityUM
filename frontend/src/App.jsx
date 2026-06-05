import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import AdvisorDashboard from './pages/advisor/AdvisorDashboard';
import MobilityDashboard from './pages/mobility/MobilityDashboard';
import Layout from './components/Layout';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';
import AdminProgramsPage from './pages/admin/AdminProgramsPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['Student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }/>
        
        <Route path="/advisor/*" element={
          <ProtectedRoute allowedRoles={['AcademicAdvisor']}>
            <AdvisorDashboard />
          </ProtectedRoute>
        }/>
        
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['TdhepAdmin']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/analytics" replace />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="programs" element={<AdminProgramsPage />} />
        </Route>
        
        <Route path="/mobility/*" element={
          <ProtectedRoute allowedRoles={['MobilityUniversity']}>
            <MobilityDashboard />
          </ProtectedRoute>
        }/>
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}