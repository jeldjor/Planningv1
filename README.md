# Planning-GJsystems v3.2 modular

Upload de inhoud van deze map naar GitHub Pages.

Belangrijkste wijziging:
- `laptop.html` is opgeschoond.
- CSS staat nu in `css/app.css`.
- JavaScript staat nu in `js/app.js`.
- Supabase koppeling blijft aanwezig.
- Mobiele versie is meegenomen als `mobile.html` zonder groene versiebadge.

Open daarna:
- laptop: `https://jeldjor.github.io/Planningv1/laptop.html?v=32`
- mobiel: `https://jeldjor.github.io/Planningv1/mobile.html?v=64clean`

## v3.9 live synchronisatie
De laptop haalt wijzigingen uit `planning` en `visit_history` automatisch op bij openen, bij terugkeren naar het tabblad, iedere 30 seconden en via Supabase Realtime wanneer dit voor de tabellen is ingeschakeld. Een klant die op de iPhone wordt afgerond, verschijnt daardoor op de laptop met dezelfde status, activiteit en samenvatting.
