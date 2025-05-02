import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '../services/auth.service';

/**
 * ProtectedRoute component that checks if the user is authenticated
 * before rendering the child component.
 * 
 * If not authenticated, redirects to the login page with a return URL.
 */
const ProtectedRoute = ({ children, requiredRoles }) => {
  const location = useLocation();
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getCurrentUser();

  if (!isAuthenticated) {
    // Redirect to login page with return URL in state
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    // Optionally, redirect to a "not authorized" page or dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute; 