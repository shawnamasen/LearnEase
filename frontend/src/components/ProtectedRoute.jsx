import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function hasStoredToken() {
  return Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));
}

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasStoredToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
