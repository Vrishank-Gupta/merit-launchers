
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can read published blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authenticated users can manage all blogs" ON public.blogs;

-- Create permissive policies
CREATE POLICY "Anyone can read published blogs"
ON public.blogs FOR SELECT
TO anon, authenticated
USING (status = 'published');

CREATE POLICY "Authenticated users can manage all blogs"
ON public.blogs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
