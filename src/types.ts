export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  status: 'new' | 'contacted' | 'in_progress' | 'converted';
  created_at: string;
  user_id: string;
  notes?: string;
  APE_code: string;
}

export interface User {
  id: string;
  email: string;
  company_name: string;
  APE_code: string;
}
