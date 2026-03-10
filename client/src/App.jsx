import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Home from './pages/Home'
import ModuleList from './pages/ModuleList'
import LearningLevel from './pages/LearningLevel'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import { ProgressProvider } from './context/ProgressContext'

function App() {
    return (
        <ProgressProvider>
            <Router>
                <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <main className="flex-1">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/modules" element={<ModuleList />} />
                            <Route path="/module/:moduleId/level/:levelId" element={<LearningLevel />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </Router>
        </ProgressProvider>
    )
}

export default App
