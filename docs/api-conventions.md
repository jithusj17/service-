# API Conventions

## Base URL

```
http://localhost:3001/api/v1
```

## Versioning

URI-based versioning: `/api/v1/...`, `/api/v2/...`

## Response Envelope

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": ["email must be a valid email"]
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## HTTP Methods

| Method | Usage |
|--------|-------|
| `GET` | Retrieve resource(s) |
| `POST` | Create a resource |
| `PUT` | Full update of a resource |
| `PATCH` | Partial update of a resource |
| `DELETE` | Remove a resource |

## Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `204` | No content (successful delete) |
| `400` | Bad request / validation error |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not found |
| `409` | Conflict |
| `422` | Unprocessable entity |
| `429` | Too many requests |
| `500` | Internal server error |

## Naming Conventions

- **Endpoints**: Plural nouns, kebab-case → `/api/v1/service-providers`
- **Query params**: camelCase → `?sortBy=createdAt&orderBy=desc`
- **Request/Response body**: camelCase
- **Database columns**: snake_case (Prisma maps automatically)

## Pagination

Query parameters:
- `page` (default: 1, min: 1)
- `limit` (default: 20, min: 1, max: 100)

## Sorting

- `sortBy` — field name (default: `createdAt`)
- `orderBy` — `asc` or `desc` (default: `desc`)

## Filtering

Use query parameters matching field names:
```
GET /api/v1/bookings?status=PENDING&customerId=123
```

## Request Headers

| Header | Purpose |
|--------|---------|
| `Authorization` | `Bearer <token>` |
| `Content-Type` | `application/json` |
| `X-Request-ID` | Request tracing (auto-generated if missing) |

## Rate Limiting

- Default: 100 requests per minute per IP
- Auth endpoints: 10 requests per minute per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
