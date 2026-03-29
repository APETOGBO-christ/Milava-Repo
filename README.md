# Milava

Plateforme web de marketing d'influence qui connecte des entreprises et des createurs de contenu en Afrique de l'Ouest.

## Stack

- Next.js 15
- React 19
- Tailwind CSS 4
- Zustand
- Supabase (PostgreSQL + Auth + Storage)

## Demarrage local

1. Installer les dependances avec `npm install`
2. Creer un projet Supabase
3. Copier `.env.example` vers `.env.local` et renseigner les variables
4. Appliquer la migration SQL de `supabase/migrations/20260329160000_initial_schema.sql`
5. Lancer l'application avec `npm run dev`

## Variables d'environnement

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Base de donnees

Le schema initial Supabase couvre les entites coeur de Milava :

- profils et roles
- profils entreprise et createur
- reseaux sociaux verifies et snapshots de metriques
- campagnes, criteres, assets et reseaux cibles
- candidatures, affectations createurs et posts
- tracking links, clics et conversions
- wallet createur, retraits et transactions de financement
- notifications

## Etat actuel

L'application reste un prototype front. La prochaine etape est de brancher l'authentification Supabase et de remplacer le store demo par de vraies lectures/ecritures PostgreSQL.
