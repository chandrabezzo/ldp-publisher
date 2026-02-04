-- Create table for dynamic site settings (stats)
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  label text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default stats
INSERT INTO public.site_settings (key, value, label) VALUES
('stat_books_published', '500+', 'Buku Diterbitkan'),
('stat_authors_joined', '1000+', 'Penulis Bergabung'),
('stat_years_experience', '15+', 'Tahun Pengalaman'),
('stat_awards', '50+', 'Penghargaan');

-- Create table for milestones/timeline
CREATE TABLE public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year text NOT NULL,
  event text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Anyone can view milestones
CREATE POLICY "Anyone can view milestones"
ON public.milestones
FOR SELECT
USING (true);

-- Only admins can modify milestones
CREATE POLICY "Admins can insert milestones"
ON public.milestones
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update milestones"
ON public.milestones
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete milestones"
ON public.milestones
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default milestones
INSERT INTO public.milestones (year, event, sort_order) VALUES
('2009', 'LDP Publisher didirikan dengan visi menjadi penerbit terdepan di Indonesia', 1),
('2012', 'Menerbitkan 100 judul buku pertama', 2),
('2015', 'Ekspansi ke penerbitan digital dan e-book', 3),
('2018', 'Mencapai 500+ judul buku yang diterbitkan', 4),
('2021', 'Meluncurkan program pendampingan penulis pemula', 5),
('2024', 'Bergabung dengan LDP Group untuk memperluas jangkauan', 6);

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at
BEFORE UPDATE ON public.milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();