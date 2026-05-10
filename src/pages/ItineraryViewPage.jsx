import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { databases, DB_ID, COLLECTIONS, Query } from '../appwrite/config'
import Navbar from '../components/Navbar'
import {
  MapPin, Calendar, Clock, DollarSign,
  Edit, ArrowLeft, Utensils, Camera,
  ShoppingBag, Zap, BookOpen, Coffee, Bus, PiggyBank
} from 'lucide-react'

const TYPE_ICONS = {
  Food:        <Utensils size={13} />,
  Sightseeing: <Camera size={13} />,
  Shopping:    <ShoppingBag size={13} />,
  Adventure:   <Zap size={13} />,
  Culture:     <BookOpen size={13} />,
  Relaxation:  <Coffee size={13} />,
  Transport:   <Bus size={13} />,
}

const TYPE_COLORS = {
  Food:        'bg-orange-50 text-orange-700',
  Sightseeing: 'bg-blue-50 text-blue-700',
  Shopping:    'bg-pink-50 text-pink-700',
  Adventure:   'bg-green-50 text-green-700',
  Culture:     'bg-purple-50 text-purple-700',
  Relaxation:  'bg-teal-50 text-teal-700',
  Transport:   'bg-gray-50 text-gray-700',
}

export default function ItineraryViewPage() {
  const { tripId } = useParams()
  const navigate   = useNavigate()

  const [trip, setTrip]       = useState(null)
  const [stops, setStops]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function load() {
      try {
        const t = await databases.getDocument(DB_ID, COLLECTIONS.TRIPS, tripId)
        setTrip(t)

        const s = await databases.listDocuments(DB_ID, COLLECTIONS.STOPS, [
          Query.equal('tripId', tripId),
          Query.orderAsc('orderIndex'),
        ])

        const stopsWithActivities = await Promise.all(
          s.documents.map(async stop => {
            const acts = await databases.listDocuments(DB_ID, COLLECTIONS.ACTIVITIES, [
              Query.equal('stopId', stop.$id),
            ])
            return { ...stop, activities: acts.documents }
          })
        )
        setStops(stopsWithActivities)
      } catch (err) {
        setError('Failed to load itinerary.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tripId])

  // Calculate total cost
  const totalCost = stops.reduce((sum, stop) =>
    sum + stop.activities.reduce((s, a) => s + (a.cost || 0), 0), 0
  )

  // Calculate trip duration in days
  function getDays(start, end) {
    const diff = new Date(end) - new Date(start)
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading itinerary...</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-red-400">{error}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition mt-1"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={() => navigate(`/trips/${tripId}/build`)}
            className="flex items-center gap-2 border border-indigo-300 text-indigo-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
          >
            <Edit size={15} /> Edit Trip
          </button>
          <button
            onClick={() => navigate(`/trips/${tripId}/budget`)}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <PiggyBank size={15} /> Budget
          </button>
        </div>

        {/* Trip Summary Card */}
        <div className="bg-indigo-600 text-white rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-1">{trip?.name}</h2>
          {trip?.description && (
            <p className="text-indigo-200 text-sm mb-4">{trip.description}</p>
          )}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-indigo-500 rounded-xl p-3 text-center">
              <Calendar size={18} className="mx-auto mb-1 text-indigo-200" />
              <p className="text-xs text-indigo-200">Duration</p>
              <p className="font-bold text-sm">
                {trip ? getDays(trip.startDate, trip.endDate) : '—'} days
              </p>
            </div>
            <div className="bg-indigo-500 rounded-xl p-3 text-center">
              <MapPin size={18} className="mx-auto mb-1 text-indigo-200" />
              <p className="text-xs text-indigo-200">Cities</p>
              <p className="font-bold text-sm">{stops.length}</p>
            </div>
            <div className="bg-indigo-500 rounded-xl p-3 text-center">
              <DollarSign size={18} className="mx-auto mb-1 text-indigo-200" />
              <p className="text-xs text-indigo-200">Est. Cost</p>
              <p className="font-bold text-sm">${totalCost.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Stops Timeline */}
        {stops.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
            <p className="mb-3">No stops added yet.</p>
            <button
              onClick={() => navigate(`/trips/${tripId}/build`)}
              className="text-indigo-600 text-sm font-medium hover:underline"
            >
              Go to builder →
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-indigo-100 z-0" />

            <div className="space-y-6 relative z-10">
              {stops.map((stop, index) => (
                <div key={stop.$id} className="flex gap-4">

                  {/* Circle marker */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
                    {index + 1}
                  </div>

                  {/* Stop Card */}
                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-2">

                    {/* Stop Header */}
                    <div className="px-5 py-4 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-indigo-500" />
                        <h3 className="font-bold text-gray-800 text-lg">
                          {stop.city}, {stop.country}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                        <Calendar size={11} />
                        {stop.startDate} → {stop.endDate}
                        <span className="mx-1">·</span>
                        <Clock size={11} />
                        {getDays(stop.startDate, stop.endDate)} days
                      </div>
                    </div>

                    {/* Activities */}
                    <div className="px-5 py-3">
                      {stop.activities.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-2">No activities planned.</p>
                      ) : (
                        <div className="space-y-2">
                          {stop.activities.map(act => (
                            <div
                              key={act.$id}
                              className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
                            >
                              <div className="flex items-start gap-2.5">
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${TYPE_COLORS[act.type] || 'bg-gray-50 text-gray-600'}`}>
                                  {TYPE_ICONS[act.type]}
                                  {act.type}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">{act.name}</p>
                                  {act.description && (
                                    <p className="text-xs text-gray-400 mt-0.5">{act.description}</p>
                                  )}
                                  {act.duration && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                      <Clock size={10} /> {act.duration}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {act.cost > 0 && (
                                <span className="text-sm font-semibold text-gray-700 shrink-0">
                                  ${act.cost}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stop subtotal */}
                      {stop.activities.some(a => a.cost > 0) && (
                        <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            Stop total:{' '}
                            <span className="font-semibold text-indigo-600">
                              ${stop.activities.reduce((s, a) => s + (a.cost || 0), 0).toFixed(0)}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom total */}
        {totalCost > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
            <span className="text-gray-600 font-medium">Total Estimated Cost</span>
            <span className="text-xl font-bold text-indigo-600">${totalCost.toFixed(2)}</span>
          </div>
        )}

      </main>
    </div>
  )
}