import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { databases, DB_ID, COLLECTIONS, Query } from '../appwrite/config'
import Navbar from '../components/Navbar'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  ArrowLeft, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle
} from 'lucide-react'

const TYPE_COLORS = {
  Food:        '#f97316',
  Sightseeing: '#3b82f6',
  Shopping:    '#ec4899',
  Adventure:   '#22c55e',
  Culture:     '#a855f7',
  Relaxation:  '#14b8a6',
  Transport:   '#6b7280',
}

const RADIAN = Math.PI / 180
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5
  const x  = cx + r * Math.cos(-midAngle * RADIAN)
  const y  = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function BudgetPage() {
  const { tripId } = useParams()
  const navigate   = useNavigate()

  const [trip, setTrip]       = useState(null)
  const [stops, setStops]     = useState([])
  const [loading, setLoading] = useState(true)
  const [budget, setBudget]   = useState('')
  const [savedBudget, setSavedBudget] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const t = await databases.getDocument(DB_ID, COLLECTIONS.TRIPS, tripId)
        setTrip(t)
        if (t.budget) {
          setBudget(t.budget)
          setSavedBudget(t.budget)
        }

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
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tripId])

  // --- Derived data ---

  // Cost by type (for pie chart)
  const costByType = {}
  stops.forEach(stop => {
    stop.activities.forEach(act => {
      if (act.cost > 0) {
        costByType[act.type] = (costByType[act.type] || 0) + act.cost
      }
    })
  })
  const pieData = Object.entries(costByType).map(([name, value]) => ({ name, value }))

  // Cost by city (for bar chart)
  const barData = stops.map(stop => ({
    city: stop.city,
    cost: stop.activities.reduce((s, a) => s + (a.cost || 0), 0),
  })).filter(d => d.cost > 0)

  // Totals
  const totalCost = stops.reduce((sum, stop) =>
    sum + stop.activities.reduce((s, a) => s + (a.cost || 0), 0), 0
  )

  function getDays(start, end) {
    const diff = new Date(end) - new Date(start)
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1)
  }

  const tripDays    = trip ? getDays(trip.startDate, trip.endDate) : 1
  const avgPerDay   = totalCost / tripDays
  const isOverBudget = savedBudget && totalCost > parseFloat(savedBudget)
  const remaining    = savedBudget ? parseFloat(savedBudget) - totalCost : null

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading budget...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/trips/${tripId}/view`)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Budget Breakdown</h2>
              <p className="text-sm text-gray-500">{trip?.name}</p>
            </div>
          </div>
        </div>

        {/* Budget input */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Set your total budget (optional)
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="number"
                placeholder="e.g. 2000"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => setSavedBudget(budget)}
              className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition"
            >
              Set Budget
            </button>
          </div>

          {/* Budget status */}
          {savedBudget && (
            <div className={`mt-3 flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg ${isOverBudget ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {isOverBudget
                ? <><AlertTriangle size={15} /> Over budget by ${Math.abs(remaining).toFixed(2)}</>
                : <><CheckCircle size={15} /> ${remaining?.toFixed(2)} remaining from your budget</>
              }
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Cost',    value: `$${totalCost.toFixed(2)}`,   icon: <DollarSign size={18} />,  color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Avg / Day',     value: `$${avgPerDay.toFixed(2)}`,   icon: <TrendingUp size={18} />,  color: 'text-purple-600 bg-purple-50' },
            { label: 'Total Days',    value: `${tripDays} days`,            icon: <TrendingUp size={18} />,  color: 'text-blue-600 bg-blue-50' },
            { label: 'Cities',        value: `${stops.length}`,             icon: <DollarSign size={18} />,  color: 'text-green-600 bg-green-50' },
          ].map((card, index) => (
            <div key={card.label} className={`animate-fade-in-up delay-${index + 1} bg-white rounded-xl border border-gray-100 shadow-sm p-4`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-xs text-gray-400">{card.label}</p>
              <p className="text-lg font-bold text-gray-800">{card.value}</p>
            </div>
          ))}
        </div>

        {totalCost === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            No costs added yet. Add activity costs in the itinerary builder.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">

            {/* Pie Chart */}
            {pieData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-4">Cost by Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      dataKey="value"
                      labelLine={false}
                      label={CustomLabel}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={TYPE_COLORS[entry.name] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => `$${v.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bar Chart */}
            {barData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-4">Cost by City</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={v => `$${v.toFixed(2)}`} />
                    <Bar dataKey="cost" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Per stop breakdown table */}
        {stops.some(s => s.activities.some(a => a.cost > 0)) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">Detailed Breakdown</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {stops.map(stop => {
                const stopTotal = stop.activities.reduce((s, a) => s + (a.cost || 0), 0)
                if (stopTotal === 0) return null
                return (
                  <div key={stop.$id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700 text-sm">{stop.city}</span>
                      <span className="font-semibold text-indigo-600 text-sm">${stopTotal.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                      {stop.activities.filter(a => a.cost > 0).map(act => (
                        <div key={act.$id} className="flex items-center justify-between text-xs text-gray-400 pl-3">
                          <span>{act.name} <span className="text-gray-300">· {act.type}</span></span>
                          <span>${act.cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-5 py-4 bg-gray-50 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="font-bold text-indigo-600 text-lg">${totalCost.toFixed(2)}</span>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}