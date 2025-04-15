import React, { useState, useEffect } from 'react';

interface Language {
  id: number;
  name: string;
}

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('/api/words/languages');
        const data = await response.json();
        setLanguages(data.languages);
      } catch (err) {
        console.error('Failed to fetch languages:', err);
      }
    };
    fetchLanguages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear any previous errors

    try {
      const response = await fetch('/auth/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          reason,
          password,
          language,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 400 && data.detail === "Email already on the waitlist.") {
          setError('This email is already on our waitlist.');
        } else {
          setError(data.detail || 'Failed to submit waitlist entry');
        }
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting waitlist entry:', error);
      setError('There was an error submitting your waitlist entry. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You, {name}!</h2>
        <p className="text-gray-600 mb-4">
          You have successfully joined the waitlist. We'll notify you at {email} when your account is approved.
        </p>
        <p className="text-gray-500 text-sm">
          Make sure to check your email regularly, including your spam folder.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Join the Waitlist</h2>
      <p className="text-gray-600 mb-6">
        Be the first to know when we launch! Enter your details below to join the waitlist.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Your Name"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter a secure password"
            required
          />
        </div>
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
            Reason for Joining
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Why do you want to join?"
          />
        </div>
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700">
            Preferred Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select a language</option>
            {languages.map((lang) => (
              <option key={lang.id} value={lang.name}>{lang.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Join Waitlist
        </button>
      </form>
    </div>
  );
}