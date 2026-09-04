import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jira Mock Configuration',
  description: 'Configure mock data generation for Jira Cloud API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
