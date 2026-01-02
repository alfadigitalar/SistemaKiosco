import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center border border-slate-200 dark:border-slate-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-6">
              <AlertTriangle size={32} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Algo salió mal
            </h1>

            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Ha ocurrido un error inesperado en la aplicación. Por favor,
              intenta recargar la página.
            </p>

            {this.state.error && (
              <div className="text-left mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg overflow-auto max-h-40 border border-slate-200 dark:border-slate-700">
                <p className="font-mono text-xs text-red-500 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
