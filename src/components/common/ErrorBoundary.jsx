import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) { console.error('UI error:', error, info); }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold">Something broke</h1>
          <p className="mt-3 text-ink-300">The page hit an unexpected error. Your game is safe on the server, so reloading will bring you back.</p>
          <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-500">Reload</button>
        </div>
      </div>
    );
  }
}
