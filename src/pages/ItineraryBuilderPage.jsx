import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { databases, DB_ID, COLLECTIONS, ID, Query } from '../appwrite/config'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { Plus, Trash2, GripVertical, MapPin, Calendar, ChevronDown, ChevronUp, Eye } from 'lucide-react'

export default function ItineraryBuilderPage() {
  const { tripId } = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()

  console.log('ItineraryBuilderPage rendered with tripId:', tripId)
  console.log('Current user:', user)

  const [trip, setTrip]       = useState(null)
  const [stops, setStops]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [showAddStop, setShowAddStop]   = useState(false)
  const [expandedStop, setExpandedStop] = useState(null)
  const [newStop, setNewStop] = useState({ city: '', country: '', startDate: '', endDate: '' })
  const [newActivity, setNewActivity] = useState({})

  // Fetch trip + stops
  useEffect(() => {
    async function load() {
      if (!user) {
        setError('Please log in to view this trip.')
        setLoading(false)
        return
      }

      try {
        console.log('Loading trip with ID:', tripId)
        console.log('DB_ID:', DB_ID)
        console.log('COLLECTIONS.TRIPS:', COLLECTIONS.TRIPS)
        console.log('Current user:', user.$id)

        const t = await databases.getDocument(DB_ID, COLLECTIONS.TRIPS, tripId)
        console.log('Trip loaded:', t)

        // Check if the trip belongs to the current user
        if (t.userId !== user.$id) {
          setError('You do not have permission to view this trip.')
          setLoading(false)
          return
        }

        setTrip(t)

        const s = await databases.listDocuments(DB_ID, COLLECTIONS.STOPS, [
          Query.equal('tripId', tripId),
          Query.orderAsc('orderIndex'),
        ])

        // For each stop, fetch its activities
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
        console.error('Error loading trip:', err)
        let errorMessage = 'Failed to load trip.'
        if (err.code === 404) {
          errorMessage = 'Trip not found. The trip may have been deleted or you may not have permission to view it.'
        } else if (err.code === 401) {
          errorMessage = 'Authentication required. Please log in to view this trip.'
        } else if (err.code === 403) {
          errorMessage = 'Access denied. You do not have permission to view this trip.'
        } else if (err.message) {
          errorMessage = `Failed to load trip: ${err.message}`
        }
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    if (tripId) {
      load()
    } else {
      setError('No trip ID provided')
      setLoading(false)
    }
  }, [tripId, user])

  // Add a stop
  async function handleAddStop(e) {
    e.preventDefault()
    if (newStop.endDate < newStop.startDate) {
      alert('End date cannot be before start date.')
      return
    }
    try {
      const doc = await databases.createDocument(
        DB_ID, COLLECTIONS.STOPS, ID.unique(),
        { ...newStop, tripId, orderIndex: stops.length }
      )
      setStops(prev => [...prev, { ...doc, activities: [] }])
      setNewStop({ city: '', country: '', startDate: '', endDate: '' })
      setShowAddStop(false)
      setExpandedStop(doc.$id)
    } catch (err) {
      alert('Failed to add stop.')
    }
  }

  // Delete a stop
  async function handleDeleteStop(stopId) {
    if (!confirm('Delete this stop and all its activities?')) return
    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.STOPS, stopId)
      setStops(prev => prev.filter(s => s.$id !== stopId))
    } catch (err) {
      alert('Failed to delete stop.')
    }
  }

  // Add an activity
  async function handleAddActivity(e, stopId) {
    e.preventDefault()
    const data = newActivity[stopId] || {}
    if (!data.name) return
    try {
      const doc = await databases.createDocument(
        DB_ID, COLLECTIONS.ACTIVITIES, ID.unique(),
        {
          stopId,
          tripId,
          name:        data.name        || '',
          type:        data.type        || 'Sightseeing',
          cost:        parseFloat(data.cost) || 0,
          duration:    data.duration    || '',
          description: data.description || '',
        }
      )
      setStops(prev => prev.map(s =>
        s.$id === stopId
          ? { ...s, activities: [...s.activities, doc] }
          : s
      ))
      setNewActivity(prev => ({ ...prev, [stopId]: {} }))
    } catch (err) {
      alert('Failed to add activity.')
    }
  }

  // Delete activity
  async function handleDeleteActivity(stopId, activityId) {
    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.ACTIVITIES, activityId)
      setStops(prev => prev.map(s =>
        s.$id === stopId
          ? { ...s, activities: s.activities.filter(a => a.$id !== activityId) }
          : s
      ))
    } catch (err) {
      alert('Failed to delete activity.')
    }
  }

  function updateNewActivity(stopId, field, value) {
    setNewActivity(prev => ({
      ...prev,
      [stopId]: { ...prev[stopId], [field]: value }
    }))
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading trip...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{trip?.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {trip?.startDate} → {trip?.endDate}
            </p>
          </div>
          <button
            onClick={() => navigate(`/trips/${tripId}/view`)}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Eye size={16} /> Preview
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        {/* Stops List */}
        <div className="space-y-4">
          {stops.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              No stops yet. Add your first city below!
            </div>
          )}

          {stops.map((stop, index) => (
            <div key={stop.$id} className="bg-white rounded-xl shadow-sm border border-gray-100">

              {/* Stop Header */}
              <div className="flex items-center gap-3 p-4">
                <div className="text-gray-300 cursor-grab"><GripVertical size={18} /></div>
                <div className="bg-indigo-100 text-indigo-700 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-indigo-500 shrink-0" />
                    <span className="font-semibold text-gray-800">{stop.city}, {stop.country}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                    <Calendar size={11} />
                    {stop.startDate} → {stop.endDate}
                    <span className="ml-2 text-indigo-400">
                      {stop.activities.length} activit{stop.activities.length === 1 ? 'y' : 'ies'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedStop(expandedStop === stop.$id ? null : stop.$id)}
                  className="text-gray-400 hover:text-indigo-600 transition p-1"
                >
                  {expandedStop === stop.$id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <button
                  onClick={() => handleDeleteStop(stop.$id)}
                  className="text-gray-300 hover:text-red-500 transition p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Expanded: Activities */}
              {expandedStop === stop.$id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">

                  {/* Activity List */}
                  <div className="space-y-2 mb-4">
                    {stop.activities.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No activities yet for this stop.</p>
                    )}
                    {stop.activities.map(act => (
                      <div key={act.$id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{act.name}</p>
                          <p className="text-xs text-gray-400">
                            {act.type} {act.duration && `· ${act.duration}`} {act.cost > 0 && `· $${act.cost}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteActivity(stop.$id, act.$id)}
                          className="text-gray-300 hover:text-red-500 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Activity Form */}
                  <form onSubmit={e => handleAddActivity(e, stop.$id)} className="bg-indigo-50 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-indigo-700 mb-2">+ Add Activity</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Activity name *"
                        value={newActivity[stop.$id]?.name || ''}
                        onChange={e => updateNewActivity(stop.$id, 'name', e.target.value)}
                        className={inputClass}
                      />
                      <select
                        value={newActivity[stop.$id]?.type || 'Sightseeing'}
                        onChange={e => updateNewActivity(stop.$id, 'type', e.target.value)}
                        className={inputClass}
                      >
                        {['Sightseeing', 'Food', 'Adventure', 'Shopping', 'Culture', 'Relaxation', 'Transport'].map(t => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        placeholder="Duration (e.g. 2 hrs)"
                        value={newActivity[stop.$id]?.duration || ''}
                        onChange={e => updateNewActivity(stop.$id, 'duration', e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        placeholder="Cost ($)"
                        value={newActivity[stop.$id]?.cost || ''}
                        onChange={e => updateNewActivity(stop.$id, 'cost', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <input
                      placeholder="Description (optional)"
                      value={newActivity[stop.$id]?.description || ''}
                      onChange={e => updateNewActivity(stop.$id, 'description', e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                      Add Activity
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Stop */}
        <div className="mt-6">
          {!showAddStop ? (
            <button
              onClick={() => setShowAddStop(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-indigo-300 text-indigo-600 font-medium py-3 rounded-xl hover:bg-indigo-50 transition"
            >
              <Plus size={18} /> Add a City Stop
            </button>
          ) : (
            <form onSubmit={handleAddStop} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h4 className="font-semibold text-gray-700 mb-1">New Stop</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="City *"
                  required
                  value={newStop.city}
                  onChange={e => setNewStop(p => ({ ...p, city: e.target.value }))}
                  className={inputClass}
                />
                <input
                  placeholder="Country *"
                  required
                  value={newStop.country}
                  onChange={e => setNewStop(p => ({ ...p, country: e.target.value }))}
                  className={inputClass}
                />
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newStop.startDate}
                    onChange={e => setNewStop(p => ({ ...p, startDate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                  <input
                    type="date"
                    required
                    value={newStop.endDate}
                    onChange={e => setNewStop(p => ({ ...p, endDate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Save Stop
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStop(false)}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

      </main>
    </div>
  )
}