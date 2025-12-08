import './App.css'
import Home from './components/Home'
import Content from './components/Content'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import ForgetPassword from './components/ForgetPassword'
import Profile from './components/Profile'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { HeroUIProvider } from '@heroui/react'
import NavbarSide from './components/Navbar'

function App() {
  return (
    <Router>
      <AuthProvider>
        <HeroUIProvider>
          <div className="min-h-screen" style={{ background: "var(--app-bg)" }}>
            <NavbarSide />
            <Routes>
              <Route path="/" element={<Content />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/home" element={<Home />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgetpassword" element={<ForgetPassword />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </HeroUIProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
