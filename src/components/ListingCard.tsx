import { MapPin, Calendar, Gauge, DollarSign } from 'lucide-react';
import type { Database } from '../lib/database.types';

type ListingInstance = Database['public']['Tables']['listing_instances']['Row'];

interface ListingCardProps {
  listing: ListingInstance & {
    car_model?: {
      make: string;
      model: string;
    };
  };
  distance?: number;
  onCreateLead?: (listingId: string) => void;
}

export function ListingCard({ listing, distance, onCreateLead }: ListingCardProps) {
  const images = (listing.images as string[]) || [];
  const formattedDate = new Date(listing.scraped_at).toLocaleDateString();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {images.length > 0 && (
        <div className="aspect-video bg-gray-200">
          <img
            src={images[0]}
            alt={`${listing.year} ${listing.car_model?.make} ${listing.car_model?.model}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {listing.year} {listing.car_model?.make} {listing.car_model?.model}
            </h3>
            <p className="text-sm text-gray-500">{listing.seller}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              ${listing.price.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4" />
            <span>{listing.mileage.toLocaleString()} mi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{listing.location}</span>
          </div>
          {distance && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{distance.toFixed(1)} mi away</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {listing.source_platform && (
          <p className="text-xs text-gray-500 mb-3">
            Source: {listing.source_platform}
          </p>
        )}

        <div className="flex gap-2">
          {listing.source_url && (
            <a
              href={listing.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium py-2.5 rounded-lg transition-colors text-center"
            >
              View Listing
            </a>
          )}
          {onCreateLead && (
            <button
              onClick={() => onCreateLead(listing.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Create Lead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
