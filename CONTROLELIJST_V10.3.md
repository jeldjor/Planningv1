# Planning-GJsystems v10.3

Basis: `Planning-GJsystems-v10.5-corrected`.

## iPhone

- ✅ Gereed — Geen aanvullende tekst “Planning-GJsystems / Built to fit” onder het menu-logo.
- ✅ Gereed — Profielfoto wordt rond uitgesneden en rond weergegeven.
- ✅ Gereed — Bij kiezen via Instellingen wordt de bestaande interactieve ronde cropper geopend; schuiven en zoomen blijven beschikbaar.
- ✅ Gereed — Bestaande gebruikers worden na laden als beheerkaarten weergegeven.
- ✅ Gereed — Gebruikers kunnen worden bewerkt.
- ✅ Gereed — Voordoen als gebruiker is beschikbaar voor andere gebruikers dan het eigen account.
- ✅ Gereed — Knoppen, teksten en iconen zijn over de volledige iPhone-interface blauw/zilver gemaakt, inclusief Beheer, Vandaag, Pauze en Tijden.
- ✅ Gereed — Ontbrekende `renderOverview` is structureel toegevoegd; aanpassen van vertrektijd bij een lege database veroorzaakt deze fout niet meer.

## Laptop

- ✅ Gereed — Dezelfde ronde cropper en ronde foto-opmaak als op iPhone.
- ✅ Gereed — Maand/Week/Dag en Vastzetten/Losmaken/Optimaliseren staan in dezelfde compacte toolbarregel; op smallere schermen blijft de regel horizontaal beschikbaar.
- ✅ Gereed — Instellingen → Profiel is compact gemaakt zonder functies te verwijderen.
- ✅ Gereed — Alle beheerknoppen zijn blauw met zilveren tekst/iconen.
- ✅ Gereed — Logo linksonder heeft geen wit vlak en geen aanvullende tekst.
- ✅ Gereed — Menu-items zijn groter en schalen met de schermhoogte; de zijbalk gebruikt de beschikbare hoogte zonder normale verticale scrollbar.

## Technische controle

- ✅ Gereed — Alle externe JavaScriptbestanden slagen voor syntaxcontrole.
- ✅ Gereed — Alle 30 ingebedde scripts in laptop- en iPhone-HTML slagen voor syntaxcontrole.
- ✅ Gereed — v10.5-corrected authenticatie, centrale rolcontrole, profielsync, contactthreads en Supabase-migratie zijn behouden.
- ✅ Gereed — ZIP-integriteitscontrole uitgevoerd zonder fouten.

## Installatie

Upload alle bestanden naar de root van de GitHub Pages-repository en vervang de bestaande bestanden. De bestaande `SUPABASE_V10_5_COMPLETE.sql` is ongewijzigd meegeleverd; wanneer deze voor v10.5-corrected al succesvol is uitgevoerd, hoeft hij niet opnieuw te worden uitgevoerd.
