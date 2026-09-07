# 🚀 Guide de déploiement — Dashboard happn x LGU

Ton dashboard est prêt. Il te reste **3 étapes** (~10 min) pour le mettre en ligne avec le temps réel. Aucune compétence technique requise, tu ne fais que copier-coller.

---

## Étape 1 — Créer la base partagée (Supabase) · 5 min

C'est ce qui permet à happn de voir tes saisies **en temps réel**.

1. Va sur **https://supabase.com** → *Start your project* → connecte-toi (Google ou GitHub).
2. Clique **New project**. Donne-lui un nom (ex. `happn-lgu`), choisis une région (Europe/Paris), et un mot de passe de base de données (garde-le quelque part). Clique **Create**.
3. Attends ~2 min que le projet se crée.
4. Dans le menu de gauche, ouvre **SQL Editor** → **New query**.
5. Ouvre le fichier **`supabase_schema.sql`** (fourni), copie **tout** son contenu, colle-le dans l'éditeur, puis clique **Run** (en bas à droite). Tu dois voir « Success ».
6. Va dans **Project Settings** (roue crantée) → **API**. Note ces deux valeurs :
   - **Project URL** (ex. `https://abcd1234.supabase.co`)
   - **anon public** key (une longue chaîne qui commence par `eyJ…`)

---

## Étape 2 — Renseigner tes clés · 1 min

1. Ouvre le fichier **`config.js`**.
2. Colle tes deux valeurs entre les guillemets :
   ```js
   window.SUPABASE_URL      = "https://abcd1234.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJhbGciOiJ…";
   ```
3. Enregistre le fichier.

---

## Étape 3 — Mettre en ligne sur Vercel · 3 min

1. Va sur **https://vercel.com** → connecte-toi (GitHub, GitLab ou email).
2. La méthode la plus simple : installe l'outil en ligne de commande, ou utilise le **glisser-déposer** :
   - Option A (glisser-déposer) : sur **https://vercel.com/new**, cherche l'option d'import de dossier, ou zippe le dossier `happn-dashboard` et dépose-le.
   - Option B (recommandée, via GitHub) : crée un dépôt GitHub, mets-y les 4 fichiers (`index.html`, `app.js`, `config.js`, + le SQL/guide), puis sur Vercel : **New Project → Import** ce dépôt → **Deploy**.
3. Vercel te donne une **URL publique** (ex. `https://happn-lgu.vercel.app`).

**C'est en ligne !** 🎉

---

## Partager à happn

Envoie simplement l'URL Vercel à ta cliente. Elle verra le dashboard se mettre à jour **en temps réel** à chaque fois que tu ajoutes un contenu.

> 🔒 **Lecture seule pour happn ?** Par défaut, toute personne avec le lien peut aussi ajouter/supprimer. Si tu veux que happn soit en lecture seule stricte, dis-le moi : on ajoute un petit mot de passe côté saisie (5 min de plus). Pour un usage entre partenaires de confiance, la version actuelle suffit largement.

---

## Bon à savoir

- **Les captures d'écran** sont compressées automatiquement (max 1000 px, qualité 70%) pour rester légères. Elles sont stockées dans la base avec chaque contenu.
- **Sans config Supabase**, le dashboard fonctionne quand même en « mode local » (données sur ton navigateur uniquement) — pratique pour tester avant de déployer.
- **Export CSV** : le bouton en haut du tableau sort toutes les données pour un reporting Excel/Sheets.
- **Sécurité des clés** : la clé `anon` est faite pour être publique dans le navigateur, aucun risque à la mettre dans `config.js`.
