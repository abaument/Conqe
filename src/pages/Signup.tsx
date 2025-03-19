// src/pages/Signup.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Votre compte a été créé. Vous allez être redirigé vers la page de login.");
      // Redirection vers la page de login après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">Créer un compte</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input 
            id="email"
            type="email"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mot de passe
          </label>
          <input 
            id="password"
            type="password"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
        >
          {loading ? 'Inscription en cours...' : 'S’inscrire'}
        </button>
        {message && (
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        )}
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Vous avez déjà un compte ?{' '}
        <Link to="/login" className="text-indigo-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
