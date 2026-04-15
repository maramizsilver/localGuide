-- =====================================================
-- SPRINT 4 - SCRIPT COMPLET
-- =====================================================

-- T4-1: INDEX OPTIMISATION
CREATE INDEX IF NOT EXISTS idx_commerces_statut ON public.commerces(statut);
CREATE INDEX IF NOT EXISTS idx_commerces_categorie ON public.commerces(categorie);
CREATE INDEX IF NOT EXISTS idx_commerces_ville ON public.commerces(ville);
CREATE INDEX IF NOT EXISTS idx_commerces_statut_ville ON public.commerces(statut, ville);

CREATE INDEX IF NOT EXISTS idx_guides_statut ON public.guides(statut);
CREATE INDEX IF NOT EXISTS idx_guides_ville ON public.guides(ville);
CREATE INDEX IF NOT EXISTS idx_reservations_guide_statut_date ON public.reservations(guide_id, statut, date);
CREATE INDEX IF NOT EXISTS idx_avis_commerce_note ON public.avis(commerce_id, note_globale);

-- T4-2: FONCTION NOTE MOYENNE
CREATE OR REPLACE FUNCTION public.get_commerce_rating(p_commerce_id UUID)
RETURNS TABLE(
    average_note NUMERIC,
    total_reviews BIGINT,
    distribution JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ROUND(AVG(note_globale)::NUMERIC, 2), 0),
        COUNT(*)::BIGINT,
        COALESCE(
            (SELECT JSON_OBJECT(
                '1', COUNT(*) FILTER (WHERE note_globale = 1),
                '2', COUNT(*) FILTER (WHERE note_globale = 2),
                '3', COUNT(*) FILTER (WHERE note_globale = 3),
                '4', COUNT(*) FILTER (WHERE note_globale = 4),
                '5', COUNT(*) FILTER (WHERE note_globale = 5)
            ) FROM public.avis WHERE commerce_id = p_commerce_id),
            '{}'::JSON
        )
    FROM public.avis
    WHERE commerce_id = p_commerce_id;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.get_commerce_rating(UUID) TO authenticated, anon;
