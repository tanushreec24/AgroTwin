import React, { useState } from 'react';

export default function SettingsPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleReload = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/reload-models', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Models reloaded successfully!');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to reload models.');
      }
    } catch (e) {
      setStatus('error');
      setMessage('Network error.');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 border rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <button
        className="btn btn-primary mb-4"
        onClick={handleReload}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Reloading...' : 'Reload ML Models'}
      </button>
      {status !== 'idle' && (
        <div className={`mt-2 ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message}</div>
      )}
    </div>
  );
} 