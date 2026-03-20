# 🎮 Which Pokémon Are You — Dev Routine

## Le matin — démarrer

Ouvre `cmd` et tape :

```
cd C:\Users\johan.trigeard\Documents\Perso\which-pokemon-are-you
```
```
claude
```

## Le soir — éteindre

Dans le terminal Claude Code :
```
Ctrl + C
```
ou tape `/exit` puis Entrée.

Puis push tes changements sur GitHub :
```
git add . && git commit -m "end of day" && git push
```

---

## Astuce — Raccourci Bureau

Lance cette commande une seule fois dans `cmd` pour créer un double-clic de lancement sur le Bureau :

```
echo cd C:\Users\johan.trigeard\Documents\Perso\which-pokemon-are-you ^& claude > %USERPROFILE%\Desktop\PokemonDev.bat
```

→ Un fichier `PokemonDev.bat` apparaît sur ton Bureau.
→ Double-clic le matin, Claude Code se lance directement dans ton projet.

---

## Workflow Design → Code

```
Claude.ai (vision) → Figma (design) → Claude.ai (brief) → Claude Code (code) → Browser (review) → loop
```

1. **Claude.ai** — brainstorm, drafts visuels, décisions
2. **Figma** — affiner le design, exporter les écrans en PNG
3. **Claude.ai** — partager les screenshots, générer le brief technique
4. **Claude Code** — coller le brief, builder le projet
5. **localhost:5173** — vérifier le résultat
6. Recommencer

---

## Infos projet

- **Repo GitHub** : https://github.com/EDYHEAN/which-pokemon-are-you
- **Framework** : Vite + React
- **Dev server** : http://localhost:5173
