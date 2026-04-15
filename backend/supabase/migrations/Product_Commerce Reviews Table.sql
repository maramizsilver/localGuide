-- =====================================================
-- ORDRE CORRECT (supprimer dans l'ordre inverse des dépendances)
-- =====================================================
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS avis;
DROP TABLE IF EXISTS actualites;
DROP TABLE IF EXISTS commerces;
DROP TABLE IF EXISTS guides;
DROP TABLE IF EXISTS users_profiles;

-- =====================================================
-- FONCTION utilitaire (doit exister avant les triggers)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLE: users_profiles (CRÉÉE EN PREMIER)
-- =====================================================
CREATE TABLE users_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'client',
    display_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(20),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT role_valid CHECK (role IN ('client', 'commerçant', 'guide', 'admin'))
);

CREATE INDEX idx_users_profiles_role ON users_profiles(role);
CREATE INDEX idx_users_profiles_display_name ON users_profiles(display_name);

CREATE TRIGGER update_users_profiles_updated_at
    BEFORE UPDATE ON users_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs voient leur propre profil"
    ON users_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
    ON users_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
    ON users_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Les admins voient tous les profils"
    ON users_profiles FOR ALL
    USING (auth.role() = 'authenticated' AND 
           EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- TABLE: guides
-- =====================================================
CREATE TABLE guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    ville VARCHAR(100) NOT NULL,
    specialite VARCHAR(255),
    experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),
    langue TEXT[] DEFAULT '{}',
    motivation TEXT,
    image_url TEXT,
    facebook_url TEXT,
    insta_url TEXT,
    statut VARCHAR(50) NOT NULL DEFAULT 'disponible' CHECK (statut IN ('disponible', 'occupé', 'inactif')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guides_user_id ON guides(user_id);
CREATE INDEX idx_guides_email ON guides(email);
CREATE INDEX idx_guides_ville ON guides(ville);
CREATE INDEX idx_guides_specialite ON guides(specialite);
CREATE INDEX idx_guides_statut ON guides(statut);
CREATE INDEX idx_guides_langue ON guides USING GIN(langue);

CREATE TRIGGER update_guides_updated_at
    BEFORE UPDATE ON guides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les guides"
    ON guides FOR SELECT USING (true);

CREATE POLICY "Les guides peuvent modifier leur propre profil"
    ON guides FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Les guides peuvent insérer leur propre profil"
    ON guides FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les admins peuvent tout faire sur guides"
    ON guides FOR ALL USING (
        EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- TABLE: commerces
-- =====================================================
CREATE TABLE commerces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    categorie VARCHAR(100) NOT NULL,
    fourchette_prix VARCHAR(3) CHECK (fourchette_prix IN ('€', '€€', '€€€')),
    description TEXT,
    adresse TEXT NOT NULL,
    ville VARCHAR(100) NOT NULL,
    code_postal VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    h_ouverture TIME,
    h_fermeture TIME,
    image_url TEXT,
    statut VARCHAR(50) NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'fermé')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT horaires_valid CHECK (h_fermeture IS NULL OR h_ouverture IS NULL OR h_fermeture > h_ouverture)
);

CREATE INDEX idx_commerces_owner_id ON commerces(owner_id);
CREATE INDEX idx_commerces_nom ON commerces(nom);
CREATE INDEX idx_commerces_categorie ON commerces(categorie);
CREATE INDEX idx_commerces_ville ON commerces(ville);
CREATE INDEX idx_commerces_code_postal ON commerces(code_postal);
CREATE INDEX idx_commerces_fourchette_prix ON commerces(fourchette_prix);
CREATE INDEX idx_commerces_statut ON commerces(statut);
CREATE INDEX idx_commerces_recherche ON commerces USING GIN(
    to_tsvector('french', nom || ' ' || COALESCE(description, '') || ' ' || ville)
);

CREATE TRIGGER update_commerces_updated_at
    BEFORE UPDATE ON commerces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE commerces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les commerces actifs"
    ON commerces FOR SELECT USING (statut = 'actif');

CREATE POLICY "Les propriétaires voient leurs commerces"
    ON commerces FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Les propriétaires peuvent modifier leurs commerces"
    ON commerces FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Les propriétaires peuvent ajouter des commerces"
    ON commerces FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Les propriétaires peuvent supprimer leurs commerces"
    ON commerces FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Les admins peuvent tout faire sur commerces"
    ON commerces FOR ALL USING (
        EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- TABLE: avis
-- =====================================================
CREATE TABLE avis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commerce_id UUID NOT NULL REFERENCES commerces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ville VARCHAR(100) NOT NULL,
    date_visite DATE NOT NULL,
    type_visite VARCHAR(50),
    note_globale INT NOT NULL CHECK (note_globale BETWEEN 1 AND 5),
    note_qualite INT CHECK (note_qualite BETWEEN 1 AND 5),
    note_service INT CHECK (note_service BETWEEN 1 AND 5),
    note_prix INT CHECK (note_prix BETWEEN 1 AND 5),
    note_ambiance INT CHECK (note_ambiance BETWEEN 1 AND 5),
    recommande VARCHAR(10) CHECK (recommande IN ('oui', 'non', 'mitige')),
    titre VARCHAR(255) NOT NULL,
    avis_texte TEXT NOT NULL,
    points_forts VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_avis_commerce_id ON avis(commerce_id);
CREATE INDEX idx_avis_user_id ON avis(user_id);
CREATE INDEX idx_avis_note_globale ON avis(note_globale);

ALTER TABLE avis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les avis"
    ON avis FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs peuvent créer des avis"
    ON avis FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres avis"
    ON avis FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: actualites
-- =====================================================
CREATE TABLE actualites (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    commerce_nom VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    adresse TEXT NOT NULL,
    ville VARCHAR(100) NOT NULL,
    lien_externe TEXT,
    email_contact VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    mise_en_avant BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    statut VARCHAR(50) DEFAULT 'brouillon',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_type CHECK (type IN ('evenement', 'promotion', 'ouverture', 'fermeture', 'nouveauproduit', 'actu', 'autre')),
    CONSTRAINT valid_statut CHECK (statut IN ('brouillon', 'publié', 'archivé'))
);

CREATE INDEX idx_actualites_type ON actualites(type);
CREATE INDEX idx_actualites_ville ON actualites(ville);
CREATE INDEX idx_actualites_date_debut ON actualites(date_debut);
CREATE INDEX idx_actualites_statut ON actualites(statut);

-- =====================================================
-- TABLE: reservations
-- =====================================================
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'en_attente',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT date_future CHECK (date > NOW()),
    CONSTRAINT statut_valid CHECK (statut IN ('en_attente', 'confirmée', 'annulée', 'terminée'))
);

CREATE INDEX idx_reservations_guide_id ON reservations(guide_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_statut ON reservations(statut);
CREATE INDEX idx_reservations_guide_statut ON reservations(guide_id, statut);

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs voient leurs propres réservations"
    ON reservations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les guides voient les réservations qui les concernent"
    ON reservations FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM guides WHERE id = guide_id)
    );

CREATE POLICY "Les utilisateurs peuvent créer des réservations"
    ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent annuler leurs réservations"
    ON reservations FOR UPDATE
    USING (auth.uid() = user_id AND statut = 'en_attente')
    WITH CHECK (statut = 'annulée');

-- =====================================================
-- FONCTION : Création automatique du profil utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- VUES UTILES
-- =====================================================

CREATE OR REPLACE VIEW v_reservations_details AS
SELECT 
    r.id,
    r.date,
    r.statut,
    r.message,
    r.created_at,
    g.prenom AS guide_prenom,
    g.nom AS guide_nom,
    g.specialite,
    up.display_name AS client_nom,
    up.phone AS client_phone
FROM reservations r
LEFT JOIN guides g ON r.guide_id = g.id
LEFT JOIN users_profiles up ON r.user_id = up.id;

CREATE OR REPLACE VIEW v_stats_guides AS
SELECT 
    g.id,
    g.prenom,
    g.nom,
    COUNT(r.id) AS total_reservations,
    COUNT(CASE WHEN r.statut = 'confirmée' THEN 1 END) AS reservations_confirmees,
    COUNT(CASE WHEN r.statut = 'terminée' THEN 1 END) AS reservations_terminees,
    COUNT(CASE WHEN r.statut = 'annulée' THEN 1 END) AS reservations_annulees
FROM guides g
LEFT JOIN reservations r ON g.id = r.guide_id
GROUP BY g.id;