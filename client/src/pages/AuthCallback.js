import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// After Cognito Hosted-UI redirects back, ALB sets auth cookies.
// We just redirect the user to the dashboard.
export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    // Could parse ?code=... if needed
    navigate('/', { replace: true });
  }, [navigate]);
  return <div>Signing in...</div>;
} 