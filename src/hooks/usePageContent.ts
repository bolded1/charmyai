import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePageContent<T extends Record<string, any>>(
  pageSlug: string,
  defaults: T
): { content: T; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["page-content", pageSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("page_content")
        .select("content")
        .eq("page_slug", pageSlug)
        .maybeSingle();
      return (data?.content as Partial<T>) ?? null;
    },
    staleTime: 60_000,
  });

  const content = { ...defaults, ...(data ?? {}) } as T;
  return { content, isLoading };
}

export async function savePageContent(pageSlug: string, content: Record<string, any>) {
  const { error } = await supabase
    .from("page_content")
    .upsert(
      { page_slug: pageSlug, content, updated_at: new Date().toISOString() },
      { onConflict: "page_slug" }
    );
  if (error) throw error;
}
