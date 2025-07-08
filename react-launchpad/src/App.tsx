import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/Appshell';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { FreelancerDashboard } from './pages/freelancer/Dashboard';
import { ProfileSetup } from './pages/freelancer/ProfileSetup';
import {FreelancerRequests} from './pages/freelancer/Requests';
import { FreelancerReviews } from './pages/freelancer/Reviews';
import { FreelancerProjects } from './pages/freelancer/Projects';


function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'client' | 'freelancer' }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={`/${user?.role}/dashboard`} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      
      {/* Freelancer Profile Setup */}
      <Route path="/freelancer/profile-setup" element={
        <ProtectedRoute requiredRole="freelancer">
          <ProfileSetup />
        </ProtectedRoute>
      } />
      
      
      <Route path="/freelancer/*" element={
        <ProtectedRoute requiredRole="freelancer">
          <AppShell />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<FreelancerDashboard />} />
        <Route path="requests" element={<FreelancerRequests />} />
        <Route path="projects" element={<FreelancerProjects />} />
        <Route path="reviews" element={<FreelancerReviews />} />
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