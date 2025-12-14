import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console (or external service in future)
        console.error("Uncaught error in component tree:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        {/* Header with Pattern */}
                        <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px]"></div>
                            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4 z-10 animate-bounce">
                                <AlertTriangle className="h-10 w-10 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 z-10 text-center">
                                Oups ! Une erreur est survenue
                            </h2>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <p className="text-gray-600 text-center mb-8">
                                Nous sommes désolés, mais l'application a rencontré un problème inattendu.
                                Nos équipes techniques ont été notifiées.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={this.handleReload}
                                    className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2 group"
                                >
                                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                    Recharger la page
                                </button>

                                <button
                                    onClick={this.handleGoHome}
                                    className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                                >
                                    <Home className="w-5 h-5" />
                                    Retour à l'accueil
                                </button>
                            </div>

                            {/* Dev Details (Only in Dev) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="mt-8 p-4 bg-gray-100 rounded-lg overflow-auto max-h-48 text-xs font-mono text-gray-800 border border-gray-200">
                                    <p className="font-bold mb-2 text-red-600">{this.state.error.toString()}</p>
                                    <pre>{this.state.errorInfo?.componentStack}</pre>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 text-center text-xs text-gray-400 border-t border-gray-100">
                            Code d'erreur: UI_CRASH_HANDLER
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
