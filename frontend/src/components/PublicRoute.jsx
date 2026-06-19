import React from 'react';
import { Navigate } from 'react-router-dom';

function hasStoredToken() {
  return Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));
}

/**
 * Prevents logged-in users from visiting login/signup pages.
 */
export default function PublicRoute({ children }) {
  if (hasStoredToken()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
