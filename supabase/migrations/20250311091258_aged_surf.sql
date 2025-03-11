/*
  # Add default superuser

  1. Changes
    - Insert default superuser into auth.users
    - Insert corresponding user data into public.users
    
  2. Default Credentials
    - Email: admin@leadtracker.com
    - Password: Admin123!
*/

-- Insert into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c9b06aec-3e3e-4e49-a891-a0f7f123123a',
  'authenticated',
  'authenticated',
  'admin@leadtracker.com',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert into public.users
INSERT INTO public.users (
  id,
  email,
  company_name,
  created_at
) VALUES (
  'c9b06aec-3e3e-4e49-a891-a0f7f123123a',
  'admin@leadtracker.com',
  'LeadTracker Admin',
  now()
) ON CONFLICT (id) DO NOTHING;