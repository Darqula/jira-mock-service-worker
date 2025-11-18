import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read OpenAPI spec from project root
    const specPath = join(process.cwd(), '../../jira_cloud_swagger.json');
    const spec = readFileSync(specPath, 'utf-8');
    const openApiSpec = JSON.parse(spec);

    // Update the servers to point to the mock service
    openApiSpec.servers = [
      {
        url: 'https://your-domain.atlassian.net',
        description: 'Mocked Jira Cloud API',
      },
    ];

    return NextResponse.json(openApiSpec);
  } catch (error) {
    console.error('Failed to read OpenAPI spec:', error);

    // Return a minimal spec if file not found
    return NextResponse.json({
      openapi: '3.0.0',
      info: {
        title: 'Jira Cloud API',
        version: '1.0.0',
        description: 'Error loading OpenAPI specification',
      },
      servers: [
        {
          url: 'https://your-domain.atlassian.net',
          description: 'Mocked Jira Cloud API',
        },
      ],
      paths: {},
    });
  }
}
