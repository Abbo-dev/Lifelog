import './App.css'
import Home from './components/Home'
import Content from './components/Content'
import Auth from './components/Auth'
import ForgetPassword from './components/ForgetPassword'
import Profile from './components/Profile'
import Pricing from './components/Pricing'
import Terms from './components/Terms'
import Privacy from './components/Privacy'
import ShareNote from './components/ShareNote'
import NotFound from './components/NotFound'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import NavbarSide from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import { useFocusMode } from './hooks/useFocusMode'

function AppLayout() {
  const { pathname } = useLocation()
  const { enabled: focusMode } = useFocusMode()
  const hideFooter = pathname === '/auth' || pathname === '/signin' || pathname === '/signup'

  return (
    <div className={`app-shell min-h-screen pt-24 pb-14 ${focusMode ? "focus-mode" : ""}`}>
      <NavbarSide />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signin" element={<Navigate to="/auth?mode=signin" replace />} />
        <Route path="/home" element={<Content />} />
        <Route path="/app" element={<Home />} />
        <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/share/:shareId" element={<ShareNote />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideFooter && <Footer />}
    </div>
  )
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppLayout />
    </Router>
  )
}

export default App
