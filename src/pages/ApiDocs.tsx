import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyRound, Webhook, Download, FileJson, ExternalLink } from "lucide-react";

export default function ApiDocsPage() {
  const apiBaseUrl = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-v1`
    : "https://YOUR_PROJECT_REF.supabase.co/functions/v1/api-v1";

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-3">
        <Badge variant="outline" className="text-[11px] uppercase tracking-[0.18em]">Developer API</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Charmy API v1</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Use the API to upload documents, manage records, create signed downloads, issue API keys, and subscribe to webhook events from external tools.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          <p className="text-xs font-medium text-foreground">Base endpoint</p>
          <div className="rounded-xl bg-muted/40 px-4 py-3 font-mono text-[12px] text-muted-foreground break-all">
            {apiBaseUrl}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="/charmy-api-v1-openapi.json" target="_blank" rel="noreferrer">
                <FileJson className="h-4 w-4" />
                Open OpenAPI Spec
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 space-y-3">
            <KeyRound className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-medium">Authentication</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Use the same bearer token as the app, or create scoped API keys for external integrations.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-medium">Signed Downloads</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Generate signed document URLs without exposing your storage bucket publicly.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Webhook className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-medium">Webhooks</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Subscribe to document upload, extraction, approval, and test events.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-medium">Core endpoints</h2>
            <div className="space-y-2 font-mono text-[12px] text-muted-foreground">
              <div>GET /workspaces</div>
              <div>GET /documents</div>
              <div>GET /documents/:id</div>
              <div>POST /documents/upload</div>
              <div>PATCH /documents/:id</div>
              <div>POST /documents/:id/extract</div>
              <div>POST /documents/:id/approve</div>
              <div>GET /documents/:id/download</div>
              <div>GET /exports</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-medium">Integration endpoints</h2>
            <div className="space-y-2 font-mono text-[12px] text-muted-foreground">
              <div>GET /api-keys</div>
              <div>POST /api-keys</div>
              <div>DELETE /api-keys/:id</div>
              <div>GET /webhooks</div>
              <div>POST /webhooks</div>
              <div>DELETE /webhooks/:id</div>
              <div>POST /webhooks/:id/test</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-sm font-medium">Quick start</h2>
          <div className="rounded-xl bg-muted/40 p-4">
            <pre className="overflow-x-auto text-[12px] leading-6 text-muted-foreground">
{`curl "${apiBaseUrl}/workspaces" \\
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \\
  -H "apikey: YOUR_SUPABASE_PUBLISHABLE_KEY"`}
            </pre>
          </div>
          <p className="text-xs text-muted-foreground">
            The in-app docs page is static so it works before deployment. Once `api-v1` is deployed, the live edge-function docs will be available from the API endpoint itself.
          </p>
          <Button asChild variant="outline">
            <a href="/charmy-api-v1-openapi.json" download>
              <ExternalLink className="h-4 w-4" />
              Download OpenAPI JSON
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
