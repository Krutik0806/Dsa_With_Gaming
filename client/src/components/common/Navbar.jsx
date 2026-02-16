import { Link } from 'react-router-dom'

function Navbar() {
    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="text-2xl">🎮</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            DSA with Gaming
                        </span>
                    </Link>

                    <div className="flex space-x-6">
                        <Link to="/" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Home
                        </Link>
                        <Link to="/modules" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Modules
                        </Link>
                        <Link to="/about" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            About
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
