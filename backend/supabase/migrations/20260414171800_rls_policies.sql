-- ============================================
-- SCRIPT COMPLET RLS (tasnim's sprint1 task )
-- ============================================

-- users_profiles
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "admin_view_all_profiles" ON public.users_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.users_profiles;

CREATE POLICY "users_view_own_profile" ON public.users_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "admin_view_all_profiles" ON public.users_profiles FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));
CREATE POLICY "users_update_own_profile" ON public.users_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admin_update_all_profiles" ON public.users_profiles FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- actualites
ALTER TABLE public.actualites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_actualites" ON public.actualites;
DROP POLICY IF EXISTS "admin_manage_actualites" ON public.actualites;

CREATE POLICY "public_view_actualites" ON public.actualites FOR SELECT TO public USING (true);
CREATE POLICY "admin_manage_actualites" ON public.actualites FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- guides (CORRIGÉ avec user_id au lieu de owner_id)
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_guides" ON public.guides;
DROP POLICY IF EXISTS "authenticated_create_guides" ON public.guides;
DROP POLICY IF EXISTS "owner_or_admin_update_guides" ON public.guides;
DROP POLICY IF EXISTS "owner_or_admin_delete_guides" ON public.guides;

CREATE POLICY "public_view_guides" ON public.guides FOR SELECT TO public USING (true);
CREATE POLICY "authenticated_create_guides" ON public.guides FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_or_admin_update_guides" ON public.guides FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));
CREATE POLICY "owner_or_admin_delete_guides" ON public.guides FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- avis
ALTER TABLE public.avis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_avis" ON public.avis;
DROP POLICY IF EXISTS "authenticated_create_avis" ON public.avis;
DROP POLICY IF EXISTS "author_or_admin_update_avis" ON public.avis;
DROP POLICY IF EXISTS "author_or_admin_delete_avis" ON public.avis;

CREATE POLICY "public_view_avis" ON public.avis FOR SELECT TO public USING (true);
CREATE POLICY "authenticated_create_avis" ON public.avis FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "author_or_admin_update_avis" ON public.avis FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));
CREATE POLICY "author_or_admin_delete_avis" ON public.avis FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_view_own_reservations" ON public.reservations;
DROP POLICY IF EXISTS "guides_view_their_reservations" ON public.reservations;
DROP POLICY IF EXISTS "admin_view_all_reservations" ON public.reservations;
DROP POLICY IF EXISTS "users_create_reservations" ON public.reservations;
DROP POLICY IF EXISTS "user_guide_admin_update_reservations" ON public.reservations;

CREATE POLICY "users_view_own_reservations" ON public.reservations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "guides_view_their_reservations" ON public.reservations FOR SELECT TO authenticated USING (auth.uid() = guide_id);
CREATE POLICY "admin_view_all_reservations" ON public.reservations FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));
CREATE POLICY "users_create_reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_guide_admin_update_reservations" ON public.reservations FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = guide_id OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- commerces
ALTER TABLE public.commerces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_public_approved_commerces" ON public.commerces;
DROP POLICY IF EXISTS "select_admin_all_commerces" ON public.commerces;
DROP POLICY IF EXISTS "insert_authenticated_users" ON public.commerces;
DROP POLICY IF EXISTS "update_owner_or_admin" ON public.commerces;
DROP POLICY IF EXISTS "delete_owner_or_admin" ON public.commerces;

CREATE POLICY "select_public_approved_commerces" ON public.commerces FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "select_admin_all_commerces" ON public.commerces FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));
CREATE POLICY "insert_authenticated_users" ON public.commerces FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "update_owner_or_admin" ON public.commerces FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));
CREATE POLICY "delete_owner_or_admin" ON public.commerces FOR DELETE TO authenticated USING (owner_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));