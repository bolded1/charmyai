import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useClientRole() {
  const { user } = useAuth();

  const { data: isClient, isLoading } = useQuery({
    queryKey: ["is-client-role", user?.id],
    queryFn: async () => {
      if (!user) return false;

      // Check if the user is a team member with 'client' role
      const { data, error } = await supabase
        .from("team_members")
        .select("id, role, status")
        .eq("user_id", user.id)
        .eq("role", "client")
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) return false;
      return true;
    },
    enabled: !!user,
  });

  return { isClient: !!isClient, isLoading };
}
