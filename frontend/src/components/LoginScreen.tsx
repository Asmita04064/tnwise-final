import React, { useState } from 'react';
import { Translation, User } from '../types';

interface LoginScreenProps {
  t: Translation;
  onLogin: (user: User) => void;
}

export default function LoginScreen({ t, onLogin }: LoginScreenProps) {
  const [isNew, setIsNew] = useState(false);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !password) {
      setError('Please fill in required fields');
      return;
    }
    if (isNew) {
      if (!name) {
        setError('Please provide your name');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match');
        return;
      }
    }
    setError(null);
    onLogin({ id, name, password });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center">
          {isNew ? 'Create account' : 'Login'}
        </h2>
        {isNew && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        )}
        <input
          type="text"
          placeholder="ID"
          value={id}
          onChange={e => setId(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        {isNew && (
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white py-2 rounded font-bold"
        >
          {isNew ? 'Create' : 'Login'}
        </button>
        <p className="text-center text-sm">
          {isNew ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsNew(prev => !prev);
              setError(null);
            }}
            className="text-emerald-600 underline"
          >
            {isNew ? 'Login' : 'Sign up'}
          </button>
        </p>
      </form>
    </div>
  );
}
