import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jira Mock API Tester',
  description: 'Test Jira API endpoints with OpenAPI interface and Mock Service Worker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
