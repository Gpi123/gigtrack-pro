-- Quando o owner cria um show na banda, criar automaticamente uma cópia pessoal (gig próprio) para cada membro,
-- incluindo o próprio owner, para que apareça também na agenda pessoal dele.

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

  -- Nome da banda (sempre preencher nas cópias; fallback para o que veio no gig)
  SELECT COALESCE(b.name, NEW.band_name) INTO band_name_val
  FROM public.bands b WHERE b.id = NEW.band_id;

  -- Cópia para cada membro da banda (incluindo o owner)
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
      band_name
    ) VALUES (
      member_record.user_id,
      NULL,
      NEW.date,
      NEW.title,
      NEW.location,
      0,
      'PENDING',
      NEW.notes,
      COALESCE(band_name_val, NEW.band_name)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_band_gig_create_copy_for_members ON public.gigs;
CREATE TRIGGER after_band_gig_create_copy_for_members
  AFTER INSERT ON public.gigs
  FOR EACH ROW
  WHEN (NEW.band_id IS NOT NULL)
  EXECUTE FUNCTION public.create_personal_copies_for_band_gig();
