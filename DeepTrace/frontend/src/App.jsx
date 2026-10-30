import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Stylesheets
import './styles/global.css';
import './styles/components.css';
import './styles/home.css';
import './styles/imageDetection.css';
import './styles/comingSoon.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import ImageDetection from './pages/ImageDetection';
import AudioDetection from './pages/AudioDetection';
import VideoDetection from './pages/VideoDetection';
import MessageDetection from './pages/MessageDetection';
import About from './pages/About';
import History from './pages/History';

/**
 * Scroll to top on route navigation helper
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <main className="main-content-layout">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/image-detection" element={<ImageDetection />} />
          <Route path="/audio-detection" element={<AudioDetection />} />
          <Route path="/video-detection" element={<VideoDetection />} />
          <Route path="/message-detection" element={<MessageDetection />} />
          <Route path="/about" element={<About />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}
