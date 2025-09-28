import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { PlayerProfile } from './components/PlayerProfile'
import { SessionView } from './components/SessionView'
import { Training } from './components/Training'
import { Navbar } from './components/Navbar'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/players/:id" element={<PlayerProfile />} />
            <Route path="/sessions/:id" element={<SessionView />} />
            <Route path="/training" element={<Training />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
