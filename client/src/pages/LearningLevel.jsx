import { useParams } from 'react-router-dom'
import { useState } from 'react'

function LearningLevel() {
    const { moduleId, levelId } = useParams()
    const [currentStep, setCurrentStep] = useState(0)

    // Sample data - will be replaced with actual module data
    const levelData = {
        title: 'Bubble Sort - Concept Introduction',
        description: 'Learn how Bubble Sort works by comparing adjacent elements',
        pseudoCode: [
            'for i = 0 to n-1',
            '  for j = 0 to n-i-1',
            '    if arr[j] > arr[j+1]',
            '      swap(arr[j], arr[j+1])',
        ],
        steps: [
            'Compare first two elements',
            'Swap if needed',
            'Move to next pair',
            'Repeat until sorted'
        ]
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{levelData.title}</h1>
                <p className="text-gray-600">{levelData.description}</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Visualization Area */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Visualization</h2>
                    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🎨</div>
                            <p className="text-gray-600">Visualization component will go here</p>
                            <p className="text-sm text-gray-500 mt-2">
                                This is where interactive animations will be displayed
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                        <button
                            className="btn-secondary"
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0}
                        >
                            ← Previous Step
                        </button>
                        <span className="text-gray-600 self-center">
                            Step {currentStep + 1} of {levelData.steps.length}
                        </span>
                        <button
                            className="btn-primary"
                            onClick={() => setCurrentStep(Math.min(levelData.steps.length - 1, currentStep + 1))}
                            disabled={currentStep === levelData.steps.length - 1}
                        >
                            Next Step →
                        </button>
                    </div>
                </div>

                {/* Pseudo-Code Area */}
                <div className="space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Pseudo-Code</h2>
                        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
                            {levelData.pseudoCode.map((line, index) => (
                                <div
                                    key={index}
                                    className={`py-1 px-2 ${index === currentStep ? 'bg-primary-600 rounded' : ''}`}
                                >
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Current Step</h2>
                        <p className="text-lg text-gray-700">{levelData.steps[currentStep]}</p>
                    </div>

                    <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                        <h3 className="font-semibold text-green-800 mb-2">💡 Tip</h3>
                        <p className="text-green-700">
                            Watch how each element is compared with its neighbor. This is the core of Bubble Sort!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LearningLevel
