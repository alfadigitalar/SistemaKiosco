import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error crítico en UI:", error, errorInfo);
    // Aquí podrías enviar el error a un log en disco
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-lg text-center">
            <div className="mx-auto w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-red-500"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold mb-2">
              Se ha producido un error inesperado
            </h1>
            <p className="text-slate-400 mb-6">
              El sistema ha encontrado un problema crítico y necesita
              reiniciarse para garantizar la integridad de los datos.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-red-900/20"
            >
              Reiniciar Sistema
            </button>

            <div className="mt-6 p-4 bg-slate-950 rounded border border-slate-800 text-left overflow-auto max-h-32">
              <p className="font-mono text-xs text-red-400 break-all">
                {this.state.error?.toString()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
