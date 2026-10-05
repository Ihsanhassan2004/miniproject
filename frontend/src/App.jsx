import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages (each renders its own Navbar/Footer)
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected User Pages
import Dashboard from './pages/Dashboard';
import PlanTrip from './pages/PlanTrip';
import Destinations from './pages/Destinations';
import DestinationDetails from './pages/DestinationDetails';
import Recommendations from './pages/Recommendations';
import SavedTrips from './pages/SavedTrips';
import TripDetails from './pages/TripDetails';
import Diaries from './pages/Diaries';
import FeedbackReviews from './pages/FeedbackReviews';
import Profile from './pages/Profile';
import Support from './pages/Support';
import AIChat from './pages/AIChat';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDestinations from './pages/admin/ManageDestinations';
import ManageHotels from './pages/admin/ManageHotels';
import ManageRestaurants from './pages/admin/ManageRestaurants';
import ManageTransportation from './pages/admin/ManageTransportation';
import ManageUsers from './pages/admin/ManageUsers';
import ManageComplaints from './pages/admin/ManageComplaints';
import ManageReviewsFeedback from './pages/admin/ManageReviewsFeedback';
import ManageDiaries from './pages/admin/ManageDiaries';
import ManageTrips from './pages/admin/ManageTrips';

export default function App() {
  return (
    <Routes>
      {/* ── Public Routes (pages include their own Navbar/Footer) ── */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-login" element={<Navigate to="/login" replace />} />

      {/* ── Protected User Routes (inside DashboardLayout) ── */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/plan-trip" element={<PlanTrip />} />
        <Route path="/chat" element={<AIChat />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/destinations/:id" element={<DestinationDetails />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/my-trips" element={<SavedTrips />} />
        <Route path="/trips/:id" element={<TripDetails />} />
        <Route path="/diaries" element={<Diaries />} />
        <Route path="/diary" element={<Diaries />} />
        <Route path="/reviews" element={<FeedbackReviews />} />
        <Route path="/feedback" element={<FeedbackReviews />} />
        <Route path="/feedback-reviews" element={<FeedbackReviews />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/support" element={<Support />} />
      </Route>

      {/* ── Protected Admin Routes (inside DashboardLayout) ── */}
      <Route element={<DashboardLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/destinations" element={<ManageDestinations />} />
        <Route path="/admin/hotels" element={<ManageHotels />} />
        <Route path="/admin/restaurants" element={<ManageRestaurants />} />
        <Route path="/admin/transport" element={<ManageTransportation />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/trips" element={<ManageTrips />} />
        <Route path="/admin/saved-trips" element={<Navigate to="/admin/trips" replace />} />
        <Route path="/admin/complaints" element={<ManageComplaints />} />
        <Route path="/admin/reviews-feedback" element={<ManageReviewsFeedback />} />
        <Route path="/admin/diaries" element={<ManageDiaries />} />
      </Route>

      {/* ── Catch-all redirect ──────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
