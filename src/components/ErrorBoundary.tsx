import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 space-y-6 text-center">
          <AlertTriangle size={64} className="text-red-500" />
          <h1 className="text-2xl font-bold uppercase tracking-widest text-[#ff007f]">Algo salió mal</h1>
          <p className="text-white/50 max-w-md">
            Hubo un error inesperado al procesar la información. ¡No te preocupes! Pulsa el botón para restaurar la memoria de la app y recargar.
          </p>
          <button 
            onClick={() => {
              try { localStorage.clear(); } catch(e) {}
              window.location.reload();
            }}
            className="flex items-center gap-2 bg-[#ff007f] hover:bg-[#ff007f]/80 text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-wider transition-all"
          >
            <RefreshCcw size={18} />
            Restaurar y Recargar
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
