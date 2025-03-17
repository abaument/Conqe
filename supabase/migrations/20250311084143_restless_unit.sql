/* ------------------ */
/* Table des utilisateurs (users) */
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users,
  email text UNIQUE NOT NULL,
  company_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activer le RLS sur users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Autoriser les utilisateurs à lire uniquement leurs propres données
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

/* ------------------ */
/* Table des companies */
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  company_name text NOT NULL,
  address text,             
  city text,
  country text,             
  siret text,
  siren text,
  registration_number text,
  customer_email text,
  created_at timestamptz DEFAULT now()
);

-- Activer le RLS sur companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Autoriser les utilisateurs à lire uniquement leurs companies
CREATE POLICY "Users can read own companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Autoriser les utilisateurs à insérer leurs companies
CREATE POLICY "Users can insert own companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Autoriser les utilisateurs à mettre à jour leurs companies
CREATE POLICY "Users can update own companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX companies_user_id_idx ON companies(user_id);
CREATE INDEX companies_created_at_idx ON companies(created_at);


CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  source text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('new', 'contacted', 'in_progress', 'converted'))
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX leads_user_id_idx ON leads(user_id);
CREATE INDEX leads_created_at_idx ON leads(created_at);
