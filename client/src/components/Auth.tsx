import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Register from './Register';
import './Auth.css';

const Auth: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);
  const { isAuthenticated } = useAuth();

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  // If user is already authenticated, redirect to home page
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-container">
      {showLogin ? (
        <Login onToggleForm={toggleForm} />
      ) : (
        <Register onToggleForm={toggleForm} />
      )}
    </div>
  );
};

export default Auth;