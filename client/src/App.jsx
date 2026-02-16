import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Home from './pages/Home'
import ModuleList from './pages/ModuleList'
import LearningLevel from './pages/LearningLevel'

function App() {
    return (
        <Router>
            <div className="min-h-screen">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/modules" element={<ModuleList />} />
                    <Route path="/module/:moduleId/level/:levelId" element={<LearningLevel />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
