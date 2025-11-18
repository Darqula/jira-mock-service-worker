import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { JiraMockConfig } from '@jira-mock/core';

export async function GET() {
  try {
    // Read config from project root
    const configPath = join(process.cwd(), 'jira-mock-config.json');
    const configFile = readFileSync(configPath, 'utf-8');
    const config: JiraMockConfig = JSON.parse(configFile);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to read config:', error);

    // Return default config if file not found
    const defaultConfig: JiraMockConfig = {
      version: '1.0',
      seed: 42,
      projects: {
        count: 5,
        issuesPerProject: 20,
      },
    };

    return NextResponse.json(defaultConfig);
  }
}
