'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { initMocks } from '@/lib/msw';
import type { JiraMockConfig } from '@jira-mock/core';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });
import 'swagger-ui-react/swagger-ui.css';

export default function Home() {
  const [mswReady, setMswReady] = useState(false);
  const [config, setConfig] = useState<JiraMockConfig | null>(null);
  const [stats, setStats] = useState<{ projects: number; issues: number } | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        // Fetch config
        const configRes = await fetch('/api/config');
        const configData = await configRes.json();
        setConfig(configData);

        // Initialize MSW
        const result = await initMocks();

        if (result) {
          const { dataStore } = result;
          setStats({
            projects: dataStore.getAllProjects().length,
            issues: dataStore.getAllIssues().length,
          });
        }

        setMswReady(true);
      } catch (error) {
        console.error('Failed to initialize:', error);
        setMswReady(true); // Still show UI even if init fails
      }
    }

    setup();
  }, []);

  return (
    <div>
      <div className="header">
        <h1>🎭 Jira Mock API Tester</h1>
        <p>Interactive OpenAPI interface powered by Mock Service Worker</p>

        {config && (
          <div className="config-info">
            <h3>📋 Current Configuration</h3>
            <div>
              Seed: <code>{config.globalDefaults?.seed || 'random'}</code> |
              Projects: <code>{config.projects.length}</code> |
              Total Issues: <code>{config.projects.reduce((sum, p) => sum + p.issueCount, 0)}</code>
            </div>
            {stats && (
              <div style={{ marginTop: '0.5rem' }}>
                Generated: <code>{stats.projects} projects</code> | <code>{stats.issues} issues</code>
              </div>
            )}
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Edit <code>jira-mock-config.json</code> and restart to change configuration
            </div>
          </div>
        )}
      </div>

      {!mswReady ? (
        <div className="loading">
          <div>🔄 Initializing Mock Service Worker...</div>
        </div>
      ) : (
        <SwaggerUI
          url="/api/openapi"
          deepLinking={true}
          displayRequestDuration={true}
          filter={true}
          tryItOutEnabled={true}
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          docExpansion="list"
          {...({ validatorUrl: null } as any)}
        />
      )}
    </div>
  );
}
