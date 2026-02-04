-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true);

-- Allow public access to view event images
CREATE POLICY "Anyone can view event images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-images');

-- Allow authenticated admins to upload event images
CREATE POLICY "Admins can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

-- Allow authenticated admins to update event images
CREATE POLICY "Admins can update event images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');

-- Allow authenticated admins to delete event images
CREATE POLICY "Admins can delete event images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');