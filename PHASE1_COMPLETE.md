# PHASE 1 : AUTHENTIFICATION & PROFILS - IMPLÉMENTÉ ✅

## Fichiers créés

### Services

- **lib/supabase/auth.ts** : Service d'authentification Supabase Auth
  - Signup (entreprise + créateur)
  - Signin avec email/password
  - Password reset
  - Gestion des profils utilisateurs
  - Méthodes pour mettre à jour les profils

### Hooks React

- **hooks/use-auth.ts** : Hook useAuth() pour utiliser l'authentification dans les composants
  - Gère l'état authUser et userProfile
  - Fournit les méthodes signUp, signIn, signOut, updateProfile
  - Écoute les changements d'authentification

### Pages d'authentification

- **app/auth/signup/page.tsx** : Signup pour entreprises
  - Formulaire complet avec validation
  - Création de profile entreprise (nom, pays, site web)
  - Redirection vers /company/profile après inscription

- **app/auth/creator-signup/page.tsx** : Signup pour créateurs
  - Formulaire complet avec validation
  - Création de profile créateur (prénom, nom, pays)
  - Redirection vers /creator/profile après inscription

- **app/auth/signin/page.tsx** : Page de connexion
  - Email + password
  - Redirection automatique vers le bon dashboard

- **app/page.tsx** : Page d'accueil refactorisée
  - Affiche les deux CTA (Entreprise + Créateur)
  - Redirige automatiquement si déjà connecté
  - Design cohérent avec Milava

### Profils utilisateurs complets

- **app/company/profile/page.tsx** : Profil entreprise
  - Form éditable pour tous les champs (nom, secteur, pays, site, téléphone, description)
  - Statut de complétude du profil
  - Bouton "Continuer vers dashboard" seulement si profil complet
  - Déconnexion depuis la page

- **app/creator/profile/page.tsx** : Profil créateur
  - Form éditable pour tous les champs (prénom, nom, pays, bio, téléphone)
  - **Vérification des réseaux sociaux complète** :
    - Ajouter réseau : interface pour ajouter TikTok, Instagram, YouTube, Facebook, X, Snapchat
    - Génération automatique de code unique (6 caractères : format MV + 4 chars) valable 48h
    - Bouton "Vérifier" qui affiche le code
    - Interface "Ajouter le code à votre bio" avec copie One-Click
    - Vérification avec récupération automatique des followers/engagement
    - Affichage des réseaux vérifiés avec badges ✓
    - Indicateur de progression du profil (informations + réseaux + vérification)
  - Déconnexion depuis la page

### Layouts avec protection des routes

- **app/company/layout.tsx** : Layout entreprise
  - Vérification de la connexion et du rôle
  - Redirection vers / si non connecté ou pas une entreprise
  - Navigation sidebar avec items appropriés

- **app/creator/layout.tsx** : Layout créateur
  - Vérification de la connexion et du rôle
  - Redirection vers / si non connecté ou pas un créateur
  - Navigation sidebar avec items appropriés

## Configuration nécessaire

Avant de tester, créez un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role
```

Obtenez ces valeurs depuis votre dashboard Supabase:

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Settings → API → URL et clés

## Flux client complet (Phase 1)

### Pour une entreprise :

1. Clic "S'inscrire" sur /
2. Remplit email, mot de passe, nom entreprise, pays
3. Crée un compte → envoyé vers /company/profile
4. Renseigne les détails optionnels (secteur, site, description)
5. Clique "Continuer vers le tableau de bord" → /company/dashboard

### Pour un créateur :

1. Clic "S'inscrire comme créateur" sur /
2. Remplit email, mot de passe, prénom, nom, pays
3. Crée un compte → envoyé vers /creator/profile
4. Remplit bio et ajoute ses réseaux sociaux
5. Pour chaque réseau :
   - Ajoute URL du profil
   - Clique "Vérifier"
   - Copie le code (ex: MV7K2P)
   - Ajoute le code à la bio de son profil social
   - Clique "Vérifier maintenant"
   - Code vérifié ✓ et followers/engagement récupérés
6. Une fois 1+ réseau vérifié et profil complet : "Continuer vers dashboard" → /creator/dashboard

## Points d'entrée des utilisateurs

- **/auth/signin** : Connexion (tous)
- **/auth/signup** : Inscription entreprise
- **/auth/creator-signup** : Inscription créateur
- **/** : Accueil (redirection auto si connecté)

## Prochaines étapes (Phase 2)

- Création de campagnes
- Marketplace créateurs
- Système de candidatures avec auto-accept 72h
