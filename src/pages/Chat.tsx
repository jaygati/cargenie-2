import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { ChatMessage } from '../components/ChatMessage';
import { CarModelCard } from '../components/CarModelCard';
import { ListingCard } from '../components/ListingCard';
import { UserAuthModal, type UserData } from '../components/UserAuthModal';
import { supabase } from '../lib/supabase';
import { useNavigate } from './router';
import type { Database } from '../lib/database.types';

type CarModel = Database['public']['Tables']['car_models']['Row'];
type ListingInstance = Database['public']['Tables']['listing_instances']['Row'];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  models?: CarModel[];
  listings?: (ListingInstance & { car_model?: { make: string; model: string } })[];
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you find the perfect car. What are you looking for? Tell me about your needs—like seating, fuel type, or what you'll use it for.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pendingModelId, setPendingModelId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callAIAssistant = async (userMessage: string) => {
    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    return await response.json();
  };

  const findListings = async (modelId: string, location?: string) => {
    let query = supabase
      .from('listing_instances')
      .select('*, car_models!inner(make, model)')
      .eq('car_model_id', modelId)
      .eq('status', 'active')
      .limit(5);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return [];
    }

    return data.map(item => ({
      ...item,
      car_model: item.car_models as unknown as { make: string; model: string },
    }));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const inputLower = input.toLowerCase();

      if (inputLower.includes('deal') || inputLower.includes('listing') || inputLower.includes('buy') || inputLower.includes('show available')) {
        const lastModelMessage = [...messages].reverse().find(m => m.models && m.models.length > 0);
        if (lastModelMessage?.models?.[0]) {
          const listings = await findListings(lastModelMessage.models[0].id);

          if (listings.length > 0) {
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: `Found ${listings.length} available listings for the ${lastModelMessage.models![0].make} ${lastModelMessage.models![0].model}. These are real deals I've found:`,
                listings,
              },
            ]);
          } else {
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: "I couldn't find any active listings for this model right now. Try searching for a different model or check back later!",
              },
            ]);
          }
        } else {
          const aiResponse = await callAIAssistant(input);
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: aiResponse.message,
              models: aiResponse.models || [],
            },
          ]);
        }
      } else {
        const aiResponse = await callAIAssistant(input);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: aiResponse.message,
            models: aiResponse.models || [],
          },
        ]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I encountered an error. Please try again!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDeals = async (modelId: string) => {
    if (!userData) {
      setPendingModelId(modelId);
      setShowAuthModal(true);
      return;
    }

    await proceedWithShowingDeals(modelId);
  };

  const proceedWithShowingDeals = async (modelId: string) => {
    setIsLoading(true);
    try {
      const listings = await findListings(modelId);
      const model = messages.flatMap(m => m.models || []).find(m => m.id === modelId);

      if (listings.length > 0 && model) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Found ${listings.length} available listings for the ${model.make} ${model.model}:`,
            listings,
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "I don't have any active listings for this model in my database right now. This is because listings need to be added manually or through a listing import system. However, I can still help you research this model and answer questions about it!",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAuthSubmit = async (data: UserData) => {
    setUserData(data);
    if (pendingModelId) {
      await proceedWithShowingDeals(pendingModelId);
      setPendingModelId(null);
    }
  };

  const handleCreateLead = async (listingId: string) => {
    try {
      const listing = messages.flatMap(m => m.listings || []).find(l => l.id === listingId);
      if (!listing) return;

      const trackedUrl = listing.source_url
        ? `${listing.source_url}?ref=cargenie&listing=${listingId}`
        : `https://cargenie.app/listing/${listingId}`;

      const leadData: any = {
        listing_instance_id: listingId,
        tracked_url: trackedUrl,
        status: 'new',
      };

      if (userData) {
        leadData.first_name = userData.firstName;
        leadData.last_name = userData.lastName;
        leadData.email = userData.email;
        leadData.phone = userData.phone;
        leadData.location = userData.location;
        leadData.budget_min = userData.budgetMin;
        leadData.budget_max = userData.budgetMax;
        leadData.preferred_contact_method = userData.preferredContact;
      }

      const { data, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Lead created! Your tracked link: ${trackedUrl}\n\nLead ID: ${data.id}\n\nYou can use this link to track your interest in this vehicle.`,
        },
      ]);
    } catch (error) {
      console.error('Error creating lead:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't create a lead right now. Please try again.",
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">CarGenie</h1>
        <div className="ml-auto">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div key={index} className="space-y-5">
              <ChatMessage role={message.role} content={message.content} />
              {message.models && message.models.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                  {message.models.map(model => (
                    <CarModelCard
                      key={model.id}
                      model={model}
                      onShowDeals={handleShowDeals}
                    />
                  ))}
                </div>
              )}
              {message.listings && message.listings.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {message.listings.map(listing => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onCreateLead={handleCreateLead}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Describe what you're looking for..."
            className="flex-1 px-5 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm text-[15px]"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3.5 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSubmit={handleUserAuthSubmit}
      />
    </div>
  );
}
