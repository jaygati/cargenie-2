import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Gauge, ExternalLink } from 'lucide-react';
import { useNavigate, useParams } from './router';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ListingInstance = Database['public']['Tables']['listing_instances']['Row'];
type CarModel = Database['public']['Tables']['car_models']['Row'];

export function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingInstance | null>(null);
  const [carModel, setCarModel] = useState<CarModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      const { data, error } = await supabase
        .from('listing_instances')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching listing:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setListing(data);

        if (data.car_model_id) {
          const { data: modelData } = await supabase
            .from('car_models')
            .select('*')
            .eq('id', data.car_model_id)
            .maybeSingle();

          if (modelData) {
            setCarModel(modelData);
          }
        }
      }

      setLoading(false);
    };

    fetchListing();
  }, [id]);

  const handleCreateLead = async () => {
    if (!listing) return;

    const trackedUrl = listing.source_url
      ? `${listing.source_url}?ref=cargenie&listing=${listing.id}`
      : `https://cargenie.app/listing/${listing.id}`;

    const { data, error } = await supabase
      .from('leads')
      .insert({
        listing_instance_id: listing.id,
        tracked_url: trackedUrl,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead. Please try again.');
      return;
    }

    navigate(`/lead/${data.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading listing...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Listing not found</p>
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

  const images = (listing.images as string[]) || [];
  const formattedDate = new Date(listing.scraped_at).toLocaleDateString();

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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {images.length > 0 && (
            <div className="aspect-video bg-gray-200">
              <img
                src={images[0]}
                alt={`${listing.year} ${carModel?.make} ${carModel?.model}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {listing.year} {carModel?.make} {carModel?.model}
                </h1>
                <p className="text-xl text-gray-600">{listing.seller}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-gray-900">
                  ${listing.price.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center gap-3">
                <Gauge className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Mileage</p>
                  <p className="font-semibold text-gray-900">
                    {listing.mileage.toLocaleString()} mi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold text-gray-900">{listing.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Listed</p>
                  <p className="font-semibold text-gray-900">{formattedDate}</p>
                </div>
              </div>
            </div>

            {carModel && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h2 className="font-semibold text-lg text-gray-900 mb-3">
                  About the {carModel.make} {carModel.model}
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {carModel.description}
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Body Type:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">
                      {carModel.body_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fuel Type:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">
                      {carModel.fuel_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Seats:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {carModel.seats}
                    </span>
                  </div>
                  {carModel.mpg_city && carModel.mpg_highway && (
                    <div>
                      <span className="text-gray-500">MPG:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {carModel.mpg_city}/{carModel.mpg_highway} city/hwy
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {listing.source_platform && (
              <p className="text-sm text-gray-500 mb-6">
                Source: {listing.source_platform}
              </p>
            )}

            <div className="flex gap-3">
              {listing.source_url && (
                <a
                  href={listing.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  View Original Listing
                </a>
              )}
              <button
                onClick={handleCreateLead}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Create Lead
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
