import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { databases, DB_ID, COLLECTIONS, Query } from '../appwrite/config'
import Navbar from '../components/Navbar'
import { Plus, MapPin, Calendar, ArrowRight } from 'lucide-react'

const FEATURED_DESTINATIONS = [
  { city: 'Paris',     country: 'France',  emoji: '🗼', color: 'bg-pink-50 text-pink-700' },
  { city: 'Tokyo',     country: 'Japan',   emoji: '🗾', color: 'bg-red-50 text-red-700' },
  { city: 'New York',  country: 'USA',     emoji: '🗽', color: 'bg-blue-50 text-blue-700' },
  { city: 'Bali',      country: 'Indonesia', emoji: '🌴', color: 'bg-green-50 text-green-700' },
  { city: 'Dubai',     country: 'UAE',     emoji: '🏙️', color: 'bg-yellow-50 text-yellow-700' },
  { city: 'London',    country: 'UK',      emoji: '🎡', color: 'bg-purple-50 text-purple-700' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentTrips, setRecentTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrips() {
      try {
        const res = await databases.listDocuments(DB_ID, COLLECTIONS.TRIPS, [
          Query.equal('userId', user.$id),
          Query.orderDesc('$createdAt'),
          Query.limit(3),
        ])
        setRecentTrips(res.documents)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrips()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="bg-indigo-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-1">
            Where to next, {user?.name?.split(' ')[0]}? ✈️
          </h2>
          <p className="text-indigo-200 mb-6">
            Plan your perfect multi-city adventure in minutes.
          </p>
          <Link
            to="/trips/new"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-50 transition"
          >
            <Plus size={18} />
            Plan New Trip
          </Link>
        </div>

        {/* Recent Trips */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Recent Trips</h3>
            <Link to="/trips" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="text-gray-400 text-sm">Loading...</div>
          ) : recentTrips.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-400 mb-3">No trips yet. Start planning!</p>
              <Link
                to="/trips/new"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus size={16} /> Create your first trip
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentTrips.map(trip => (
                <div
                  key={trip.$id}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border border-gray-100"
                >
                  <h4 className="font-semibold text-gray-800 mb-2 truncate">{trip.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Calendar size={12} />
                    {trip.startDate} → {trip.endDate}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <MapPin size={12} />
                    {trip.description || 'No description'}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/trips/${trip.$id}/view`}
                      className="flex-1 text-center bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded hover:bg-gray-200 transition"
                    >
                      View
                    </Link>
                    <Link
                      to={`/trips/${trip.$id}/build`}
                      className="flex-1 text-center bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-indigo-700 transition"
                    >
                      Build
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Featured Destinations */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Popular Destinations</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURED_DESTINATIONS.map(dest => (
              <div
                key={dest.city}
                className={`rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:opacity-80 transition ${dest.color}`}
              >
                <span className="text-2xl">{dest.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{dest.city}</p>
                  <p className="text-xs opacity-70">{dest.country}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}