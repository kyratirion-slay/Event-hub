@AGENTS.md

# Event Hub — projectdocumentatie

Nederlandstalige eventmanagement-webapp (werkplek voor een eventmanager). Alle UI-tekst is in het Nederlands; houd dat zo.

## Stack & conventies

- **Next.js 16.2.4** (App Router), React 19, TypeScript, Tailwind CSS v4.
- Alle pagina's zijn `"use client"`. Er is geen backend/database: alle data leeft in **localStorage** via één React context-store: `lib/store.tsx` (`useStore()`). Types staan in `lib/types.ts`, seeddata in `lib/mockData.ts`.
- Styling: Tailwind utility-classes gecombineerd met inline `style={{}}` en CSS-variabelen uit `app/globals.css` (`--background`, `--card`, `--border`, `--muted`, `--foreground`, `--accent` (roze #e86fa3), `--accent-light`, `--sidebar`).
- Werkbranch: `claude/build-event-hub-YIJk0`. Commit en push daarnaartoe; nooit naar een andere branch.
- `node_modules` ontbreekt in deze omgeving; build/dev draait bij de gebruiker lokaal. Verifieer wijzigingen dus door zorgvuldig lezen, niet via `npm run build`.

## Paginastructuur

| Route | Bestand | Doel |
|---|---|---|
| `/` | `app/page.tsx` | Dashboard: stats, eventgrid met zoekbalk, takenwidget (2/5 breed) met alle open todo's gegroepeerd per event in de eventkleur |
| `/events` | `app/events/page.tsx` | Eventoverzicht + modal voor nieuw event (naam, datum, tijden, locatie, gasten, kleur) |
| `/events/[id]` | `app/events/[id]/page.tsx` (~1800 regels) | Eventdetail met tabs: Programma, To do's, Uitwerking (briefing), Budget, Tijdlijn, Communicatie, Notities (zwevende notitievensters) |
| `/vergaderingen` | `app/vergaderingen/page.tsx` | "Notities" in de sidebar: rich-text notities per event/subcategorie (contenteditable + execCommand) |
| `/communicatie` | `app/communicatie/page.tsx` | Overzicht van de communicatielijnen van álle events (zelfde data als de Communicatie-tab per event; gedeeld component `components/CommPlan.tsx`) |
| `/leveranciers` | `app/leveranciers/page.tsx` | Leveranciersdatabase met categorieën, filters, detailpaneel |
| `/draaiboeken`, `/mail` | bestaan nog als code, maar zijn **uit de sidebar verwijderd** (bewust; gebruiker wilde ze niet meer). Mailgenerator (`app/api/generate-mail/route.ts`) vereist `ANTHROPIC_API_KEY` in `.env.local` en werd nooit werkend opgeleverd. |

Sidebar (`components/Sidebar.tsx`) bevat alleen: Dashboard, Events, Notities, Communicatie, Leveranciers.

## Communicatielijn-feature

Per event een stappenplan voor uitnodigingen/reminders richting genodigden:
- `Event.inviteDate?` (ISO) + `Event.commSteps?: CommStep[]` (`lib/types.ts`); stappen hebben ISO-datums (`YYYY-MM-DD`), i.t.t. de rest van de app die Nederlandse datumstrings gebruikt.
- Template-generator + datumhelpers in `lib/communication.ts`: `generateCommSteps(inviteIso, eventDateStr)` genereert stappen rond twee ankers (uitnodigingsdatum, eventdatum); reminders schalen mee met de lengte van het traject en worden geklemd vóór de RSVP-deadline.
- Gedeeld component `components/CommPlan.tsx` (`CommPlanEditor`) wordt gebruikt door zowel de Communicatie-tab in het event als `/communicatie` — beide plekken tonen dus automatisch dezelfde data.
- Dashboard (`app/page.tsx`) heeft een `CommAlertsBlock`: stappen die niet af zijn en binnen 7 dagen vallen (of te laat zijn) verschijnen bovenaan met eventkleur en badge (te laat = rood, vandaag/deze week = amber). Dit zijn de "reminders" — er is geen server, dus geen e-mail/push.

## Belangrijke datamodel-details (`lib/types.ts`)

- `Event`: o.a. `guests`, `coverColor` (kleur per event, overal gebruikt voor visuele herkenning), `totalBudget`, `budgetIsIncl?` (of het budgetplafond incl. of excl. BTW is), `program: ProgramDay[]`, `todos`, `budgetCategories`, `timeline`, `noteWindows`, `briefing`.
- `Todo`: `text`, `status`, `deadline?`, `category`, `notes?` — notes is een mini-omschrijving onder de titel (subtiel veld, zichtbaar bij hover of wanneer gevuld).
- `BudgetLineItem`: `amountExclVat` + `vatRate` (%). Incl. BTW wordt altijd berekend, nooit opgeslagen.

## Valkuilen / geleerde lessen (niet opnieuw doen)

1. **Tailwind v4 preflight reset zet `list-style: none` op alle `ul`/`ol`.** Bullets in contenteditable-editors vereisen `!important`-overrides (`list-style-type: disc !important`, `padding-left`, en `display: list-item !important` op `li`). Dit is al gefixt in zowel `/vergaderingen` als `/events/[id]` via een `<style>`-tag in de pagina. Bij nieuwe contenteditable-plekken: zelfde override toevoegen.
2. **Spellcheck**: `<html lang="nl">` staat in `app/layout.tsx`; alle inputs/textareas/contenteditables hebben `spellCheck={true}`. Bij nieuwe tekstvelden ook toevoegen.
3. **Budget-tab**: excl./incl. BTW-kolommen moeten strikt gescheiden blijven (excl-kolom = som van `amountExclVat`, incl-kolom = excl + BTW). Er is een totaalrij onderin de tabel en een excl./incl.-toggle naast het totaalbudget; voortgangsbalk en "Rest" volgen de gekozen modus. Ook een "Per persoon"-blok (totaal incl. én excl. gedeeld door `event.guests`, alleen zichtbaar bij guests > 0).
4. **Programma-tab**: tijdkolom is auto-breed (`min-w-[2.5rem]`, geen vaste breedte) zodat "13:00 - 17:00" past; de verticale tijdlijn is een lijnsegment per item (geen absolute lijn op containerniveau).
5. **InlineEdit / InlineNumber** (bovenin `app/events/[id]/page.tsx`) zijn de standaard klik-om-te-bewerken componenten; hergebruik die in plaats van nieuwe te schrijven.
6. Store-mutaties: altijd via `useStore()`-methodes in `lib/store.tsx`; nieuwe velden ook daar registreren (interface + useCallback + provider-value) en optioneel (`?`) maken in het type i.v.m. bestaande localStorage-data van de gebruiker.

## Werkwijze

- Gebruiker schrijft in het Nederlands; antwoord in het Nederlands.
- Kleine, gerichte commits met duidelijke messages; direct pushen na elke afgeronde wijziging.
- Bestaande data van de gebruiker (localStorage) mag nooit verloren gaan door schema-wijzigingen — nieuwe velden altijd optioneel.
