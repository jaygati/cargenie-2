import { Car, Fuel, Users, Gauge } from 'lucide-react';
import type { Database } from '../lib/database.types';

type CarModel = Database['public']['Tables']['car_models']['Row'];

interface CarModelCardProps {
  model: CarModel;
  onShowDeals?: (modelId: string) => void;
}

export function CarModelCard({ model, onShowDeals }: CarModelCardProps) {
  const specs = model.specs as Record<string, any>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-xl text-gray-900">
            {model.make} {model.model}
          </h3>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {model.year_min}–{model.year_max}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide">
          {model.body_type}
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-5 leading-relaxed">
        {model.description}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-gray-700">{model.seats} seats</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <Fuel className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-gray-700 capitalize">{model.fuel_type}</span>
        </div>
        {model.mpg_city && model.mpg_highway && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 col-span-2">
            <Car className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">{model.mpg_city}/{model.mpg_highway} MPG</span>
          </div>
        )}
      </div>

      {specs && Object.keys(specs).length > 0 && (
        <div className="border-t border-gray-100 pt-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(specs).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex items-start gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 capitalize block">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-gray-900 font-semibold">{String(value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {onShowDeals && (
        <button
          onClick={() => onShowDeals(model.id)}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Show Available Deals
        </button>
      )}
    </div>
  );
}
