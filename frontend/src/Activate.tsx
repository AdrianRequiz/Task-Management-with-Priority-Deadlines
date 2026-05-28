import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Activate() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const activateAccount = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/users/activation/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, token }),
        });
        if (response.ok) {
          setStatus('success');
          setMessage('Account activated! You can now log in.');
        } else {
          const data = await response.json();
          setStatus('error');
          setMessage(data.error || data.detail || 'Activation failed. Invalid link.');
        }
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };
    if (uid && token) activateAccount();
  }, [uid, token]);

  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center">Activating your account...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">
          {status === 'success' ? '✅ Activation Successful' : '❌ Activation Failed'}
        </h1>
        <p className="mb-6">{message}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}