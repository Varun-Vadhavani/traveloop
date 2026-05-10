import { createContext, useContext, useEffect, useState } from 'react'
import { account } from '../appwrite/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    account.get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    // Delete any existing session first to avoid conflicts
    try {
      await account.deleteSession('current')
    } catch {
      // No active session — that's fine, continue
    }

    await account.createEmailPasswordSession(email, password)
    const u = await account.get()
    setUser(u)
  }

  async function signup(name, email, password) {
    // Delete any existing session first
    try {
      await account.deleteSession('current')
    } catch {
      // No active session — that's fine, continue
    }

    await account.create('unique()', email, password, name)
    await account.createEmailPasswordSession(email, password)
    const u = await account.get()
    setUser(u)
  }

  async function logout() {
    try {
      await account.deleteSession('current')
    } catch {
      // Session already gone
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}