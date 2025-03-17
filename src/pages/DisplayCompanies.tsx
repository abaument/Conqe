// src/pages/DisplayCompanies.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function DisplayCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchCompanies() {
      if (!user) return;
      setLoading(true);
      setError('');

      // Filtrage par user_id pour récupérer uniquement les companies de l'utilisateur connecté
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError("Error fetching companies: " + error.message);
      } else {
        setCompanies(data || []);
      }
      setLoading(false);
    }
    fetchCompanies();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-semibold mb-4">Mes Companies Importées</h2>
      {loading && <p>Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && companies.length === 0 && <p>Aucune company trouvée.</p>}
      {!loading && !error && companies.length > 0 && (
        <ul className="space-y-2">
          {companies.map((company) => (
            <li key={company.id} className="border p-2 rounded">
              <p><strong>Nom :</strong> {company.company_name}</p>
              <p><strong>Adresse :</strong> {company.address}</p>
              <p><strong>Ville :</strong> {company.city}</p>
              <p><strong>Pays :</strong> {company.country}</p>
              <p><strong>Email :</strong> {company.customer_email}</p>
              <p><strong>Créé le :</strong> {new Date(company.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
