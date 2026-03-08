import { useState, useRef, useCallback, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Eye, Loader2, Bold, Italic, Underline, Link, List, ListOrdered, AlignLeft, AlignCenter, Image, Type, Heading1, Heading2, Upload } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminMarketingEmail() {
  const [subject, setSubject] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleInsertLink = () => {
    const url = prompt("Enter URL:");
    if (url) execCommand("createLink", url);
  };

  const handleInsertImageUrl = () => {
    const url = prompt("Enter image URL:");
    if (url) execCommand("insertImage", url);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("email-images")
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("email-images")
        .getPublicUrl(path);

      execCommand("insertImage", urlData.publicUrl);
      toast.success("Image inserted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getEditorHtml = () => {
    const content = editorRef.current?.innerHTML || "";
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f4f5; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .content { color: #18181b; font-size: 15px; line-height: 1.7; }
    .content h1 { font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #09090b; }
    .content h2 { font-size: 18px; font-weight: 600; margin: 16px 0 12px; color: #09090b; }
    .content p { margin: 0 0 12px; }
    .content a { color: #1e3a8a; }
    .content img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
    .content ul, .content ol { margin: 0 0 12px; padding-left: 24px; }
    .footer { text-align: center; padding: 24px 0 0; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="content">${content}</div>
    </div>
    <div class="footer">
      <p>Sent by Charmy &bull; <a href="%unsubscribe_url%" style="color: #a1a1aa;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
  };

  const handlePreview = () => {
    setPreviewHtml(getEditorHtml());
    setShowPreview(true);
  };

  const handleSendTest = async () => {
    if (!subject.trim()) return toast.error("Subject is required");
    if (!testEmail.trim()) return toast.error("Enter a test email address");
    if (!editorRef.current?.innerText.trim()) return toast.error("Email body is empty");

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-marketing-email", {
        body: { subject: subject.trim(), htmlBody: getEditorHtml(), testEmail: testEmail.trim() },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("Test email sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  const handleSendAll = async () => {
    setConfirmOpen(false);
    if (!subject.trim()) return toast.error("Subject is required");
    if (!editorRef.current?.innerText.trim()) return toast.error("Email body is empty");

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-marketing-email", {
        body: { subject: subject.trim(), htmlBody: getEditorHtml() },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success(`Email sent to ${data.sent} recipients!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Marketing Email</h1>
        <p className="text-sm text-muted-foreground mt-1">Compose and send marketing emails to all active users via Mailgun.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Compose Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              placeholder="e.g. 🎉 New features just dropped!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Email Body</Label>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-0.5 border border-border rounded-t-lg p-1.5 bg-muted/30">
              <Toggle size="sm" onPressedChange={() => execCommand("bold")} aria-label="Bold">
                <Bold className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle size="sm" onPressedChange={() => execCommand("italic")} aria-label="Italic">
                <Italic className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle size="sm" onPressedChange={() => execCommand("underline")} aria-label="Underline">
                <Underline className="h-3.5 w-3.5" />
              </Toggle>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Toggle size="sm" onPressedChange={() => execCommand("formatBlock", "h1")} aria-label="Heading 1">
                <Heading1 className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle size="sm" onPressedChange={() => execCommand("formatBlock", "h2")} aria-label="Heading 2">
                <Heading2 className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle size="sm" onPressedChange={() => execCommand("formatBlock", "p")} aria-label="Paragraph">
                <Type className="h-3.5 w-3.5" />
              </Toggle>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Toggle size="sm" onPressedChange={() => execCommand("insertUnorderedList")} aria-label="Bullet List">
                <List className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle size="sm" onPressedChange={() => execCommand("insertOrderedList")} aria-label="Numbered List">
                <ListOrdered className="h-3.5 w-3.5" />
              </Toggle>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Toggle size="sm" onPressedChange={() => execCommand("justifyLeft")} aria-label="Align Left">
                <AlignLeft className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle size="sm" onPressedChange={() => execCommand("justifyCenter")} aria-label="Align Center">
                <AlignCenter className="h-3.5 w-3.5" />
              </Toggle>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Toggle size="sm" onPressedChange={handleInsertLink} aria-label="Insert Link">
                <Link className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle size="sm" onPressedChange={handleInsertImage} aria-label="Insert Image">
                <Image className="h-3.5 w-3.5" />
              </Toggle>
            </div>
            {/* Editor */}
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[300px] border border-t-0 border-border rounded-b-lg p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring bg-background prose prose-sm max-w-none"
              style={{ lineHeight: 1.7 }}
              suppressContentEditableWarning
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-2 w-full">
              <Label htmlFor="testEmail">Send Test To</Label>
              <div className="flex gap-2">
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleSendTest} disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Send Test
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
            <Button
              onClick={() => {
                if (!subject.trim()) return toast.error("Subject is required");
                if (!editorRef.current?.innerText.trim()) return toast.error("Email body is empty");
                setConfirmOpen(true);
              }}
              disabled={sending}
              className="bg-primary"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Send to All Users
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-background rounded-xl shadow-xl max-w-[680px] w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold text-sm">Email Preview</span>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[60vh] border-0"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send to all active users?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send this marketing email to all active users. This action cannot be undone. Consider sending a test email first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendAll}>Yes, send to all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
