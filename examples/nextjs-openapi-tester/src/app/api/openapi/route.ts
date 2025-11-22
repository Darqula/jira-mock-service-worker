import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface MockedEndpoint {
  path: string;
  methods: string[];
}

interface MockedEndpointsConfig {
  description: string;
  endpoints: MockedEndpoint[];
}

/**
 * Filters the OpenAPI spec to only include mocked endpoints.
 * This ensures the OpenAPI UI only shows endpoints that are actually handled by MSW.
 */
function filterOpenApiSpec(spec: any, mockedEndpoints: MockedEndpoint[]): any {
  const filteredSpec = { ...spec };
  const filteredPaths: any = {};

  // Create a map of normalized paths to their allowed methods
  const endpointMap = new Map<string, Set<string>>();

  for (const endpoint of mockedEndpoints) {
    // Normalize the path (OpenAPI uses {param} syntax)
    const normalizedPath = endpoint.path;
    endpointMap.set(normalizedPath, new Set(endpoint.methods.map(m => m.toLowerCase())));
  }

  // Filter the paths object
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    const allowedMethods = endpointMap.get(path);

    if (allowedMethods) {
      // This path is mocked - filter to only include mocked methods
      const filteredPathItem: any = {};

      for (const [method, operation] of Object.entries(pathItem as any)) {
        // Copy non-HTTP method properties (like parameters, servers, etc.)
        if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'].includes(method.toLowerCase())) {
          filteredPathItem[method] = operation;
        } else if (allowedMethods.has(method.toLowerCase())) {
          // Include this method as it's mocked
          filteredPathItem[method] = operation;
        }
      }

      // Only add the path if it has at least one HTTP method
      const hasMethods = Object.keys(filteredPathItem).some(key =>
        ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'].includes(key.toLowerCase())
      );

      if (hasMethods || Object.keys(filteredPathItem).length > 0) {
        filteredPaths[path] = filteredPathItem;
      }
    }
  }

  filteredSpec.paths = filteredPaths;

  // Update the spec description to indicate it's filtered
  if (filteredSpec.info) {
    filteredSpec.info.description =
      `${filteredSpec.info.description || 'Jira Cloud REST API'}\n\n**Note:** This specification is filtered to only show endpoints that are mocked with MSW in this project. To add more endpoints, update the \`mocked-endpoints.json\` configuration file.`;
  }

  return filteredSpec;
}

export async function GET() {
  try {
    // Read OpenAPI spec from project root
    const specPath = join(process.cwd(), '../../jira_cloud_swagger.json');
    const spec = readFileSync(specPath, 'utf-8');
    const openApiSpec = JSON.parse(spec);

    // Read mocked endpoints configuration
    const mockedEndpointsPath = join(process.cwd(), 'mocked-endpoints.json');
    const mockedEndpointsContent = readFileSync(mockedEndpointsPath, 'utf-8');
    const mockedEndpointsConfig: MockedEndpointsConfig = JSON.parse(mockedEndpointsContent);

    // Filter the spec to only include mocked endpoints
    const filteredSpec = filterOpenApiSpec(openApiSpec, mockedEndpointsConfig.endpoints);

    // Update the servers to point to the mock service
    filteredSpec.servers = [
      {
        url: 'https://your-domain.atlassian.net',
        description: 'Mocked Jira Cloud API',
      },
    ];

    return NextResponse.json(filteredSpec);
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
