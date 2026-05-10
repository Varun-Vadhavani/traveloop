import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Plane, LayoutDashboard, MapPin, LogOut, UserCircle } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function isActive(path) {
    return location.pathname === path
      ? 'text-indigo-600 font-semibold'
      : 'text-gray-500 hover:text-indigo-600'
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
          <Plane size={18} />
        </div>
        <span className="font-bold text-gray-800 text-lg">Traveloop</span>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-6 text-sm">
        <Link to="/" className={`flex items-center gap-1.5 transition ${isActive('/')}`}>
          <LayoutDashboard size={16} />
          <span className="hidden sm:block">Dashboard</span>
        </Link>
        <Link to="/trips" className={`flex items-center gap-1.5 transition ${isActive('/trips')}`}>
          <MapPin size={16} />
          <span className="hidden sm:block">My Trips</span>
        </Link>
        <Link to="/profile" className={`flex items-center gap-1.5 transition ${isActive('/profile')}`}>
          <UserCircle size={16} />
          <span className="hidden sm:block">Profile</span>
        </Link>
      </div>

      {/* User + Logout */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:block">
          Hi, {user?.name?.split(' ')[0]} 👋
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </nav>
  )
}