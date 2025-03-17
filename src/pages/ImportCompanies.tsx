// src/pages/ImportCompanies.tsx
import React, { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  dbColumn: string;
}

// Colonnes attendues par la table `companies`
const DB_COLUMNS = [
  { key: 'company_name', label: 'Company Name' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country (ISO2)' },
  { key: 'siret', label: 'Siret' },
  { key: 'siren', label: 'Siren' },
  { key: 'registration_number', label: 'Registration Number' },
  { key: 'customer_email', label: 'Customer Email' },
];

export function ImportCompanies() {
  const { user } = useAuth();

  // État pour l'import CSV
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // État pour l'affichage en tableau
  const [companies, setCompanies] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Calcul de l'offset et du nombre de pages
  const offset = (page - 1) * pageSize;
  const maxPage = Math.ceil(totalCount / pageSize);

  /**
   * Fonction pour récupérer la liste des companies de l'utilisateur connecté,
   * en tenant compte de la pagination (page, pageSize).
   */
  const fetchCompanies = useCallback(async () => {
    if (!user) return;

    setError('');
    try {
      // Récupération avec count et pagination
      const { data, error, count } = await supabase
        .from('companies')
        .select('*', { count: 'exact' }) // pour obtenir le totalCount
        .eq('user_id', user.id)
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) {
        setError('Error fetching companies: ' + error.message);
      } else {
        setCompanies(data || []);
        setTotalCount(count || 0);
      }
    } catch (err: any) {
      setError('Error fetching companies: ' + err.message);
    }
  }, [user, offset, pageSize]);

  /**
   * useEffect pour recharger la liste chaque fois que
   * l'utilisateur, la page ou la pageSize changent.
   */
  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user, page, pageSize, fetchCompanies]);

  /**
   * Gestion de l'upload CSV et parsing via PapaParse
   */
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFile(file);
    setError('');
    setSuccess(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCSVData(results.data as CSVRow[]);
        setHeaders(Object.keys(results.data[0] || {}));
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
      },
    });
  }, []);

  /**
   * Associer une colonne CSV à une colonne DB
   */
  const handleMapping = useCallback((csvColumn: string, dbColumn: string) => {
    setMappings((prev) => {
      const newMappings = prev.filter((m) => m.csvColumn !== csvColumn && m.dbColumn !== dbColumn);
      return [...newMappings, { csvColumn, dbColumn }];
    });
  }, []);

  /**
   * Importer les données CSV dans la DB
   */
  const handleImport = async () => {
    if (!user) return;

    setImporting(true);
    setError('');

    try {
      // Construction des objets companies à partir du CSV
      const companiesToImport = csvData.map((row) => {
        const company: any = {};
        mappings.forEach(({ csvColumn, dbColumn }) => {
          const value = row[csvColumn];
          company[dbColumn] = value && value.trim() !== '' ? value : null;
        });
        // Associer à l'utilisateur
        company.user_id = user.id;
        return company;
      });

      // Insertion en base
      const { error: importError } = await supabase
        .from('companies')
        .insert(companiesToImport);

      if (importError) throw importError;

      setSuccess(true);

      // Réinitialiser l'import
      setFile(null);
      setCSVData([]);
      setHeaders([]);
      setMappings([]);

      // Recharger la liste pour voir les nouveaux enregistrements
      await fetchCompanies();
    } catch (err: any) {
      setError('Failed to import companies. Please try again.');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  /**
   * Changer la taille de page (10, 50, 100)
   */
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // On revient à la page 1 lorsqu'on change la taille
  };

  /**
   * Affichage du footer de pagination
   */
  const renderPaginationFooter = () => {
    // Calcul des bornes d'affichage
    const from = offset + 1;
    const to = offset + companies.length;

    return (
      <div className="flex items-center justify-between mt-4">
        {/* Indication du nombre d'éléments */}
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{from}</span> to{' '}
          <span className="font-medium">{to}</span> of{' '}
          <span className="font-medium">{totalCount}</span> results
        </p>
        {/* Contrôles de pagination */}
        <div className="flex space-x-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1}
            className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((prev) => (prev < maxPage ? prev + 1 : prev))}
            disabled={page >= maxPage}
            className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  /**
   * Si des companies existent, on affiche le tableau + pagination.
   * Sinon, on affiche l'interface d'importation CSV.
   */
  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Import Companies</h1>

      {companies.length > 0 ? (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mes Companies Importées</h2>
            {/* Sélecteur de pageSize */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Show:</span>
              <select
                className="border-gray-300 rounded text-sm"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 table-auto border border-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 font-medium text-gray-600">Nom</th>
                  <th className="px-2 py-2 font-medium text-gray-600">Adresse</th>
                  <th className="px-2 py-2 font-medium text-gray-600">Ville</th>
                  <th className="px-2 py-2 font-medium text-gray-600">Pays</th>
                  <th className="px-2 py-2 font-medium text-gray-600">Email</th>
                  <th className="px-2 py-2 font-medium text-gray-600">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company, index) => (
                  <tr
                    key={company.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-2 py-1 whitespace-nowrap">{company.company_name}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{company.address}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{company.city}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{company.country}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{company.customer_email}</td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      {new Date(company.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer de pagination */}
          {renderPaginationFooter()}

          {/* Bouton pour revenir à l'import (optionnel) */}
          <button
            type="button"
            onClick={() => {
              setCompanies([]);
              setFile(null);
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Importer d'autres companies
          </button>
        </div>
      ) : (
        // Interface d'importation
        <div className="bg-white shadow rounded-lg p-6">
          {!file ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Upload your CSV file to import companies</p>
              <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
                Choose File
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{file.name}</h3>
                  <p className="text-sm text-gray-500">{csvData.length} records found</p>
                </div>
                <label className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                  Change File
                </label>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Map Columns</h3>
                <div className="grid gap-4">
                  {DB_COLUMNS.map((column) => (
                    <div key={column.key} className="flex items-center space-x-4">
                      <div className="w-1/3">
                        <label className="block text-sm font-medium text-gray-700">
                          {column.label}
                        </label>
                      </div>
                      <div className="w-2/3">
                        <select
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          value={mappings.find((m) => m.dbColumn === column.key)?.csvColumn || ''}
                          onChange={(e) => handleMapping(e.target.value, column.key)}
                        >
                          <option value="">Select a column</option>
                          {headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="ml-3 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <p className="ml-3 text-sm text-green-700">
                      Companies imported successfully!
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    importing
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {importing ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      Import Companies
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
