-- Vincular cópias pessoais ao show da banda (source_band_gig_id).
-- 1) Quando o owner exclui um show da banda, excluir as cópias na agenda pessoal de todos (CASCADE).
-- 2) Quando o owner remove um membro da banda, excluir da agenda pessoal dele todos os shows que vieram dessa banda.

-- Coluna que liga a cópia pessoal ao show da banda (NULL = gig criado pelo usuário, não é cópia)
ALTER TABLE public.gigs
ADD COLUMN IF NOT EXISTS source_band_gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_gigs_source_band_gig_id ON public.gigs(source_band_gig_id) WHERE source_band_gig_id IS NOT NULL;

-- Atualizar trigger 017: ao criar cópias, preencher source_band_gig_id
CREATE OR REPLACE FUNCTION public.create_personal_copies_for_band_gig()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  band_name_val TEXT;
  member_record RECORD;
BEGIN
  IF NEW.band_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(b.name, NEW.band_name) INTO band_name_val
  FROM public.bands b WHERE b.id = NEW.band_id;

  FOR member_record IN
    SELECT bm.user_id
    FROM public.band_members bm
    WHERE bm.band_id = NEW.band_id
  LOOP
    INSERT INTO public.gigs (
      user_id,
      band_id,
      date,
      title,
      location,
      value,
      status,
      notes,
      band_name,
      source_band_gig_id
    ) VALUES (
      member_record.user_id,
      NULL,
      NEW.date,
      NEW.title,
      NEW.location,
      0,
      'PENDING',
      NEW.notes,
      COALESCE(band_name_val, NEW.band_name),
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Atualizar trigger 018: ao copiar para novo membro, preencher source_band_gig_id
CREATE OR REPLACE FUNCTION public.copy_band_gigs_to_new_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  band_owner_id UUID;
  band_name_val TEXT;
  band_gig RECORD;
BEGIN
  SELECT owner_id, name INTO band_owner_id, band_name_val FROM public.bands WHERE id = NEW.band_id;
  IF band_owner_id IS NULL OR NEW.user_id = band_owner_id THEN
    RETURN NEW;
  END IF;

  FOR band_gig IN
    SELECT id, date, title, location, value, status, notes, band_name
    FROM public.gigs
    WHERE band_id = NEW.band_id
  LOOP
    INSERT INTO public.gigs (
      user_id,
      band_id,
      date,
      title,
      location,
      value,
      status,
      notes,
      band_name,
      source_band_gig_id
    ) VALUES (
      NEW.user_id,
      NULL,
      band_gig.date,
      band_gig.title,
      band_gig.location,
      0,
      'PENDING',
      band_gig.notes,
      COALESCE(band_gig.band_name, band_name_val),
      band_gig.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Quando o owner remove um membro da banda: remover da agenda pessoal dele todos os shows que vieram dessa banda
CREATE OR REPLACE FUNCTION public.remove_band_gig_copies_from_removed_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.gigs
  WHERE user_id = OLD.user_id
    AND band_id IS NULL
    AND source_band_gig_id IN (
      SELECT id FROM public.gigs WHERE band_id = OLD.band_id
    );
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS after_band_member_remove_delete_personal_copies ON public.band_members;
CREATE TRIGGER after_band_member_remove_delete_personal_copies
  AFTER DELETE ON public.band_members
  FOR EACH ROW
  EXECUTE FUNCTION public.remove_band_gig_copies_from_removed_member();
