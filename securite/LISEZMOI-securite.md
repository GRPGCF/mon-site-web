# GCF Spa – Sécurité du site après publication

Ce dossier n'est pas à publier. Il regroupe ce qui ne peut pas être réglé dans les pages elles-mêmes.

## 1. À demander à l'hébergeur (Algérie Télécom)

- [ ] Quel serveur web est utilisé : Apache, LiteSpeed ou Nginx ? Les fichiers `.htaccess` sont-ils autorisés ?
- [ ] Un certificat HTTPS est-il fourni (et renouvelé automatiquement) pour `gcfspa.dz` et `www.gcfspa.dz` ?
- [ ] Le site est-il servi sur `gcfspa.dz` ou sur `www.gcfspa.dz` ? (adapter `sitemap.xml`, `robots.txt` et `security.txt` si c'est `www`)
- [ ] Accès de dépôt des fichiers : SFTP/SSH plutôt que FTP en clair ; comptes nominatifs ; double authentification si disponible.
- [ ] Sauvegardes régulières et restauration testée.
- [ ] Mises à jour du serveur et de PHP/modules assurées par l'hébergeur.

## 2. Mise en place du serveur

- **Apache / LiteSpeed** : déposer `.htaccess` (fourni à la racine du site).
- **Nginx** : transmettre `nginx-gcfspa.conf` à l'hébergeur.
- Dans les deux cas, le HSTS démarre à 5 minutes (`max-age=300`). Une fois le site vérifié en HTTPS sur toutes les pages, passer à `31536000` (1 an).
- Après la mise en ligne, tester le site avec des outils publics d'analyse d'en-têtes et de configuration TLS (par exemple securityheaders.com et ssllabs.com/ssltest) et corriger les écarts.

## 3. Messagerie du domaine `gcfspa.dz` (point prioritaire)

Sans ces trois enregistrements DNS, n'importe qui peut envoyer un faux message « de la part de » `alerte@gcfspa.dz`.

| Enregistrement | Rôle | Exemple (à adapter au fournisseur de messagerie) |
|---|---|---|
| SPF (TXT sur `gcfspa.dz`) | liste les serveurs autorisés à envoyer | `v=spf1 include:<fournisseur> -all` |
| DKIM (TXT, selon le sélecteur fourni) | signe les messages sortants | valeur fournie par le fournisseur de messagerie |
| DMARC (TXT sur `_dmarc.gcfspa.dz`) | indique quoi faire des messages falsifiés | commencer par `v=DMARC1; p=none; rua=mailto:contact@gcfspa.dz`, puis passer à `p=quarantine`, puis `p=reject` |

## 4. Boîtes sensibles

- `alerte@gcfspa.dz` : accès limité à des personnes désignées, mot de passe fort et double authentification, accès journalisé, chiffrement TLS imposé en réception et en envoi.
- `anpdp@gcfspa.dz` : même niveau de protection (les demandes contiennent des pièces d'identité).
- Ne jamais transférer ces messages vers des boîtes personnelles.

## 5. Carte d'accès (page d'accueil)

- La carte utilise **Leaflet 1.9.4**, hébergé dans `lib/leaflet/` : ne pas supprimer ce dossier, il fait partie du site.
- Aucune requête externe n'est envoyée avant le clic du visiteur sur « Afficher la carte ». Ensuite, les fonds de carte viennent de `tile.openstreetmap.org` : c'est la seule exception de la politique de sécurité de contenu (CSP), limitée à l'affichage des images.
- La géolocalisation du visiteur est autorisée par la politique `Permissions-Policy: geolocation=(self)` et reste dans son navigateur.
- La position du siège (`data-lat` / `data-lon` dans `index.html`) a été fixée sur les coordonnées exactes fournies : 36°42'36.7"N 3°03'46.6"E. Les positions des filiales (dans `carte.js`) sont au centre de leur commune : les remplacer par des coordonnées exactes si elles sont connues.
- Les conditions d'usage d'OpenStreetMap conviennent à un site à trafic modéré. Si la fréquentation devient importante, prévoir un fournisseur de tuiles dédié.

## 6. Publication sur GitHub Pages

- Déposer **tout** le contenu du dossier `site/`, y compris `lib/leaflet/` (la carte en dépend), `.nojekyll` et `.well-known/`. Si la carte affiche « La carte n'a pas pu être chargée », vérifier que `lib/leaflet/leaflet.js` s'ouvre dans le navigateur (adresse du site + `/lib/leaflet/leaflet.js`) : s'il donne une erreur 404, le dossier n'a pas été envoyé (souvent à cause d'un fichier `.gitignore`).
- `.nojekyll` est nécessaire pour que les fichiers commençant par un point (comme `.well-known/security.txt`) soient publiés.
- GitHub Pages **ignore le fichier `.htaccess`** : les en-têtes de sécurité du serveur ne s'appliquent pas. La politique de sécurité de contenu inscrite dans chaque page (balise `meta`) reste active. Activer « Enforce HTTPS » dans les réglages de Pages.
- Le fichier `.htaccess` et `nginx-gcfspa.conf` ne servent que si le site est hébergé sur un serveur classique (par exemple chez Algérie Télécom).

## 7. Entretien courant

- `/.well-known/security.txt` expire le **18 octobre 2027** : renouveler la date chaque année.
- Revoir chaque année la liste des comptes ayant accès à l'hébergement et à la messagerie.
- Si un formulaire, un outil de statistiques ou une ressource externe (polices, vidéos intégrées, cartes) est ajouté au site, revoir la politique de sécurité de contenu (CSP) dans les pages et dans `.htaccess` : elle bloque aujourd'hui tout chargement externe, sauf les fonds de carte OpenStreetMap.
- Si le contenu des pages est modifié par une autre personne, lui rappeler de ne pas ajouter de code en ligne (`<script>`, `<style>`, attributs `style=`), car la CSP l'empêcherait de fonctionner.
