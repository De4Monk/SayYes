import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full space-y-4">
                        <span className="material-symbols-outlined text-4xl text-red-500">error</span>
                        <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
                        <p className="text-sm text-gray-600">
                            The application encountered a critical error.
                        </p>
                        <div className="bg-gray-50 p-3 rounded text-left overflow-auto max-h-32 text-xs font-mono text-red-600 border border-red-100">
                            {this.state.error && this.state.error.toString()}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                        >
                            Reload App
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
