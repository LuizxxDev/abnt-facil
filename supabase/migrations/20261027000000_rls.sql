-- Segurança por linha (RLS) do ABNTFácil.
-- Cada usuário só lê, cria, altera e apaga os próprios projetos e imagens.
-- O script pode ser executado mais de uma vez (SQL Editor do Supabase).

-- ── Projetos ────────────────────────────────────────────────────────────────
alter table public.projects enable row level security;
alter table public.projects alter column user_id set default auth.uid();
create index if not exists projects_user_id_idx on public.projects (user_id);

drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

create policy "projects_select_own" on public.projects
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "projects_insert_own" on public.projects
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "projects_update_own" on public.projects
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "projects_delete_own" on public.projects
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── Feedback: qualquer visitante envia, ninguém lê pela API ─────────────────
alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_any" on public.feedback;
create policy "feedback_insert_any" on public.feedback
  for insert to anon, authenticated
  with check (type in ('bug', 'suggestion') and char_length(message) between 1 and 5000);

-- ── Imagens: pasta própria (<id do usuário>/arquivo), até 5 MB, só imagens ──
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
 where id = 'project-assets';

drop policy if exists "assets_insert_own_folder" on storage.objects;
drop policy if exists "assets_update_own_folder" on storage.objects;
drop policy if exists "assets_delete_own_folder" on storage.objects;

create policy "assets_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "assets_update_own_folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "assets_delete_own_folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
