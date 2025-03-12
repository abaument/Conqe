import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { Bell, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Lead } from '../types';
import { useAuth } from '../context/AuthContext';

export function RecentLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }
    async function fetchRecentLeads() {
      if (!user) return;

      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'new')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recent leads:', error);
        return;
      }

      setLeads(data as Lead[]);
      setLoading(false);
    }

    fetchRecentLeads();

    // Subscribe to new leads
    const subscription = supabase
      .channel('recent_leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setLeads((currentLeads) => [payload.new as Lead, ...currentLeads]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Recent Leads</h1>
        <div className="relative">
          <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
          {leads.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {leads.length}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {leads.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No new leads in the past 7 days
          </div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Star className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {lead.name}
                    </div>
                    <div className="text-sm text-gray-500">{lead.email}</div>
                    {lead.company && (
                      <div className="text-sm text-gray-500">{lead.company}</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(lead.created_at), 'MMM d, h:mm a')}
                </div>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {lead.source}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}