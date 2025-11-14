# Mini jeu de créatures

Ce projet propose un prototype de mini jeu inspiré des mondes ouverts rétro avec un système de combat tour par tour.

## Démarrer

```bash
npm install
npm run dev
# ou pour une version statique build + live server
npm run serve
```

Ouvrez ensuite [http://localhost:5173](http://localhost:5173) dans votre navigateur.

Pour la commande `npm run serve`, le contenu construit est servi via Lite Server sur [http://localhost:3000](http://localhost:3000).

## Jouabilité

- Choisissez l un des trois monstres de départ dans le Village Émeraude.
- Traversez le pont pour accéder aux Plaines Virescentes et affronter des créatures sauvages.
- Les combats sont au tour par tour : utilisez les flèches pour sélectionner une action et Entrée pour la valider.
- Après une victoire, vos créatures gagnent de l expérience et peuvent évoluer selon leurs statistiques.
