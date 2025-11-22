import { NextResponse } from 'next/server';
import { generateMockData } from '@jira-mock/core';
import type { JiraMockConfig } from '@jira-mock/core';

export async function POST(request: Request) {
  try {
    const config: JiraMockConfig = await request.json();

    // Generate a small sample to preview - limit to first project with max 5 issues
    const sampleConfig: JiraMockConfig = {
      ...config,
      projects: config.projects.slice(0, 1).map((project) => ({
        ...project,
        issueCount: Math.min(project.issueCount, 5),
      })),
    };

    const { dataStore } = generateMockData(sampleConfig);

    const preview = {
      projects: dataStore.getAllProjects().map((p) => ({
        key: p.key,
        name: p.name,
      })),
      issues: dataStore.getAllIssues().map((i) => ({
        key: i.key,
        summary: i.fields.summary,
        projectKey: i.fields.project.key,
      })),
      users: dataStore.getAllUsers().slice(0, 3).map((u) => ({
        displayName: u.displayName,
        emailAddress: u.emailAddress,
      })),
      stats: dataStore.getStats(),
    };

    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
