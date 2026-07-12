# Verplichte eindcontrole Planning-GJsystems v10.6

## Laptop

- ✅ Gereed — Centrale beheerdersrol hersteld via `is_app_admin()`.
- ✅ Gereed — Beheer-module alleen zichtbaar voor beheerders.
- ✅ Gereed — Laptop en iPhone gebruiken dezelfde rolstatus in `GJ_AUTH.isAdmin`.
- ✅ Gereed — Dagweergave bestaat en geselecteerde maandkalenderdag opent de gekoppelde dagroute.
- ✅ Gereed — Blauwe knoppen hebben zilveren tekst en iconen.
- ✅ Gereed — Vorige/volgende kalenderpijlen zijn zilver.
- ✅ Gereed — Responsive menu gebruikt de hoogte zonder normale verticale scrollbar.
- ✅ Gereed — Laptop- en iPhone-menu gebruiken hetzelfde transparante logo, formaat en uitlijning.
- ✅ Gereed — Dubbele CSS-tekst onder het logo wordt niet meer weergegeven.

## Instellingen en onderhoud

- ✅ Gereed — Iedere gebruiker en beheerder heeft Gegevens beheren onder Instellingen.
- ✅ Gereed — Planning legen.
- ✅ Gereed — Vaste afspraken legen.
- ✅ Gereed — Niet ingepland legen.
- ✅ Gereed — Historie legen.
- ✅ Gereed — Routecache legen.
- ✅ Gereed — Database legen.
- ✅ Gereed — Alles resetten.
- ✅ Gereed — Back-up downloaden en herstellen.
- ✅ Gereed — Alle externe verwijderacties zijn beperkt tot de actieve werkruimte en vereisen `BEVESTIG`.

## Profiel en wachtwoord

- ✅ Gereed — Profielfoto centraal via Supabase Storage en profiel-URL.
- ✅ Gereed — Wijzigen uitsluitend via Instellingen → Profiel.
- ✅ Gereed — Rond crop-kader.
- ✅ Gereed — Foto verschuiven.
- ✅ Gereed — Foto zoomen.
- ✅ Gereed — Live cropvoorbeeld.
- ✅ Gereed — Oud wachtwoord, nieuw wachtwoord en herhaling.
- ✅ Gereed — Beveiligingscriteria en validatie vóór opslaan.

## iPhone en talen

- ✅ Gereed — Nederlands.
- ✅ Gereed — Engels.
- ✅ Gereed — Duits.
- ✅ Gereed — Taal wordt centraal opgeslagen en door laptop en iPhone geladen.
- ✅ Gereed — Ontbrekende mobiele `renderOverview()` is structureel hersteld.

## Contact

- ✅ Gereed — Contactmodule en Beheer → Contact gebruiken dezelfde threads.
- ✅ Gereed — Chatberichten door gebruiker en beheerder.
- ✅ Gereed — Bijlagen tot 10 MB via private Storage-bucket.
- ✅ Gereed — Bijlagen worden per thread getoond en via tijdelijke beveiligde URL geopend.
- ✅ Gereed — Statussen nieuw, in behandeling, beantwoord en gesloten.
- ✅ Gereed — Zoeken, statusfilter en alleen-ongelezenfilter.
- ✅ Gereed — Leesstatus en ongelezen meldingsbadges.
- ✅ Gereed — Realtime verversen van threads, berichten en bijlagen.

## Architectuur en controle

- ✅ Gereed — Eigen lokale en centrale werkruimte per gebruiker.
- ✅ Gereed — Kernreads en writes worden automatisch op `user_id` van de actieve werkruimte gefilterd.
- ✅ Gereed — Voordoen als gebruiker wisselt de actieve lokale én Supabase-werkruimte.
- ✅ Gereed — Terugknop beëindigt voordoen als gebruiker.
- ✅ Gereed — Bestaande klanten, planning, afwezigheid, profiel, taal en contactgegevens blijven behouden door de migratie.
- ✅ Gereed — Alle externe JavaScriptbestanden slagen voor syntaxcontrole.
- ✅ Gereed — Alle 30 ingebedde laptop- en iPhone-scripts slagen voor syntaxcontrole.
- ✅ Gereed — `SUPABASE_V10_6_COMPLETE.sql` is succesvol gevalideerd tegen Planningv1 in een teruggedraaide PostgreSQL-transactie.
- ✅ Gereed — ZIP-integriteitscontrole uitgevoerd zonder fouten.
