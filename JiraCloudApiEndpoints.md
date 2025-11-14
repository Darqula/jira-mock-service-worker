# Jira Cloud REST API Usage in This Project

This document lists Jira Cloud REST API endpoints used by the project (only those starting with `/rest/api/`). Each entry includes the HTTP method(s) observed in the codebase.

## Users and Permissions

- `GET /rest/api/2/myself`
- `GET /rest/api/2/user`
- `GET /rest/api/2/user/assignable/multiProjectSearch`
- `GET /rest/api/2/user/search`
- `GET /rest/api/2/user/search/query`
- `GET /rest/api/2/mypermissions`
- `GET /rest/api/2/user/properties/{propertyKey}`
- `PUT /rest/api/2/user/properties/{propertyKey}`
- `DELETE /rest/api/2/user/properties/{propertyKey}`

## Projects, Versions, Components, Properties

- `GET /rest/api/2/project`
- `GET /rest/api/2/project/search`
- `GET /rest/api/2/project/{projectId}`
- `GET /rest/api/2/project/{projectId}/properties`
- `GET /rest/api/2/project/{projectId}/properties/{propertyKey}`
- `PUT /rest/api/2/project/{projectId}/properties/{propertyKey}`
- `DELETE /rest/api/2/project/{projectId}/properties/{propertyKey}`
- `GET /rest/api/2/project/{projectId}/statuses`
- `GET /rest/api/2/project/{projectId}/versions`
- `POST /rest/api/2/version`
- `PUT /rest/api/2/version/{versionId}`
- `GET /rest/api/2/version/{versionId}`
- `POST /rest/api/2/version/{versionId}/removeAndSwap`
- `GET /rest/api/2/component`
- `GET /rest/api/2/component/page`

Project milestone operations reuse the project properties endpoint with a specific key:

- `GET /rest/api/2/project/{projectId}/properties/{JIRA_PROJECT_MILESTONE_PROPERTY}`
- `PUT /rest/api/2/project/{projectId}/properties/{JIRA_PROJECT_MILESTONE_PROPERTY}`
- `DELETE /rest/api/2/project/{projectId}/properties/{JIRA_PROJECT_MILESTONE_PROPERTY}`

keys:
JIRA_PROJECT_MILESTONE_PROPERTY = 'pwMilestone';


## Issue Types, Fields, Metadata

- `GET /rest/api/2/issuetype`
- `GET /rest/api/2/issuetype/project` (with `projectId` query parameter)
- `GET /rest/api/2/issuetype/page` (with `projectIds` query parameter)
- `GET /rest/api/2/field`
- `GET /rest/api/2/statuscategory`
- `GET /rest/api/2/priority`
- `GET /rest/api/2/issue/createmeta`
- `GET /rest/api/2/issue/createmeta/{projectId}/issuetypes`
- `GET /rest/api/2/issue/createmeta/{projectId}/issuetypes/{issueTypeId}`
- `GET /rest/api/2/issue/{issueId}/editmeta`
- `GET /rest/api/2/issue/{issueId}/transitions?expand=transitions.fields`
- `POST /rest/api/2/issue/{issueId}/transitions`

## Issues, Worklogs, Search

- `POST /rest/api/2/issue`
- `GET /rest/api/2/issue/{issueId}`
- `PUT /rest/api/2/issue/{issueId}`
- `DELETE /rest/api/2/issue/{issueId}`
- `GET /rest/api/2/issue/{issueId}/worklog`
- `POST /rest/api/2/issue/{issueId}/worklog`
- `PUT /rest/api/2/issue/{issueId}/worklog/{worklogId}`
- `DELETE /rest/api/2/issue/{issueId}/worklog/{worklogId}`
- `PUT /rest/api/2/issue/{issueId}/properties/{propertyKey}`
- `POST /rest/api/2/issue/properties/multi`
- `POST /rest/api/2/search/jql`
- `POST /rest/api/2/search/approximate-count`
- `GET /rest/api/2/issue/picker`
- `POST /rest/api/2/jql/match`
- `POST /rest/api/2/issueLink`
- `DELETE /rest/api/2/issueLink/{linkId}`

## Global Worklog Endpoints

- `GET /rest/api/2/worklog/updated`
- `POST /rest/api/2/worklog/list`
- `GET /rest/api/2/worklog/deleted`

## Filters, Labels, JQL Helpers

- `GET /rest/api/2/filter/{filterId}`
- `GET /rest/api/2/filter/search`
- `GET /rest/api/2/jql/autocompletedata/suggestions`
- `GET /rest/api/2/label`
