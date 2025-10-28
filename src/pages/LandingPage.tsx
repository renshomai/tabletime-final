import { Clock } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: 'login' | 'register') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-white border-b border-[#f0e8d8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-0 sm:h-16">
            <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-0 sm:justify-start">
              <Clock className="h-8 w-8 text-cyan" />
              <span className="text-2xl font-display text-[#111]">TableTime</span>
            </div>
            <div className="flex space-x-4 justify-center sm:justify-end">
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-[#444] hover:text-[#111] transition-colors font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-6 py-2 bg-cyan text-white rounded-xl hover:bg-cyan-dark transition-all font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-display text-[#111] mb-6 leading-tight">
              Smart Queue Management
              <br />
              <span className="text-cyan">Powered by AI</span>
            </h1>
            <p className="text-xl text-[#444] mb-8 max-w-2xl mx-auto">
              Eliminate waiting room crowding with digital queues and AI-powered wait time
              predictions. Give your customers the freedom to wait anywhere.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="px-8 py-4 bg-cyan text-white rounded-xl hover:bg-cyan-dark transition-all text-lg font-semibold"
            >
              Join Queue Now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
