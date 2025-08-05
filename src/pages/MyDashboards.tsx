import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { LayoutDashboard, Clock, FileText, Loader2, Home } from 'lucide-react';

interface DashboardRecord {
  id: string;
  created_at: string;
  title: string;
  description: string;
}

const MyDashboards: React.FC = () => {
  const [dashboards, setDashboards] = useState<DashboardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboards = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('dashboards')
        .select('id, created_at, title, description')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dashboards:', error);
        setError('Could not fetch your saved dashboards. Please try again later.');
      } else {
        setDashboards(data);
      }
      setLoading(false);
    };

    fetchDashboards();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">My Saved Dashboards</h1>
            <Link to="/" className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm">
              <Home className="w-4 h-4" />
              <span>Hub</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-500" />
            <p className="mt-2 text-gray-600">Loading your dashboards...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        ) : dashboards.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <LayoutDashboard className="w-12 h-12 mx-auto text-gray-400" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">No dashboards saved yet</h2>
            <p className="mt-1 text-sm text-gray-500">
              <Link to="/dashboard" className="text-black font-medium hover:underline">Create a new dashboard</Link> to see it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map(d => (
              <Link
                key={d.id}
                to={`/dashboard/${d.id}`}
                className="group block p-6 bg-white rounded-lg border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-black transition-colors">{d.title}</h3>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2 flex items-start">
                  <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{d.description}</span>
                </p>
                <p className="text-xs text-gray-400 mt-4 flex items-center">
                  <Clock className="w-3 h-3 mr-1.5" />
                  Created on {new Date(d.created_at).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyDashboards;