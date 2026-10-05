import React from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-lg w-full bg-[#101b30] border border-slate-700/80 rounded-[28px] p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-100">
                Itinerary View Encountered an Issue
              </h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                We encountered an unexpected issue while loading this trip's interactive map or itinerary. You can reload the view or return to your saved trips.
              </p>
              {this.state.error && (
                <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-left text-[11px] font-mono text-red-300 max-h-32 overflow-y-auto">
                  <strong>Error:</strong> {String(this.state.error?.message || this.state.error)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                <span>Reload Page</span>
              </button>

              <Link
                to="/my-trips"
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-[#0b1528] hover:bg-[#14233f] border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Back to Saved Trips</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
