# OpenAPI Validation Test Results

## Summary

OpenAPI validation tests have been implemented to verify that mock API responses match the official Jira Cloud API specification (`jira_cloud_swagger.json`).

**Test Coverage**: 22 endpoint tests
**Passing**: 18 tests (82%)
**Failing**: 4 tests (18%)

## Implementation

### Validation Infrastructure

- **Library**: Ajv (JSON Schema validator) with format support
- **Validator**: `tests/helpers/openapi-validator.ts`
- **Tests**: `tests/openapi-validation.test.ts`

### How It Works

1. Loads the OpenAPI spec from `jira_cloud_swagger.json`
2. For each API endpoint test:
   - Makes a request to the mock endpoint
   - Extracts the response schema from the OpenAPI spec
   - Validates the response against the schema using Ajv
   - Reports any validation errors

## Test Results

### ✅ Passing Tests (18)

#### User Endpoints

- ✅ GET /rest/api/2/myself
- ✅ GET /rest/api/2/user
- ✅ GET /rest/api/2/user/search

#### Project Endpoints

- ✅ GET /rest/api/2/project/search
- ✅ GET /rest/api/2/project/{projectIdOrKey}
- ✅ GET /rest/api/2/project/{projectIdOrKey}/statuses

#### Issue Endpoints

- ✅ GET /rest/api/2/issue/{issueIdOrKey}
- ✅ POST /rest/api/2/issue
- ✅ PUT /rest/api/2/issue/{issueIdOrKey}

#### Search Endpoints

- ✅ GET /rest/api/2/search

#### Metadata Endpoints

- ✅ GET /rest/api/2/issuetype
- ✅ GET /rest/api/2/priority
- ✅ GET /rest/api/2/field
- ✅ GET /rest/api/2/statuscategory

#### Version Endpoints

- ✅ GET /rest/api/2/project/{projectIdOrKey}/versions

#### Component Endpoints

- ✅ GET /rest/api/2/project/{projectIdOrKey}/components

#### Permission Endpoints

- ✅ GET /rest/api/2/mypermissions

#### Transition Endpoints

- ✅ GET /rest/api/2/issue/{issueIdOrKey}/transitions

### ❌ Failing Tests (4)

#### 1. GET /rest/api/2/project

**Error**: Response type mismatch
**Expected**: Array of projects
**Received**: Paginated object `{ values: [], total, startAt, maxResults, isLast }`

**Cause**: The OpenAPI spec expects a simple array, but our implementation returns a paginated response object.

**Impact**: Low - The paginated format is more useful and matches `/project/search`

**Resolution Options**:

- **Option A**: Update mock to return array when no pagination params provided
- **Option B**: Document as intentional enhancement over spec
- **Option C**: Check if spec is outdated (Jira may have changed this endpoint)

#### 2. GET /rest/api/2/issue/picker

**Error**: 404 Not Found
**Expected**: 200 OK
**Received**: 404

**Cause**: Test missing required query parameters

**Impact**: Low - Endpoint is implemented, test needs fixing

**Resolution**: Update test to include proper query parameter

#### 3. GET /rest/api/2/issue/{issueIdOrKey}/worklog

**Error**: Additional properties in user objects
**Details**:

- `worklogs[].author` has additional properties
- `worklogs[].updateAuthor` has additional properties

**Cause**: Our User type includes more fields than the OpenAPI schema allows for the worklog author/updateAuthor context

**Impact**: Medium - Extra fields don't break functionality but violate strict schema

**Resolution**: Either:

- Filter user fields to match OpenAPI schema in worklog responses
- Document as enhancement (more detailed user info)

#### 4. POST /rest/api/2/issue/{issueIdOrKey}/worklog

**Error**: Additional properties in user objects
**Details**: Same as #3 above

## Validation Errors Found

### User Object Extra Properties

The OpenAPI spec defines a stricter user schema in certain contexts. Our mock returns a full `User` object with all properties, while the spec expects a subset.

**Extra properties being returned**:

- Likely: `locale`, `timeZone`, `groups`, or other extended user fields

**Recommendation**: Create context-specific user serializers that filter properties based on where the user object appears.

## Recommendations

### Short Term

1. ✅ Add OpenAPI validation to CI/CD pipeline
2. Fix issue/picker test (add query param)
3. Investigate and fix user object schema mismatches
4. Document the project endpoint format decision

### Medium Term

1. Expand coverage to all 73+ implemented endpoints
2. Add validation for error responses (4xx, 5xx)
3. Add validation for request bodies
4. Consider using OpenAPI code generation for type safety

### Long Term

1. Integrate with API evolution monitoring
2. Set up automated spec updates when Jira API changes
3. Add performance benchmarks alongside validation
4. Consider Prism or Dredd for enhanced contract testing

## Running the Tests

```bash
cd packages/msw-integration
npm test openapi-validation.test.ts
```

## Benefits of OpenAPI Validation

1. **Schema Drift Detection**: Catch when mocks diverge from real API
2. **Type Safety**: Ensure response structures match expectations
3. **Documentation**: Executable documentation of API compliance
4. **Regression Prevention**: Catch breaking changes early
5. **Confidence**: Higher confidence in mock accuracy

## Next Steps

1. Address the 4 failing tests
2. Add more endpoint coverage
3. Integrate into CI/CD
4. Document any intentional deviations from spec
