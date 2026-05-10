import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { databases, DB_ID, COLLECTIONS, ID, Query } from '../appwrite/config'
import Navbar from '../components/Navbar'
import {
  ArrowLeft, Plus, Trash2, CheckSquare,
  Square, RefreshCw, Shirt, FileText,
  Smartphone, Star, Package
} from 'lucide-react'

const CATEGORIES = ['Clothing', 'Documents', 'Electronics', 'Essentials', 'Other']

const CATEGORY_ICONS = {
  Clothing:    <Shirt size={14} />,
  Documents:   <FileText size={14} />,
  Electronics: <Smartphone size={14} />,
  Essentials:  <Star size={14} />,
  Other:       <Package size={14} />,
}

const CATEGORY_COLORS = {
  Clothing:    'bg-pink-50 text-pink-700 border-pink-200',
  Documents:   'bg-blue-50 text-blue-700 border-blue-200',
  Electronics: 'bg-purple-50 text-purple-700 border-purple-200',
  Essentials:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  Other:       'bg-gray-50 text-gray-700 border-gray-200',
}

const SUGGESTIONS = {
  Clothing:    ['T-shirts', 'Jeans', 'Jacket', 'Underwear', 'Socks', 'Swimwear', 'Formal wear', 'Pajamas'],
  Documents:   ['Passport', 'Visa', 'Travel insurance', 'Hotel bookings', 'Flight tickets', 'ID card', 'Driving license'],
  Electronics: ['Phone charger', 'Power bank', 'Laptop', 'Camera', 'Earphones', 'Universal adapter', 'Memory card'],
  Essentials:  ['Sunscreen', 'Medications', 'Toothbrush', 'Shampoo', 'Hand sanitizer', 'Face mask', 'First aid kit'],
  Other:       ['Snacks', 'Travel pillow', 'Guidebook', 'Reusable bag', 'Umbrella', 'Water bottle'],
}

export default function ChecklistPage() {
  const { tripId } = useParams()
  const navigate   = useNavigate()

  const [trip, setTrip]         = useState(null)
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [newCategory, setNewCategory] = useState('Essentials')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    async function load() {
      try {
        const t = await databases.getDocument(DB_ID, COLLECTIONS.TRIPS, tripId)
        setTrip(t)

        const res = await databases.listDocuments(DB_ID, COLLECTIONS.CHECKLIST, [
          Query.equal('tripId', tripId),
        ])
        setItems(res.documents)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tripId])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newLabel.trim()) return
    try {
      const doc = await databases.createDocument(
        DB_ID, COLLECTIONS.CHECKLIST, ID.unique(),
        { tripId, label: newLabel.trim(), packed: false, category: newCategory }
      )
      setItems(prev => [...prev, doc])
      setNewLabel('')
    } catch (err) {
      alert('Failed to add item.')
    }
  }

  async function handleAddSuggestion(label) {
    if (items.find(i => i.label === label)) return
    try {
      const doc = await databases.createDocument(
        DB_ID, COLLECTIONS.CHECKLIST, ID.unique(),
        { tripId, label, packed: false, category: newCategory }
      )
      setItems(prev => [...prev, doc])
    } catch (err) {
      alert('Failed to add item.')
    }
  }

  async function handleToggle(item) {
    try {
      const updated = await databases.updateDocument(
        DB_ID, COLLECTIONS.CHECKLIST, item.$id,
        { packed: !item.packed }
      )
      setItems(prev => prev.map(i => i.$id === item.$id ? updated : i))
    } catch (err) {
      alert('Failed to update item.')
    }
  }

  async function handleDelete(itemId) {
    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.CHECKLIST, itemId)
      setItems(prev => prev.filter(i => i.$id !== itemId))
    } catch (err) {
      alert('Failed to delete item.')
    }
  }

  async function handleReset() {
    if (!confirm('Mark all items as unpacked?')) return
    try {
      const updates = items
        .filter(i => i.packed)
        .map(i => databases.updateDocument(DB_ID, COLLECTIONS.CHECKLIST, i.$id, { packed: false }))
      const updated = await Promise.all(updates)
      setItems(prev => prev.map(i => {
        const u = updated.find(u => u.$id === i.$id)
        return u || i
      }))
    } catch (err) {
      alert('Failed to reset checklist.')
    }
  }

  const filtered = activeCategory === 'All'
    ? items
    : items.filter(i => i.category === activeCategory)

  const packedCount = items.filter(i => i.packed).length
  const progress    = items.length > 0 ? (packedCount / items.length) * 100 : 0

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading checklist...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/trips/${tripId}/view`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">Packing Checklist</h2>
            <p className="text-sm text-gray-500">{trip?.name}</p>
          </div>
          {items.some(i => i.packed) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
            >
              <RefreshCw size={13} /> Reset
            </button>
          )}
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {packedCount} of {items.length} packed
              </span>
              <span className="text-sm font-bold text-indigo-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <p className="text-xs text-green-600 font-medium mt-2 text-center">
                🎉 All packed! Have a great trip!
              </p>
            )}
          </div>
        )}

        {/* Add Item Form */}
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Add Item</p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Item name..."
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Suggestions for {newCategory}:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS[newCategory]?.map(s => {
                const already = items.find(i => i.label === s)
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddSuggestion(s)}
                    disabled={!!already}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      already
                        ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    {already ? '✓' : '+'} {s}
                  </button>
                )
              })}
            </div>
          </div>
        </form>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {cat}
              {cat !== 'All' && (
                <span className="ml-1 opacity-60">
                  ({items.filter(i => i.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Items List */}
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-10">
            No items in this category yet.
          </div>
        ) : (
          <div className="space-y-2">
            {CATEGORIES.map(cat => {
              const catItems = filtered.filter(i => i.category === cat)
              if (catItems.length === 0) return null
              return (
                <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Category Header */}
                  <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${CATEGORY_COLORS[cat]}`}>
                    {CATEGORY_ICONS[cat]}
                    <span className="text-xs font-semibold">{cat}</span>
                    <span className="ml-auto text-xs opacity-60">
                      {catItems.filter(i => i.packed).length}/{catItems.length}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-gray-50">
                    {catItems.map(item => (
                      <div
                        key={item.$id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <button
                          onClick={() => handleToggle(item)}
                          className={`shrink-0 transition ${item.packed ? 'text-indigo-600' : 'text-gray-300 hover:text-indigo-400'}`}
                        >
                          {item.packed ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <span className={`flex-1 text-sm transition ${item.packed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.label}
                        </span>
                        <button
                          onClick={() => handleDelete(item.$id)}
                          className="text-gray-200 hover:text-red-400 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}