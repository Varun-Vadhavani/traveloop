import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { databases, DB_ID, COLLECTIONS, Query } from '../appwrite/config'
import Navbar from '../components/Navbar'
import {
  Plus, MapPin, Calendar, Trash2,
  Edit, Eye, Search, Globe
} from 'lucide-react'

export default function TripsPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [trips, setTrips]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    async function fetchTrips() {
      try {
        const res = await databases.listDocuments(DB_ID, COLLECTIONS.TRIPS, [
          Query.equal('userId', user.$id),
          Query.orderDesc('$createdAt'),
        ])
        setTrips(res.documents)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrips()
  }, [user])

  async function handleDelete(tripId) {
    if (!confirm('Delete this trip? This cannot be undone.')) return
    setDeleting(tripId)
    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.TRIPS, tripId)
      setTrips(prev => prev.filter(t => t.$id !== tripId))
    } catch (err) {
      alert('Failed to delete trip.')
    } finally {
      setDeleting(null)
    }
  }

  function getDuration(start, end) {
    const diff = new Date(end) - new Date(start)
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const filtered = trips.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Trips</h2>
            <p className="text-sm text-gray-500 mt-1">
              {trips.length} trip{trips.length !== 1 ? 's' : ''} planned
            </p>
          </div>
          <Link
            to="/trips/new"
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={16} /> New Trip
          </Link>
        </div>

        {/* Search */}
        {trips.length > 0 && (
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search trips..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center text-gray-400 py-16">Loading your trips...</div>
        )}

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <Globe size={40} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-gray-600 font-semibold mb-2">No trips yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Start planning your first adventure!
            </p>
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={16} /> Create your first trip
            </Link>
          </div>
        )}

        {/* No search results */}
        {!loading && trips.length > 0 && filtered.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            No trips match "<span className="font-medium">{search}</span>"
          </div>
        )}

        {/* Trips Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(trip => (
              <div
                key={trip.$id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group"
              >
                {/* Color bar */}
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

                <div className="p-5">
                  {/* Title + public badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-gray-800 leading-tight">{trip.name}</h3>
                    {trip.isPublic && (
                      <span className="shrink-0 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                        Public
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {trip.description && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{trip.description}</p>
                  )}

                  {/* Meta */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} className="text-indigo-400" />
                      {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={12} className="text-indigo-400" />
                      {getDuration(trip.startDate, trip.endDate)} days
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/trips/${trip.$id}/view`)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg transition"
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      onClick={() => navigate(`/trips/${trip.$id}/build`)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 py-2 rounded-lg transition"
                    >
                      <Edit size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(trip.$id)}
                      disabled={deleting === trip.$id}
                      className="flex items-center justify-center gap-1.5 text-xs font-medium text-red-400 bg-red-50 hover:bg-red-100 py-2 px-3 rounded-lg transition disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}