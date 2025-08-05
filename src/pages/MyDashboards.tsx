import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { LayoutDashboard, Clock, FileText, Loader2, Home, Trash2 } from 'lucide-react';

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

  const handleDelete = async (dashboardId: string) => {
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this dashboard? This action cannot be undone.'
    );

    if (isConfirmed) {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', dashboardId);

      if (error) {
        console.error('Error deleting dashboard:', error);
        setError('Could not delete the dashboard. Please try again.');
      } else {
        setDashboards(prevDashboards =>
          prevDashboards.filter(d => d.id !== dashboardId)
        );
      }
    }
  };

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
              <div
                key={d.id}
                className="group relative p-6 bg-white rounded-lg border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300"
              >
                <Link to={`/dashboard/${d.id}`} className="block space-y-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-black transition-colors pr-8">{d.title}</h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2 flex items-start">
                      <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{d.description}</span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 pt-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1.5" />
                    Created on {new Date(d.created_at).toLocaleString()}
                  </p>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(d.id);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 text-gray-500 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Delete dashboard"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyDashboards;