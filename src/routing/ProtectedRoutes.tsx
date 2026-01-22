import React  from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRoutesProps {
  element: ReactNode;
}

interface PublicRouteProps {
  element: ReactNode;
}

interface PaymentGuardProps {
  children: ReactNode;
}

/**
 * ProtectedRoutes - Guards routes that require authentication
 * Redirects to /Login if token is not found
 */
export const ProtectedRoutes: React.FC<ProtectedRoutesProps> = ({ element }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/Login" replace />;
  }

  return element;
};

/**
 * PublicRoute - Guards public routes that should not be accessible when authenticated
 * Redirects to / if token is found
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ element }) => {
  const token = localStorage.getItem('token');

  if (token) {
    return <Navigate to="/students" replace />;
  }

  return element;
};

/**
 * PaymentGuard - Guards payment routes with domain and path-based restrictions
 * Blocks specific paths on certain domains
 */
export const PaymentGuard: React.FC<PaymentGuardProps> = ({ children }) => {
  const location = useLocation();

  // Normalize path (remove duplicate slashes)
  const currentPath = location.pathname.replace(/\/+/g, '/');
  const currentDomain = window.location.hostname;

  // 🚫 Block rule — deny this exact combination
  const isDenied =
    currentDomain === 'bite.sortstring.com' &&
    ['/student/fee-payment', '/student/payment'].includes(currentPath);

  if (isDenied) {
    // ✅ Redirect immediately to invalid page
    return <Navigate to="/invalid-payment-link" replace />;
  }

  // ✅ Otherwise, render the intended component
  return children;
};
