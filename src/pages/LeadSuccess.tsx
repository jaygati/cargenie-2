import { useEffect, useState } from 'react';
import { CheckCircle, Copy, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from './router';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Lead = Database['public']['Tables']['leads']['Row'];

export function LeadSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching lead:', error);
      } else {
        setLead(data);
      }

      setLoading(false);
    };

    fetchLead();
  }, [id]);

  const handleCopy = () => {
    if (lead?.tracked_url) {
      navigator.clipboard.writeText(lead.tracked_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Lead not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Chat
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Lead Created Successfully!
          </h1>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Your interest has been tracked. Use the link below to follow up on this vehicle.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Lead ID</p>
            <p className="font-mono text-sm text-gray-900 mb-4">{lead.id}</p>

            <p className="text-sm text-gray-500 mb-2">Tracked URL</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={lead.tracked_url}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700"
              />
              <button
                onClick={handleCopy}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Continue Chatting
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
