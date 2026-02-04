-- Drop the overly permissive policy
DROP POLICY "Service role can insert contact messages" ON public.contact_messages;

-- Create a more secure policy - only allow insert via service role (edge function)
-- The edge function uses service role key which bypasses RLS
-- So we don't need an INSERT policy for regular users