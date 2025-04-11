import React from 'react';
import { Link } from 'react-router-dom';

export function Welcome() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to KhoaiLang
        </h1>
        <p className="text-xl text-gray-600">
          Your smart language learning companion
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/login"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Login</h2>
          <p className="text-gray-600">
            Already have an account? Sign in to continue your learning journey.
          </p>
        </Link>

        <Link
          to="/waitlist"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Join Waitlist</h2>
          <p className="text-gray-600">
            New to KhoaiLang? Join our waitlist to get early access.
          </p>
        </Link>
      </div>
    </div>
  );
}