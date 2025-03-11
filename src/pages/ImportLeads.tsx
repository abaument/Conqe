import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Upload, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Lead } from '../types';

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  dbColumn: string;
}

const DB_COLUMNS = ['name', 'email', 'company', 'source', 'status', 'notes'];

export function ImportLeads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

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

  const handleMapping = useCallback((csvColumn: string, dbColumn: string) => {
    setMappings((prev) => {
      const newMappings = prev.filter((m) => m.csvColumn !== csvColumn && m.dbColumn !== dbColumn);
      return [...newMappings, { csvColumn, dbColumn }];
    });
  }, []);

  const handleImport = async () => {
    if (!user) return;
    
    setImporting(true);
    setError('');

    try {
      const leads = csvData.map((row) => {
        const lead: Partial<Lead> = {
          user_id: user.id,
          status: 'new',
        };

        mappings.forEach(({ csvColumn, dbColumn }) => {
          if (dbColumn in lead) {
            (lead as any)[dbColumn] = row[csvColumn];
          }
        });

        return lead;
      });

      const { error: importError } = await supabase
        .from('leads')
        .insert(leads);

      if (importError) throw importError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError('Failed to import leads. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Import Leads</h1>

      <div className="bg-white shadow rounded-lg p-6">
        {!file ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Upload your CSV file to import leads</p>
            <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
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
                <h3 className="text-lg font-medium text-gray-900">
                  {file.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {csvData.length} records found
                </p>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Map Columns
              </h3>
              <div className="grid gap-4">
                {DB_COLUMNS.map((dbColumn) => (
                  <div key={dbColumn} className="flex items-center space-x-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {dbColumn}
                      </label>
                    </div>
                    <div className="w-2/3">
                      <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={mappings.find((m) => m.dbColumn === dbColumn)?.csvColumn || ''}
                        onChange={(e) => handleMapping(e.target.value, dbColumn)}
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
                    Leads imported successfully! Redirecting...
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || mappings.length === 0}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  importing || mappings.length === 0
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
                    Import Leads
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}