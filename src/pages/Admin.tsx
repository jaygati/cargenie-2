import { useEffect, useState } from 'react';
import { Users, Package, TrendingUp, ArrowLeft, Database as DatabaseIcon } from 'lucide-react';
import { useNavigate } from './router';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Lead = Database['public']['Tables']['leads']['Row'];
type Partner = Database['public']['Tables']['partners']['Row'];
type ListingInstance = Database['public']['Tables']['listing_instances']['Row'];
type CarModel = Database['public']['Tables']['car_models']['Row'];

export function Admin() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [listingsCount, setListingsCount] = useState(0);
  const [carModelsCount, setCarModelsCount] = useState(0);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [showCarModels, setShowCarModels] = useState(false);
  const [carModelsSearch, setCarModelsSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [leadsResult, partnersResult, listingsResult, carModelsResult, carModelsDataResult] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('partners').select('*'),
      supabase.from('listing_instances').select('id', { count: 'exact', head: true }),
      supabase.from('car_models').select('id', { count: 'exact', head: true }),
      supabase.from('car_models').select('*').order('make', { ascending: true }).order('model', { ascending: true }),
    ]);

    if (leadsResult.data) setLeads(leadsResult.data);
    if (partnersResult.data) setPartners(partnersResult.data);
    if (listingsResult.count !== null) setListingsCount(listingsResult.count);
    if (carModelsResult.count !== null) setCarModelsCount(carModelsResult.count);
    if (carModelsDataResult.data) setCarModels(carModelsDataResult.data);

    setLoading(false);
  };

  const handleScrapeDatabase = async () => {
    setScraping(true);
    setScrapeMessage('Starting database population...');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-car-models`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to populate database');
      }

      const result = await response.json();

      if (result.success) {
        setScrapeMessage(`Success! Added models. Initial: ${result.initialCount}, Final: ${result.finalCount}`);
        await fetchData();
      } else {
        setScrapeMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Scrape error:', error);
      setScrapeMessage('Failed to populate database. Please try again.');
    } finally {
      setScraping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Total Leads</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{leads.length}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Active Listings</h3>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{listingsCount}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Car Models</h3>
              <DatabaseIcon className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{carModelsCount}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Partners</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{partners.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Management</h2>
          <p className="text-gray-600 mb-4">
            Current car models: <span className="font-bold">{carModelsCount}</span> / 1500 (target)
          </p>
          <button
            onClick={handleScrapeDatabase}
            disabled={scraping || carModelsCount >= 1500}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none font-medium"
          >
            {scraping ? 'Populating Database...' : carModelsCount >= 1500 ? 'Database Full (1500 models)' : 'Populate Database with Real Cars'}
          </button>
          {scrapeMessage && (
            <p className={`mt-4 text-sm ${scrapeMessage.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
              {scrapeMessage}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Car Models</h2>
            <button
              onClick={() => setShowCarModels(!showCarModels)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {showCarModels ? 'Hide' : 'Show All Models'}
            </button>
          </div>
          {showCarModels && (
            <div>
              <input
                type="text"
                placeholder="Search by make or model..."
                value={carModelsSearch}
                onChange={(e) => setCarModelsSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Make</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Model</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Year Range</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Seats</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Fuel</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">MSRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {carModels
                      .filter(
                        (model) =>
                          carModelsSearch === '' ||
                          model.make.toLowerCase().includes(carModelsSearch.toLowerCase()) ||
                          model.model.toLowerCase().includes(carModelsSearch.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((model) => (
                        <tr key={model.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{model.make}</td>
                          <td className="px-4 py-3 text-gray-700">{model.model}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {model.year_min}-{model.year_max}
                          </td>
                          <td className="px-4 py-3 text-gray-600 capitalize">{model.body_type}</td>
                          <td className="px-4 py-3 text-gray-600">{model.seats}</td>
                          <td className="px-4 py-3 text-gray-600 capitalize">{model.fuel_type}</td>
                          <td className="px-4 py-3 text-right text-gray-900 font-medium">
                            ${model.specs && typeof model.specs === 'object' && 'msrp' in model.specs
                              ? (model.specs as any).msrp.toLocaleString()
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {carModelsSearch && carModels.filter(
                  (model) =>
                    model.make.toLowerCase().includes(carModelsSearch.toLowerCase()) ||
                    model.model.toLowerCase().includes(carModelsSearch.toLowerCase())
                ).length === 0 && (
                  <p className="text-center text-gray-500 py-8">No models found matching your search</p>
                )}
                {!carModelsSearch && carModels.length > 50 && (
                  <p className="text-center text-gray-500 py-4 text-sm">
                    Showing first 50 of {carModels.length} models. Use search to find specific models.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Leads</h2>
            {leads.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No leads yet</p>
            ) : (
              <div className="space-y-3">
                {leads.map(lead => (
                  <div key={lead.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-mono text-gray-600 mb-1">
                          ID: {lead.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(lead.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.status === 'new'
                            ? 'bg-blue-100 text-blue-700'
                            : lead.status === 'contacted'
                            ? 'bg-yellow-100 text-yellow-700'
                            : lead.status === 'closed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                    {lead.user_email && (
                      <p className="text-sm text-gray-700">{lead.user_email}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Partners</h2>
            {partners.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No partners yet</p>
            ) : (
              <div className="space-y-3">
                {partners.map(partner => (
                  <div key={partner.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {partner.name}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize mb-2">
                          {partner.type}
                        </p>
                        {partner.contact_email && (
                          <p className="text-xs text-gray-500">{partner.contact_email}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          partner.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {partner.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {partner.commission_rate > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        Commission: {partner.commission_rate}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
