import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUser(null)
    localStorage.removeItem('api-key')
  }

  return (
    <>
      {isLoggedIn ? (
        <LandingPage user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  )
}

export default App
