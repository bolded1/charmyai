import { useState } from "react";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { triggerBlobDownload } from "@/lib/download-utils";

export function useBulkDownload() {
  const [downloading, setDownloading] = useState(false);

  const downloadAsZip = async (documentIds: string[], zipName: string = "invoices") => {
    if (documentIds.length === 0) return;
    setDownloading(true);

    try {
      const { data: docs, error } = await supabase
        .from("documents")
        .select("id, file_name, file_path, file_type")
        .in("id", documentIds);

      if (error || !docs || docs.length === 0) {
        toast.error("No documents found to download");
        setDownloading(false);
        return;
      }

      const zip = new JSZip();
      let added = 0;
      let failed = 0;

      for (const doc of docs) {
        try {
          const { data: blob, error: dlError } = await supabase.storage
            .from("documents")
            .download(doc.file_path);

          if (dlError || !blob) {
            failed++;
            continue;
          }

          const ext = doc.file_type === "application/pdf" ? ".pdf"
            : doc.file_type?.startsWith("image/png") ? ".png"
            : doc.file_type?.startsWith("image/") ? ".jpg"
            : "";

          let name = doc.file_name || `document-${doc.id}${ext}`;
          if (zip.file(name)) {
            name = `${doc.id.slice(0, 8)}-${name}`;
          }

          zip.file(name, blob);
          added++;
        } catch {
          failed++;
        }
      }

      if (added === 0) {
        toast.error("Could not download any files");
        setDownloading(false);
        return;
      }

      const content = await zip.generateAsync({ type: "blob" });
      triggerBlobDownload(content, `${zipName}.zip`);

      if (failed > 0) {
        toast.warning(`Downloaded ${added} files, ${failed} could not be retrieved`);
      } else {
        toast.success("Documents downloaded as ZIP");
      }
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return { downloadAsZip, downloading };
}
