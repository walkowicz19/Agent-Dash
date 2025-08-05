import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, PlusCircle, LayoutDashboard } from 'lucide-react';

const Hub: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <div className="inline-block p-4 bg-black rounded-2xl mb-4">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Agent Dash</h1>
        <p className="text-lg text-gray-600 mt-2">Your AI assistant for creating interactive dashboards.</p>
      </div>

      <div className="w-full max-w-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/dashboard"
          className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300"
        >
          <PlusCircle className="w-8 h-8 text-gray-400 group-hover:text-black transition-colors" />
          <h2 className="text-lg font-semibold text-gray-900 mt-4">Create New Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Start from scratch with your data files.</p>
        </Link>

        <Link
          to="/my-dashboards"
          className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300"
        >
          <LayoutDashboard className="w-8 h-8 text-gray-400 group-hover:text-black transition-colors" />
          <h2 className="text-lg font-semibold text-gray-900 mt-4">My Saved Dashboards</h2>
          <p className="text-sm text-gray-500 mt-1">View and edit your previous creations.</p>
        </Link>
      </div>
    </div>
  );
};

export default Hub;