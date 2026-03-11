# API v1

This project now exposes a first API version through the Supabase edge function:

- `GET /functions/v1/api-v1/openapi.json`
- `GET /functions/v1/api-v1/docs`
- `POST /functions/v1/api-v1/documents/upload`
- `GET /functions/v1/api-v1/documents`
- `GET /functions/v1/api-v1/documents/:id`
- `GET /functions/v1/api-v1/documents/:id/download`
- `PATCH /functions/v1/api-v1/documents/:id`
- `POST /functions/v1/api-v1/documents/:id/extract`
- `POST /functions/v1/api-v1/documents/:id/approve`
- `GET /functions/v1/api-v1/workspaces`
- `GET /functions/v1/api-v1/exports`
- `GET /functions/v1/api-v1/api-keys`
- `POST /functions/v1/api-v1/api-keys`
- `DELETE /functions/v1/api-v1/api-keys/:id`
- `GET /functions/v1/api-v1/webhooks`
- `POST /functions/v1/api-v1/webhooks`
- `DELETE /functions/v1/api-v1/webhooks/:id`
- `POST /functions/v1/api-v1/webhooks/:id/test`

## Auth

Use either the same Supabase bearer token the frontend uses, or an external integration API key created through the API.

### Bearer auth

```http
Authorization: Bearer <supabase_access_token>
apikey: <your_supabase_anon_key>
```

### API key auth

```http
x-api-key: <charmy_api_key>
```

You can also send the API key as:

```http
Authorization: Bearer <charmy_api_key>
```

The API is user-scoped. It only returns workspaces and records accessible to the authenticated user or API key.

## Workspace selection

Most list endpoints use the active workspace by default.

You can target a workspace explicitly with either:

- query param: `?workspace_id=<org_id>`
- header: `x-workspace-id: <org_id>`

## Examples

### List workspaces

```bash
curl "$SUPABASE_URL/functions/v1/api-v1/workspaces" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### List documents

```bash
curl "$SUPABASE_URL/functions/v1/api-v1/documents?status=needs_review&limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### Upload a document

Multipart:

```bash
curl "$SUPABASE_URL/functions/v1/api-v1/documents/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -F "file=@/path/to/invoice.pdf" \
  -F "extract=true"
```

JSON:

```bash
curl "$SUPABASE_URL/functions/v1/api-v1/documents/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "invoice.pdf",
    "file_type": "application/pdf",
    "content_base64": "<BASE64_CONTENT>",
    "extract": true
  }'
```

### Trigger extraction

```bash
curl -X POST "$SUPABASE_URL/functions/v1/api-v1/documents/<document_id>/extract" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### Signed file download

```bash
curl "$SUPABASE_URL/functions/v1/api-v1/documents/<document_id>/download?expires_in=3600" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### Update a document

```bash
curl -X PATCH "$SUPABASE_URL/functions/v1/api-v1/documents/<document_id>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_name": "Updated Supplier Ltd",
    "category": "Software"
  }'
```

### Approve a document

```bash
curl -X POST "$SUPABASE_URL/functions/v1/api-v1/documents/<document_id>/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### List exports

```bash
curl "$SUPABASE_URL/functions/v1/api-v1/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### Create an API key

```bash
curl -X POST "$SUPABASE_URL/functions/v1/api-v1/api-keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Zapier integration"
  }'
```

### Create a webhook

```bash
curl -X POST "$SUPABASE_URL/functions/v1/api-v1/webhooks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://example.com/charmy-webhook",
    "events": ["document.uploaded", "document.extracted", "document.approved"]
  }'
```

Supported webhook events in this v1:

- `document.uploaded`
- `document.extracted`
- `document.approved`
- `webhook.test`

Webhook deliveries include:

- `x-charmy-event`
- `x-charmy-signature`

Webhook target URLs:

- must be valid `http` or `https` URLs
- must not include embedded credentials
- must not point at `localhost` or private-network IP ranges

## Notes

- `documents/upload` defaults to `needs_review` unless `extract=true`.
- `documents/upload` with `extract=true` requires bearer-token auth in v1.
- `documents/:id/approve` creates an expense record by default, or an income record when `document_type` is `sales_invoice`.
- API key creation and webhook management currently require bearer-token auth.
- Extraction currently requires bearer-token auth because it reuses the existing `extract-document` function authorization flow.
- OpenAPI output is available at `/functions/v1/api-v1/openapi.json`.
- Swagger UI is available at `/functions/v1/api-v1/docs`.
- This is a practical v1 built on the existing app model, not a fully versioned public developer platform yet.
