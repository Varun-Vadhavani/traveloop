import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { databases, DB_ID, COLLECTIONS, ID } from '../appwrite/config'
import Navbar from '../components/Navbar'
import { Calendar, FileText, Globe, ArrowRight } from 'lucide-react'

export default function CreateTripPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:        '',
    description: '',
    startDate:   '',
    endDate:     '',
    isPublic:    false,
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.endDate < form.startDate) {
      setError('End date cannot be before start date.')
      return
    }

    setLoading(true)
    try {
      const trip = await databases.createDocument(
        DB_ID,
        COLLECTIONS.TRIPS,
        ID.unique(),
        {
          userId:      user.$id,
          name:        form.name,
          description: form.description,
          startDate:   form.startDate,
          endDate:     form.endDate,
          isPublic:    form.isPublic,
        }
      )
      navigate(`/trips/${trip.$id}/build`)
    } catch (err) {
      setError(err.message || 'Failed to create trip. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Plan a New Trip ✈️</h2>
          <p className="text-gray-500 text-sm mt-1">
            Start by giving your trip a name and dates. You'll add cities and activities next.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Trip Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip Name *
              </label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Europe Summer 2025"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <div className="relative">
                <FileText size={16} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="A quick note about this trip..."
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={form.endDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* isPublic toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Make trip public</p>
                <p className="text-xs text-gray-400">Others can view and copy your itinerary</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={form.isPublic}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:bg-indigo-600 transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : (
                <>
                  Continue to Itinerary Builder
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>
        </div>
      </main>
    </div>
  )
}