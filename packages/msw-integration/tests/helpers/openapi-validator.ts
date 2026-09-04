import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import type { OpenAPIV3 } from 'openapi-types';

interface ValidationError {
  path: string;
  message: string;
  schemaPath: string;
  keyword: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class OpenAPIValidator {
  private spec: OpenAPIV3.Document;
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction> = new Map();

  constructor(specPath: string) {
    // Load OpenAPI spec
    const specContent = readFileSync(specPath, 'utf-8');
    this.spec = JSON.parse(specContent) as OpenAPIV3.Document;

    // Initialize Ajv with options suitable for OpenAPI
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true,
      coerceTypes: false,
      removeAdditional: false,
    });

    // Add format validators (date-time, uri, email, etc.)
    addFormats(this.ajv);

    // Add schemas from OpenAPI components
    if (this.spec.components?.schemas) {
      for (const [name, schema] of Object.entries(this.spec.components.schemas)) {
        this.ajv.addSchema(schema, `#/components/schemas/${name}`);
      }
    }
  }

  /**
   * Validates a response against the OpenAPI spec
   */
  validateResponse(
    path: string,
    method: string,
    statusCode: number,
    response: unknown
  ): ValidationResult {
    const schema = this.getResponseSchema(path, method, statusCode);

    if (!schema) {
      return {
        valid: false,
        errors: [
          {
            path: '',
            message: `No schema found for ${method.toUpperCase()} ${path} ${statusCode}`,
            schemaPath: '',
            keyword: 'schema-not-found',
          },
        ],
      };
    }

    const validator = this.getValidator(path, method, statusCode, schema);
    const valid = validator(response);

    if (valid) {
      return { valid: true, errors: [] };
    }

    const errors: ValidationError[] = (validator.errors || []).map((error) => ({
      path: error.instancePath || '/',
      message: error.message || 'Validation error',
      schemaPath: error.schemaPath || '',
      keyword: error.keyword,
    }));

    return { valid: false, errors };
  }

  /**
   * Get or create a cached validator for a specific response
   */
  private getValidator(
    path: string,
    method: string,
    statusCode: number,
    schema: object
  ): ValidateFunction {
    const key = `${method}:${path}:${statusCode}`;

    if (!this.validators.has(key)) {
      const validator = this.ajv.compile(schema);
      this.validators.set(key, validator);
    }

    return this.validators.get(key)!;
  }

  /**
   * Extracts the response schema from the OpenAPI spec
   */
  private getResponseSchema(path: string, method: string, statusCode: number): object | null {
    // Normalize path (remove query params, handle path params)
    const normalizedPath = this.normalizePath(path);

    // Find matching path in spec
    const pathItem = this.findPathItem(normalizedPath);
    if (!pathItem) {
      return null;
    }

    // Get operation (GET, POST, etc.)
    const operation = pathItem[method.toLowerCase() as keyof OpenAPIV3.PathItemObject] as
      OpenAPIV3.OperationObject | undefined;

    if (!operation || !operation.responses) {
      return null;
    }

    // Get response for status code (try exact match, then 'default')
    const responseKey = statusCode.toString();
    const response =
      (operation.responses[responseKey] as OpenAPIV3.ResponseObject) ||
      (operation.responses.default as OpenAPIV3.ResponseObject);

    if (!response) {
      return null;
    }

    // Extract schema from response content (application/json)
    const content = response.content?.['application/json'];
    if (!content?.schema) {
      return null;
    }

    return this.resolveSchema(content.schema);
  }

  /**
   * Normalizes a path by removing query params
   */
  private normalizePath(path: string): string {
    return path.split('?')[0];
  }

  /**
   * Finds a path item in the spec, handling path parameters
   */
  private findPathItem(path: string): OpenAPIV3.PathItemObject | null {
    if (!this.spec.paths) {
      return null;
    }

    // Try exact match first
    if (this.spec.paths[path]) {
      return this.spec.paths[path] as OpenAPIV3.PathItemObject;
    }

    // Try matching with path parameters
    for (const [specPath, pathItem] of Object.entries(this.spec.paths)) {
      if (this.pathMatches(path, specPath)) {
        return pathItem as OpenAPIV3.PathItemObject;
      }
    }

    return null;
  }

  /**
   * Checks if a path matches a spec path template
   */
  private pathMatches(actualPath: string, specPath: string): boolean {
    // Convert spec path template to regex
    // e.g., /rest/api/2/issue/{issueIdOrKey} -> /rest/api/2/issue/[^/]+
    const regexPattern = '^' + specPath.replace(/\{[^}]+\}/g, '[^/]+').replace(/\//g, '\\/') + '$';

    return new RegExp(regexPattern).test(actualPath);
  }

  /**
   * Resolves schema references ($ref)
   */
  private resolveSchema(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): object {
    if ('$ref' in schema) {
      const refPath = schema.$ref;
      if (refPath.startsWith('#/components/schemas/')) {
        const schemaName = refPath.replace('#/components/schemas/', '');
        const resolvedSchema = this.spec.components?.schemas?.[schemaName];
        if (resolvedSchema) {
          return this.resolveSchema(resolvedSchema);
        }
      }
      // Return the reference as-is for Ajv to resolve
      return { $ref: refPath };
    }
    return schema as object;
  }

  /**
   * Gets a list of all paths and methods defined in the spec
   */
  getEndpoints(): Array<{ path: string; method: string; statusCodes: number[] }> {
    const endpoints: Array<{ path: string; method: string; statusCodes: number[] }> = [];

    if (!this.spec.paths) {
      return endpoints;
    }

    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;

      for (const method of methods) {
        const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
        if (operation && operation.responses) {
          const statusCodes = Object.keys(operation.responses)
            .filter((key) => key !== 'default' && /^\d+$/.test(key))
            .map((key) => parseInt(key, 10));

          endpoints.push({
            path,
            method: method.toUpperCase(),
            statusCodes,
          });
        }
      }
    }

    return endpoints;
  }
}
