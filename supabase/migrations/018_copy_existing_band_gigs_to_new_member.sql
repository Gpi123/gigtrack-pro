-- Quando um novo membro é adicionado à banda, copiar todos os shows já existentes da banda
-- para a agenda pessoal desse membro (com nome da banda preenchido).

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
  -- Não copiar quando é o owner sendo adicionado (criação da banda; ainda não há shows)
  SELECT owner_id, name INTO band_owner_id, band_name_val FROM public.bands WHERE id = NEW.band_id;
  IF band_owner_id IS NULL OR NEW.user_id = band_owner_id THEN
    RETURN NEW;
  END IF;

  -- Para cada show existente da banda, criar uma cópia pessoal para o novo membro
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
      band_name
    ) VALUES (
      NEW.user_id,
      NULL,
      band_gig.date,
      band_gig.title,
      band_gig.location,
      0,
      'PENDING',
      band_gig.notes,
      COALESCE(band_gig.band_name, band_name_val)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_band_member_add_copy_existing_gigs ON public.band_members;
CREATE TRIGGER after_band_member_add_copy_existing_gigs
  AFTER INSERT ON public.band_members
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_band_gigs_to_new_member();
