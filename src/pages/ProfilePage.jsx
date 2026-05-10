import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { account } from '../appwrite/config'
import Navbar from '../components/Navbar'
import {
  UserCircle, Mail, Lock, Trash2,
  Save, AlertTriangle, CheckCircle
} from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [name, setName]               = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [nameStatus, setNameStatus]     = useState('')
  const [passStatus, setPassStatus]     = useState('')
  const [nameError, setNameError]       = useState('')
  const [passError, setPassError]       = useState('')
  const [savingName, setSavingName]     = useState(false)
  const [savingPass, setSavingPass]     = useState(false)
  const [showDelete, setShowDelete]     = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting]         = useState(false)

  // Update name
  async function handleSaveName(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSavingName(true)
    setNameError('')
    setNameStatus('')
    try {
      await account.updateName(name.trim())
      setNameStatus('Name updated successfully!')
    } catch (err) {
      setNameError(err.message || 'Failed to update name.')
    } finally {
      setSavingName(false)
    }
  }

  // Update password
  async function handleSavePassword(e) {
    e.preventDefault()
    setPassError('')
    setPassStatus('')
    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.')
      return
    }
    setSavingPass(true)
    try {
      await account.updatePassword(newPassword, currentPassword)
      setPassStatus('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPassError(err.message || 'Failed to update password. Check your current password.')
    } finally {
      setSavingPass(false)
    }
  }

  // Delete account
  async function handleDeleteAccount() {
    if (!deletePassword) {
      alert('Please enter your password to confirm.')
      return
    }
    setDeleting(true)
    try {
      // Verify password by creating a session
      await account.createEmailPasswordSession(user.email, deletePassword)
      await account.deleteIdentity(user.$id)
      await logout()
      navigate('/login')
    } catch (err) {
      alert('Incorrect password or failed to delete account.')
    } finally {
      setDeleting(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Profile & Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your account information</p>
        </div>

        {/* Avatar + Email */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 text-indigo-600 rounded-full w-16 h-16 flex items-center justify-center">
              <UserCircle size={40} />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">{user?.name}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                <Mail size={13} />
                {user?.email}
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                Verified account
              </span>
            </div>
          </div>
        </div>

        {/* Update Name */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <UserCircle size={18} className="text-indigo-500" />
            Update Name
          </h3>

          {nameStatus && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-lg mb-4">
              <CheckCircle size={15} /> {nameStatus}
            </div>
          )}
          {nameError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg mb-4">
              <AlertTriangle size={15} /> {nameError}
            </div>
          )}

          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={savingName}
              className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Save size={15} />
              {savingName ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* Update Password */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Lock size={18} className="text-indigo-500" />
            Change Password
          </h3>

          {passStatus && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-lg mb-4">
              <CheckCircle size={15} /> {passStatus}
            </div>
          )}
          {passError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg mb-4">
              <AlertTriangle size={15} /> {passError}
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={savingPass}
              className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Save size={15} />
              {savingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
          <h3 className="font-semibold text-red-600 mb-1 flex items-center gap-2">
            <AlertTriangle size={18} />
            Danger Zone
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Deleting your account is permanent and cannot be undone.
          </p>

          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 text-sm text-red-500 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 size={15} /> Delete Account
            </button>
          ) : (
            <div className="bg-red-50 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-600 font-medium">
                Enter your password to confirm deletion:
              </p>
              <input
                type="password"
                placeholder="Your password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="w-full border border-red-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
                <button
                  onClick={() => { setShowDelete(false); setDeletePassword('') }}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}