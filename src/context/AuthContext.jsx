import { createContext, useContext, useEffect, useState } from 'react'
import { account, ID } from '../appwrite/config.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    account.get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    await account.createEmailPasswordSession(email, password)
    const u = await account.get()
    setUser(u)
  }

  async function signup(name, email, password) {
    await account.create(ID.unique(), email, password, name)
    await login(email, password)
  }

  async function logout() {
    await account.deleteSession('current')
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