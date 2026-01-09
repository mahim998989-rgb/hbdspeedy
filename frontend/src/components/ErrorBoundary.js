import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-pink-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white/10 backdrop-blur-md border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={32} className="text-red-400" />
              <h1 className="text-2xl font-black text-white">Oops! Something went wrong</h1>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-white/90 text-sm mb-2">
                We encountered an unexpected error. Don't worry, your data is safe!
              </p>
              <p className="text-white/70 text-xs">
                Error: {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            <Button
              onClick={this.handleReset}
              className="w-full bg-white text-red-600 hover:bg-gray-100 font-bold py-6 text-lg"
              data-testid="error-reset-btn"
            >
              🔄 Reload App
            </Button>

            <p className="text-white/60 text-xs text-center mt-4">
              If this problem persists, please contact support
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;