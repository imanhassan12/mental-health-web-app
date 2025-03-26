import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '../services/auth.service';

/**
 * ProtectedRoute component that checks if the user is authenticated
 * before rendering the child component.
 * 
 * If not authenticated, redirects to the login page with a return URL.
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = AuthService.isAuthenticated();

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

  return children;
};

export default ProtectedRoute; 