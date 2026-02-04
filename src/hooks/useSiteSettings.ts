import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteStat {
  key: string;
  value: string;
  label: string;
}

export function useSiteSettings() {
  const [stats, setStats] = useState<SiteStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .like("key", "stat_%")
      .order("key");

    if (!error && data) {
      setStats(data.map(item => ({
        key: item.key,
        value: item.value,
        label: item.label,
      })));
    }
    setLoading(false);
  };

  return { stats, loading, refetch: fetchSettings };
}
