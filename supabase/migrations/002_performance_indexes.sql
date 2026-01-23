-- Additional indexes for better query performance
-- These indexes help speed up common queries

-- Composite index for filtering by user, status, and date (common query pattern)
CREATE INDEX IF NOT EXISTS idx_gigs_user_status_date ON public.gigs(user_id, status, date);

-- Index for searching by title (if you add full-text search later)
-- CREATE INDEX IF NOT EXISTS idx_gigs_title_trgm ON public.gigs USING gin(title gin_trgm_ops);

-- Index for band_name searches (if needed)
CREATE INDEX IF NOT EXISTS idx_gigs_band_name ON public.gigs(band_name) WHERE band_name IS NOT NULL;

-- Index for location searches (if needed)
CREATE INDEX IF NOT EXISTS idx_gigs_location ON public.gigs(location) WHERE location IS NOT NULL;
