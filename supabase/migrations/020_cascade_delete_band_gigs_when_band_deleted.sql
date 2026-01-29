-- Ao excluir a banda, excluir também todos os shows dessa banda (gigs com band_id = banda).
-- CASCADE em source_band_gig_id (019) já remove as cópias pessoais quando cada band gig é deletado.

-- 1) Remover gigs órfãos (band_id apontando para banda que já foi excluída)
DELETE FROM public.gigs
WHERE band_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.bands b WHERE b.id = gigs.band_id);

-- 2) Garantir que band_id em gigs referencia bands(id) com CASCADE
ALTER TABLE public.gigs DROP CONSTRAINT IF EXISTS gigs_band_id_fkey;
ALTER TABLE public.gigs
  ADD CONSTRAINT gigs_band_id_fkey
  FOREIGN KEY (band_id) REFERENCES public.bands(id) ON DELETE CASCADE;
