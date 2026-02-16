import { Link } from 'react-router-dom'

function Home() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center animate-fade-in">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Learn DSA Through
                        <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            Interactive Gaming
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Master Data Structures and Algorithms with visual animations,
                        step-by-step pseudo-code, and hands-on interactive challenges.
                    </p>
                    <Link to="/modules" className="btn-primary inline-block">
                        Start Learning 🚀
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl font-bold text-center mb-12">Why Choose DSA with Gaming?</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="card text-center">
                        <div className="text-5xl mb-4">👁️</div>
                        <h3 className="text-xl font-semibold mb-3">Visual Learning</h3>
                        <p className="text-gray-600">
                            Watch data structures come to life with beautiful animations and real-time visualizations.
                        </p>
                    </div>

                    <div className="card text-center">
                        <div className="text-5xl mb-4">🎯</div>
                        <h3 className="text-xl font-semibold mb-3">Interactive Practice</h3>
                        <p className="text-gray-600">
                            Learn by doing! Drag, drop, and interact with data structures directly.
                        </p>
                    </div>

                    <div className="card text-center">
                        <div className="text-5xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold mb-3">Pseudo-Code Guidance</h3>
                        <p className="text-gray-600">
                            Follow along with synchronized pseudo-code as animations execute step-by-step.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-primary-500 to-secondary-500 py-16 mt-20">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to Master DSA?
                    </h2>
                    <p className="text-white text-lg mb-8">
                        Join thousands of students learning DSA the fun way!
                    </p>
                    <Link to="/modules" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-all duration-300 inline-block">
                        Explore Modules
                    </Link>
                </div>
            </section>
        </div>
    )
}

export default Home
