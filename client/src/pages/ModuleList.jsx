import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function ModuleList() {
    const [modules, setModules] = useState([])

    useEffect(() => {
        // For now, using static data. Later, fetch from API
        const staticModules = [
            {
                id: 'sorting',
                title: 'Sorting Algorithms',
                description: 'Learn how sorting algorithms work through visual step-by-step execution',
                icon: '🔄',
                levels: 4,
                difficulty: 'Beginner',
                color: 'from-blue-400 to-blue-600'
            },
            {
                id: 'stack-queue',
                title: 'Stack & Queue',
                description: 'Understand LIFO and FIFO data structures with interactive operations',
                icon: '📚',
                levels: 3,
                difficulty: 'Beginner',
                color: 'from-purple-400 to-purple-600'
            },
            {
                id: 'trees',
                title: 'Tree Basics',
                description: 'Master hierarchical data structures and tree traversal techniques',
                icon: '🌳',
                levels: 4,
                difficulty: 'Intermediate',
                color: 'from-green-400 to-green-600'
            }
        ]
        setModules(staticModules)
    }, [])

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Learning Modules</h1>
                <p className="text-lg text-gray-600">Choose a module to start your DSA journey</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {modules.map((module) => (
                    <Link
                        key={module.id}
                        to={`/module/${module.id}/level/1`}
                        className="level-card group"
                    >
                        <div className="text-center">
                            <div className="text-6xl mb-4">{module.icon}</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{module.title}</h3>
                            <p className="text-gray-600 mb-4">{module.description}</p>

                            <div className="flex justify-center gap-4 mb-4">
                                <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                                    {module.levels} Levels
                                </span>
                                <span className="text-sm bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full">
                                    {module.difficulty}
                                </span>
                            </div>

                            <div className={`bg-gradient-to-r ${module.color} text-white py-2 px-4 rounded-lg group-hover:shadow-lg transition-all`}>
                                Start Learning →
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default ModuleList
