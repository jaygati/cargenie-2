import { MessageCircle, Search, MapPin, Zap } from 'lucide-react';
import { useNavigate } from './router';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-gray-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageCircle className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">CarGenie</h1>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Start Chat
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Find Your Perfect Car
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Through Conversation</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Chat with our AI assistant to discover cars that match your needs.
            No filters, no endless scrolling—just natural conversation.
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl inline-flex items-center gap-3 transform hover:scale-105"
          >
            <MessageCircle className="w-6 h-6" />
            Start Finding Your Car
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-14 h-14 rounded-xl flex items-center justify-center mb-5 shadow-sm">
              <Search className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Smart Matching
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Tell us what you need in plain English. We match you to the best car models first.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-14 h-14 rounded-xl flex items-center justify-center mb-5 shadow-sm">
              <MapPin className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Local Inventory
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Once you find a match, we show you real deals available near you.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-14 h-14 rounded-xl flex items-center justify-center mb-5 shadow-sm">
              <Zap className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Quick Process
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Create a lead with one click and get tracked links to follow up on deals.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            How It Works
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-left">
            <div className="flex-1 max-w-xs">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">1</div>
              <h4 className="font-semibold text-gray-900 mb-1">Chat Naturally</h4>
              <p className="text-sm text-gray-600">
                Describe what you're looking for in your own words
              </p>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">2</div>
              <h4 className="font-semibold text-gray-900 mb-1">See Matches</h4>
              <p className="text-sm text-gray-600">
                Get 1–3 car models that fit your criteria
              </p>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">3</div>
              <h4 className="font-semibold text-gray-900 mb-1">Find Deals</h4>
              <p className="text-sm text-gray-600">
                Request local listings and create leads instantly
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-600 text-sm">
          <p>© 2024 CarGenie. Find your perfect car through conversation.</p>
        </div>
      </footer>
    </div>
  );
}
