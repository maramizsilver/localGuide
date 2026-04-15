-- =====================================================
-- T3-1: ACTIVATION DE LA RECHERCHE FULL-TEXT (pg_trgm)
-- =====================================================

-- Activer l'extension pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Ajouter des colonnes de recherche full-text sur commerces
ALTER TABLE public.commerces 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
    setweight(to_tsvector('french', COALESCE(nom, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(ville, '')), 'C')
) STORED;

-- Créer un index GIN pour la recherche full-text rapide
CREATE INDEX IF NOT EXISTS idx_commerces_search_vector ON public.commerces USING GIN(search_vector);

-- Ajouter un index trigram pour la recherche floue (correction d'orthographe)
CREATE INDEX IF NOT EXISTS idx_commerces_nom_trgm ON public.commerces USING GIST (nom gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_commerces_description_trgm ON public.commerces USING GIST (description gist_trgm_ops);

-- Ajouter les mêmes fonctionnalités pour la table guides
ALTER TABLE public.guides 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
    setweight(to_tsvector('french', COALESCE(prenom || ' ' || nom, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(specialite, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(ville, '')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS idx_guides_search_vector ON public.guides USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_guides_specialite_trgm ON public.guides USING GIST (specialite gist_trgm_ops);

-- Fonction RPC pour la recherche unifiée (T3-1)
CREATE OR REPLACE FUNCTION public.search_all(search_term TEXT)
RETURNS TABLE(
    type TEXT,
    id UUID,
    nom TEXT,
    description TEXT,
    specialite TEXT,
    ville TEXT,
    score REAL
) AS $$
BEGIN
    -- Recherche dans les commerces
    RETURN QUERY
    SELECT 
        'commerce'::TEXT as type,
        c.id,
        c.nom,
        c.description,
        NULL::TEXT as specialite,
        c.ville,
        GREATEST(
            COALESCE(similarity(c.nom, search_term), 0),
            COALESCE(similarity(c.description, search_term), 0),
            ts_rank(c.search_vector, websearch_to_tsquery('french', search_term))
        ) as score
    FROM public.commerces c
    WHERE c.statut = 'actif'
      AND (
          c.nom ILIKE '%' || search_term || '%'
          OR c.description ILIKE '%' || search_term || '%'
          OR c.ville ILIKE '%' || search_term || '%'
          OR c.search_vector @@ websearch_to_tsquery('french', search_term)
          OR c.nom % search_term
      )
    ORDER BY score DESC
    LIMIT 20;
    
    -- Recherche dans les guides
    RETURN QUERY
    SELECT 
        'guide'::TEXT as type,
        g.id,
        (g.prenom || ' ' || g.nom) as nom,
        NULL::TEXT as description,
        g.specialite,
        g.ville,
        GREATEST(
            COALESCE(similarity(g.specialite, search_term), 0),
            COALESCE(similarity(g.prenom || ' ' || g.nom, search_term), 0),
            ts_rank(g.search_vector, websearch_to_tsquery('french', search_term))
        ) as score
    FROM public.guides g
    WHERE g.statut = 'disponible'
      AND (
          (g.prenom || ' ' || g.nom) ILIKE '%' || search_term || '%'
          OR g.specialite ILIKE '%' || search_term || '%'
          OR g.ville ILIKE '%' || search_term || '%'
          OR g.search_vector @@ websearch_to_tsquery('french', search_term)
          OR g.specialite % search_term
      )
    ORDER BY score DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- T3-2: GÉOLOCALISATION POSTGIS
-- =====================================================

-- Activer l'extension PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Ajouter les colonnes de géolocalisation aux tables existantes
ALTER TABLE public.commerces 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326);

ALTER TABLE public.guides 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326);

-- Mettre à jour la colonne location à partir de l'adresse (nécessite une étape manuelle ou une API de géocodage)
-- Exemple de mise à jour manuelle (à faire avec les vraies coordonnées)
-- UPDATE public.commerces SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) 
-- WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

-- Créer des index spatiaux pour accélérer les requêtes de proximité
CREATE INDEX IF NOT EXISTS idx_commerces_location ON public.commerces USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_guides_location ON public.guides USING GIST(location);

-- Fonction RPC pour la recherche par proximité (T3-2)
CREATE OR REPLACE FUNCTION public.find_nearby(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 2000
)
RETURNS TABLE(
    type TEXT,
    id UUID,
    nom TEXT,
    description TEXT,
    ville TEXT,
    distance_meters REAL
) AS $$
DECLARE
    user_point GEOMETRY(Point, 4326);
BEGIN
    user_point := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
    
    -- Commerces proches
    RETURN QUERY
    SELECT 
        'commerce'::TEXT as type,
        c.id,
        c.nom,
        c.description,
        c.ville,
        ST_Distance(c.location, user_point) as distance_meters
    FROM public.commerces c
    WHERE c.location IS NOT NULL
      AND c.statut = 'actif'
      AND ST_DWithin(c.location, user_point, radius_meters)
    ORDER BY distance_meters
    LIMIT 20;
    
    -- Guides proches
    RETURN QUERY
    SELECT 
        'guide'::TEXT as type,
        g.id,
        (g.prenom || ' ' || g.nom) as nom,
        g.specialite as description,
        g.ville,
        ST_Distance(g.location, user_point) as distance_meters
    FROM public.guides g
    WHERE g.location IS NOT NULL
      AND g.statut = 'disponible'
      AND ST_DWithin(g.location, user_point, radius_meters)
    ORDER BY distance_meters
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- T3-3: SUPABASE REALTIME (Configuration)
-- =====================================================

-- Activer Realtime sur la table commerces
-- NOTE: Cette partie se fait dans l'interface Supabase:
-- 1. Aller à Database → Replication
-- 2. Activer la table "commerces" pour les événements INSERT, UPDATE, DELETE
-- 3. Activer la publication "supabase_realtime"

-- Alternative en SQL (si l'option est disponible):
-- ALTER TABLE public.commerces REPLICA IDENTITY FULL;
-- BEGIN;
--   DROP PUBLICATION IF EXISTS supabase_realtime;
--   CREATE PUBLICATION supabase_realtime FOR TABLE public.commerces;
-- COMMIT;

-- Ajouter une colonne pour suivre l'état de validation des commerces (si non existante)
ALTER TABLE public.commerces 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Mettre à jour le statut existant
UPDATE public.commerces SET is_approved = (statut = 'actif');


-- =====================================================
-- T3-4: SYSTÈME DE RÉSERVATION (améliorations)
-- =====================================================

-- Ajouter une contrainte d'unicité pour éviter les doubles réservations
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS unique_guide_date;

ALTER TABLE public.reservations 
ADD CONSTRAINT unique_guide_date UNIQUE(guide_id, date);

-- Ajouter un index composite pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_reservations_guide_statut_date 
ON public.reservations(guide_id, statut, date);

-- Fonction RPC pour créer une réservation (T3-4)
CREATE OR REPLACE FUNCTION public.book_guide(
    p_guide_id UUID,
    p_user_id UUID,
    p_date TIMESTAMP,
    p_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_existing_id UUID;
    v_guide_exists BOOLEAN;
    v_user_exists BOOLEAN;
    v_new_reservation_id UUID;
BEGIN
    -- Vérifier si le guide existe et est disponible
    SELECT EXISTS(
        SELECT 1 FROM public.guides 
        WHERE id = p_guide_id AND statut = 'disponible'
    ) INTO v_guide_exists;
    
    IF NOT v_guide_exists THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Guide non trouvé ou non disponible'
        );
    END IF;
    
    -- Vérifier si l'utilisateur existe
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Utilisateur non trouvé'
        );
    END IF;
    
    -- Vérifier si la date n'est pas passée
    IF p_date < NOW() THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Impossible de réserver une date passée'
        );
    END IF;
    
    -- Vérifier les réservations existantes (non annulées)
    SELECT id INTO v_existing_id FROM public.reservations
    WHERE guide_id = p_guide_id 
      AND date::DATE = p_date::DATE
      AND statut IN ('en_attente', 'confirmée');
    
    IF v_existing_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Ce guide est déjà réservé à cette date'
        );
    END IF;
    
    -- Insérer la réservation
    INSERT INTO public.reservations (guide_id, user_id, date, statut, message)
    VALUES (p_guide_id, p_user_id, p_date, 'en_attente', p_message)
    RETURNING id INTO v_new_reservation_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Réservation créée avec succès, en attente de confirmation',
        'reservation_id', v_new_reservation_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour confirmer une réservation (guide ou admin)
CREATE OR REPLACE FUNCTION public.confirm_reservation(p_reservation_id UUID)
RETURNS JSON AS $$
DECLARE
    v_guide_id UUID;
    v_current_user_id UUID;
BEGIN
    v_current_user_id := auth.uid();
    
    -- Vérifier que l'utilisateur est le guide ou un admin
    SELECT guide_id INTO v_guide_id 
    FROM public.reservations WHERE id = p_reservation_id;
    
    IF NOT EXISTS (
        SELECT 1 FROM public.guides WHERE id = v_guide_id AND user_id = v_current_user_id
    ) AND NOT EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = v_current_user_id AND role = 'admin'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Non autorisé');
    END IF;
    
    UPDATE public.reservations 
    SET statut = 'confirmée', updated_at = NOW()
    WHERE id = p_reservation_id AND statut = 'en_attente';
    
    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Réservation confirmée');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Réservation non trouvée ou déjà traitée');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour annuler une réservation
CREATE OR REPLACE FUNCTION public.cancel_reservation(p_reservation_id UUID)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_guide_id UUID;
    v_current_user_id UUID;
BEGIN
    v_current_user_id := auth.uid();
    
    SELECT user_id, guide_id INTO v_user_id, v_guide_id
    FROM public.reservations WHERE id = p_reservation_id;
    
    -- Vérifier que l'utilisateur est le client, le guide ou un admin
    IF v_current_user_id != v_user_id 
       AND NOT EXISTS (SELECT 1 FROM public.guides WHERE id = v_guide_id AND user_id = v_current_user_id)
       AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_current_user_id AND role = 'admin')
    THEN
        RETURN json_build_object('success', false, 'error', 'Non autorisé');
    END IF;
    
    UPDATE public.reservations 
    SET statut = 'annulée', updated_at = NOW()
    WHERE id = p_reservation_id;
    
    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Réservation annulée');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Réservation non trouvée');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue améliorée pour les réservations
CREATE OR REPLACE VIEW public.v_reservations_full AS
SELECT 
    r.id,
    r.date,
    r.statut,
    r.message,
    r.created_at,
    g.id AS guide_id,
    g.prenom AS guide_prenom,
    g.nom AS guide_nom,
    g.specialite,
    g.image_url AS guide_image,
    u.id AS client_id,
    u.display_name AS client_nom,
    u.phone AS client_phone,
    u.avatar_url AS client_avatar
FROM public.reservations r
LEFT JOIN public.guides g ON r.guide_id = g.id
LEFT JOIN public.users_profiles u ON r.user_id = u.id;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.search_all(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.find_nearby(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.book_guide(UUID, UUID, TIMESTAMP, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_reservation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reservation(UUID) TO authenticated;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que les extensions sont installées
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_trgm', 'postgis');

-- Vérifier que les fonctions existent
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('search_all', 'find_nearby', 'book_guide', 'confirm_reservation', 'cancel_reservation');