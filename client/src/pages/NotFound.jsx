import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="text-9xl mb-6">😕</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
            <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
            <Link to="/" className="btn-primary">🏠 Go Home</Link>
        </div>
    )
}
