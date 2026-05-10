import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { databases, DB_ID, COLLECTIONS, ID, Query } from '../appwrite/config'
import Navbar from '../components/Navbar'
import {
  ArrowLeft, Plus, Trash2,
  FileText, Clock, Edit2, Save, X
} from 'lucide-react'

export default function NotesPage() {
  const { tripId } = useParams()
  const navigate   = useNavigate()

  const [trip, setTrip]       = useState(null)
  const [notes, setNotes]     = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [editingId, setEditingId]       = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const t = await databases.getDocument(DB_ID, COLLECTIONS.TRIPS, tripId)
        setTrip(t)

        const res = await databases.listDocuments(DB_ID, COLLECTIONS.NOTES, [
          Query.equal('tripId', tripId),
          Query.orderDesc('timeStamp'),
        ])
        setNotes(res.documents)
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
    if (!content.trim()) return
    setSaving(true)
    try {
      const doc = await databases.createDocument(
        DB_ID, COLLECTIONS.NOTES, ID.unique(),
        {
          tripId,
          content:   content.trim(),
          timeStamp: new Date().toISOString(),
        }
      )
      setNotes(prev => [doc, ...prev])
      setContent('')
    } catch (err) {
      alert('Failed to save note.')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(noteId) {
    if (!editingContent.trim()) return
    try {
      const updated = await databases.updateDocument(
        DB_ID, COLLECTIONS.NOTES, noteId,
        { content: editingContent.trim() }
      )
      setNotes(prev => prev.map(n => n.$id === noteId ? updated : n))
      setEditingId(null)
      setEditingContent('')
    } catch (err) {
      alert('Failed to update note.')
    }
  }

  async function handleDelete(noteId) {
    if (!confirm('Delete this note?')) return
    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.NOTES, noteId)
      setNotes(prev => prev.filter(n => n.$id !== noteId))
    } catch (err) {
      alert('Failed to delete note.')
    }
  }

  function formatTimestamp(ts) {
    return new Date(ts).toLocaleString('en-US', {
      month:  'short',
      day:    'numeric',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading notes...
      </div>
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
            className="text-gray-500 hover:text-indigo-600 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Trip Notes</h2>
            <p className="text-sm text-gray-500">{trip?.name}</p>
          </div>
        </div>

        {/* Add Note */}
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            New Note
          </label>
          <textarea
            rows={4}
            placeholder="Jot down hotel check-in info, local tips, reminders..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Plus size={15} />
              {saving ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </form>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <FileText size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No notes yet. Add your first one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map(note => (
              <div
                key={note.$id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
              >
                {editingId === note.$id ? (
                  /* Edit mode */
                  <div>
                    <textarea
                      rows={4}
                      value={editingContent}
                      onChange={e => setEditingContent(e.target.value)}
                      className="w-full border border-indigo-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setEditingId(null); setEditingContent('') }}
                        className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                      >
                        <X size={13} /> Cancel
                      </button>
                      <button
                        onClick={() => handleEdit(note.$id)}
                        className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                      >
                        <Save size={13} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock size={11} />
                        {formatTimestamp(note.timestamp)}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(note.$id)
                            setEditingContent(note.content)
                          }}
                          className="text-gray-400 hover:text-indigo-600 transition p-1"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(note.$id)}
                          className="text-gray-300 hover:text-red-500 transition p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}