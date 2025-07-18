import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import { Auth } from './pages/Auth';
import { Settings } from './pages/freelancer/Settings';
import { ClientDashboard } from './pages/client/Dashboard';
import { CreateProject } from './pages/client/CreateProject';
import { ClientProjects } from './pages/client/Projects';
import { ClientPayments } from './pages/client/Payments';
import { ClientMessages } from './pages/client/Messages';
import { FreelancerDashboard } from './pages/freelancer/Dashboard';
import { FreelancerProjects } from './pages/freelancer/Projects';
import { FreelancerRequests } from './pages/freelancer/Requests';
import { Feedback } from './pages/freelancer/Feedback';
import { KanbanBoard } from './components/workspace/KanbanBoard';
import { FreelancerMessages } from './pages/freelancer/Messages';
import { ProfileSetup } from './pages/freelancer/ProfileSetup';
import { ProjectWorkspace } from './components/workspace/ProjectWorkspace';
import ForgotPasswordPage from './pages/ForgotPassword';
import TimesheetApproval from './pages/client/TimesheetApproval';
import Meetings from './pages/client/Meetings';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'client' | 'freelancer' }) {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={`/${user?.role}/dashboard`} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Freelancer Profile Setup */}
      <Route path="/freelancer/profile-setup" element={
        <ProtectedRoute requiredRole="freelancer">
          <ProfileSetup />
        </ProtectedRoute>
      } />
      
      <Route path="/client/*" element={
        <ProtectedRoute requiredRole="client">
          <AppShell />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="create-project" element={<CreateProject />} />
        <Route path="projects" element={<ClientProjects />} />
        <Route path="kanban" element={<KanbanBoard />} /> 
        <Route path="payments" element={<ClientPayments />} />
        <Route path="messages" element={<ClientMessages />} />
        <Route path="settings" element={<Settings />} />
        <Route path="timesheet-approval" element={<TimesheetApproval />} />
        <Route path="meetings" element={<Meetings />} />
      </Route>
      
      <Route path="/freelancer/*" element={
        <ProtectedRoute requiredRole="freelancer">
          <AppShell />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<FreelancerDashboard />} />
        <Route path="requests" element={<FreelancerRequests />} />
        <Route path="projects" element={<FreelancerProjects />} />
        <Route path="kanban" element={<KanbanBoard />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="settings" element={<Settings />} />  
      </Route>

      <Route path="/workspace/:projectId" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }>
        <Route path="" element={<ProjectWorkspace />} />
      </Route>

      {/* Redirect authenticated users */}
      <Route path="*" element={
        isAuthenticated ? (
          <Navigate to={`/${user?.role}/dashboard`} replace />
        ) : (
          <Navigate to="/" replace />
        )
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;