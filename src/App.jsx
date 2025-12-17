import './App.css'
import Home from './components/Home'
import Content from './components/Content'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import ForgetPassword from './components/ForgetPassword'
import Profile from './components/Profile'
import Pricing from './components/Pricing'
import Terms from './components/Terms'
import Privacy from './components/Privacy'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import NavbarSide from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen pt-24 pb-14">
        <NavbarSide />
        <Routes>
          <Route path="/" element={<Content />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/home" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgetpassword" element={<ForgetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App
