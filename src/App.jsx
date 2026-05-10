import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import LoginPage             from './pages/LoginPage'
import SignupPage            from './pages/SignupPage'
import DashboardPage         from './pages/DashboardPage'
import TripsPage             from './pages/TripsPage'
import CreateTripPage        from './pages/CreateTripPage'
import ItineraryBuilderPage  from './pages/ItineraryBuilderPage'
import ItineraryViewPage     from './pages/ItineraryViewPage'
import BudgetPage            from './pages/BudgetPage'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute><TripsPage /></ProtectedRoute>} />
      <Route path="/trips/new" element={<ProtectedRoute><CreateTripPage /></ProtectedRoute>} />
      <Route path="/trips/:tripId/build"  element={<ProtectedRoute><ItineraryBuilderPage /></ProtectedRoute>} />
      <Route path="/trips/:tripId/view"   element={<ProtectedRoute><ItineraryViewPage /></ProtectedRoute>} />
      <Route path="/trips/:tripId/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
    </Routes>
  )
}