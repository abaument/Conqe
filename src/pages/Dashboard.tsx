import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Search, Filter, Download, MoreVertical, 
  CheckCircle, Clock, UserCheck, Star,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Lead } from '../types';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
};

const STATUS_ICONS = {
  new: Star,
  contacted: Clock,
  in_progress: UserCheck,
  converted: CheckCircle,
};

export function Dashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  // Fetch leads
  useEffect(() => {
    async function fetchLeads() {
      if (!user) return;

      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`);
      }

      if (statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }

      if (sourceFilter.length > 0) {
        query = query.in('source', sourceFilter);
      }

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }

      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching leads:', error);
        return;
      }

      setLeads(data as Lead[]);
      setLoading(false);
    }

    fetchLeads();
  }, [user, searchTerm, statusFilter, sourceFilter, dateRange]);

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (!error) {
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Company', 'Source', 'Status', 'Created At', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        lead.name,
        lead.email,
        lead.company,
        lead.source,
        lead.status,
        format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm:ss'),
        lead.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Lead Management</h1>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              className="border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              multiple={false}
              onChange={(e) => setStatusFilter(
                Array.from(e.target.selectedOptions, option => option.value)
              )}
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="in_progress">In Progress</option>
              <option value="converted">Converted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => {
              const StatusIcon = STATUS_ICONS[lead.status];
              return (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.email}
                        </div>
                        {lead.company && (
                          <div className="text-sm text-gray-500">
                            {lead.company}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{lead.source}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          STATUS_COLORS[lead.status]
                        }`}
                        onClick={() => {
                          const statuses: Lead['status'][] = ['new', 'contacted', 'in_progress', 'converted'];
                          const currentIndex = statuses.indexOf(lead.status);
                          const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                          handleStatusChange(lead.id, nextStatus);
                        }}
                      >
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {lead.status.replace('_', ' ')}
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(lead.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-900">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}