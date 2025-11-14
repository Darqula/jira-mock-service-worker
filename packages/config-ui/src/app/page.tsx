'use client';

import { ConfigEditor } from '@/components/ConfigEditor';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Jira Mock Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Configure mock data generation for Jira Cloud API testing
          </p>
        </div>
        <ConfigEditor />
      </div>
    </main>
  );
}
