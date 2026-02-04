import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Milestone {
  id: string;
  year: string;
  event: string;
  sort_order: number;
}

export function useMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setMilestones(data);
    }
    setLoading(false);
  };

  return { milestones, loading, refetch: fetchMilestones };
}
