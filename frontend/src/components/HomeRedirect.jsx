import React from 'react';
import { Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

function hasStoredToken() {
  return Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));
}

/**
 * If user is already logged in (token exists), visiting "/" will redirect to "/dashboard".
 * Otherwise, it will show the LandingPage.
 */
export default function HomeRedirect() {
  if (hasStoredToken()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
}
