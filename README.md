# System zarządzania fakturami — Gumijagoda Sp. z o.o.

Aplikacja webowa do ewidencji faktur kosztowych i sprzedażowych: pobieranie z KSeF do bufora,
wgrywanie dokumentów spoza KSeF, kategoryzacja i podgląd faktur w przeglądarce.

> **Stan prac:** szkielet aplikacji wraz z uwierzytelnieniem w środowisku testowym KSeF.
> Model domenowy, rejestr dokumentów, bufor, kategoryzacja i podgląd są w realizacji.

## Uruchomienie

### Jedną komendą (zalecane)

```bash
cp .env.example .env   # uzupełnij KSEF_NIP i KSEF_TOKEN, jeśli chcesz realnej integracji
docker compose up
```

Aplikacja startuje pod `http://localhost:3000` (albo pod portem z `APP_PORT`, jeśli 3000 jest
zajęty). Kontener przy starcie generuje klienta Prismy i wykonuje migracje, więc baza jest gotowa
bez dodatkowych kroków.

### Lokalnie, bez kontenera aplikacji

```bash
docker compose up -d db   # sam PostgreSQL
npm install
npm run db:migrate
npm run dev
```

### Weryfikacja

| Co sprawdzasz               | Jak                                     |
| --------------------------- | --------------------------------------- |
| Aplikacja i baza żyją       | `curl http://localhost:3000/api/health` |
| Poświadczenia KSeF działają | `npm run ksef:spike`                    |

## Konfiguracja

Wszystkie zmienne opisuje `.env.example`. Kluczowe decyzje:

- **`KSEF_CLIENT`** przełącza implementację klienta między `mock` a `http`. Wartością domyślną jest
  `mock`, dzięki czemu projekt uruchamia się i przechodzi testy bez konta w KSeF — integracja nie
  jest twardym wymaganiem startu aplikacji.
- **Poświadczenia KSeF żyją wyłącznie po stronie serwera.** Żadna zmienna nie ma prefiksu
  `NEXT_PUBLIC_`, a `.env` jest w `.gitignore` i w `.vercelignore` (bez tego drugiego CLI Vercela
  wgrywa lokalny plik razem z kodem i wdrożenie próbuje łączyć się z `localhost`).
- **Port bazy to 5433, nie 5432**, żeby nie kolidować z Postgresem uruchomionym już na maszynie.

## Architektura

```
src/
  app/                     warstwa HTTP i UI (route handlers, strony)
    api/health/            kontrola stanu razem z realnym zapytaniem do bazy
  server/                  backend — nie importowany przez komponenty klienckie
    env.ts                 walidacja zmiennych środowiskowych schematem Zod
    infrastructure/
      db/prisma.ts         klient Prismy (adapter pg)
      ksef/                integracja z KSeF: HTTP, uwierzytelnienie, błędy
  components/ui/           komponenty prezentacyjne (shadcn/ui)
scripts/ksef-spike.ts      diagnostyka poświadczeń KSeF z wiersza poleceń
```

Logika biznesowa nie mieszka w komponentach React. `src/server` to granica backendu: strony i route
handlery wołają jego funkcje, ale zależność nigdy nie biegnie w drugą stronę.

### Decyzje techniczne

**Walidacja środowiska jest leniwa.** `getEnv()` sprawdza zmienne przy pierwszym użyciu, nie przy
imporcie modułu. Inaczej `next build` wymagałby kompletu sekretów produkcyjnych na etapie budowania,
mimo że są potrzebne dopiero w runtime. Z tego samego powodu klient Prismy powstaje leniwie
i jest cache'owany na `globalThis` — bez tego każdy hot reload otwierałby nową pulę połączeń.

**Puste zmienne znaczą „brak".** `KSEF_TOKEN=""` w szablonie `.env` to brak wartości, a nie pusty
string; bez tej normalizacji sam skopiowany `.env.example` wywracałby walidację.

**Odpowiedzi KSeF są walidowane w runtime.** Dane z obcego systemu to wejście niezaufane, więc
każda odpowiedź przechodzi przez schemat Zoda zanim opuści warstwę HTTP — rzutowanie typu
w TypeScripcie jest obietnicą bez pokrycia. Schematy opisują wyłącznie pola, z których faktycznie
korzystamy: dodanie pola po stronie Ministerstwa niczego nie zepsuje, a usunięcie potrzebnego
zgłosi się natychmiast, z jego nazwą, zamiast objawić się kilka wywołań dalej jako `undefined`.
Daty zamieniamy na `Date` już na granicy systemu.

**Każde żądanie ma limit czasu** (domyślnie 30 s). Bez niego żądanie do serwera, który przyjął
połączenie i zamilkł, wisiałoby w nieskończoność — a przy nocnym harmonogramie oznaczałoby to
zadanie blokujące kolejne uruchomienia aż do rana.

**Błędy KSeF niosą kod i wskazówkę.** `KsefError` przenosi status HTTP oraz kod KSeF, bo dopiero ich
kombinacja pozwala odróżnić „ponów", „odśwież token" i „popraw konfigurację". Najczęstsze kody mają
przypisane wyjaśnienie przyczyny — opis z API mówi _co_ się stało, ale nie _dlaczego_.

## Integracja z KSeF

Wymagane od modułu uwierzytelnienie realizuje `src/server/infrastructure/ksef/authenticator.ts`.
Przebieg wynika z kontraktu OpenAPI środowiska testowego:

1. `POST /auth/challenge` → challenge i znacznik czasu
2. `GET /security/public-key-certificates` → certyfikat RSA o zastosowaniu `KsefTokenEncryption`
3. RSA-OAEP (SHA-256) na `${token}|${timestampMs}`
4. `POST /auth/ksef-token` → numer referencyjny i token operacji
5. `GET /auth/{referenceNumber}` → odpytywanie do statusu innego niż 100
6. `POST /auth/token/redeem` → token dostępu i token odświeżający

Dwie rzeczy, które kosztowały najwięcej czasu i nie wynikają wprost z dokumentacji: certyfikat
przychodzi jako DER w base64, a towarzyszące pole z gotowym PEM-em bywa puste (klucz publiczny
trzeba wyciągnąć z X.509), oraz uwierzytelnienie jest asynchroniczne — `POST` tylko je inicjuje,
a wynik trzeba odpytać osobnym żądaniem.

### Skrypt diagnostyczny

```bash
npm run ksef:spike
```

`scripts/ksef-spike.ts` nie zawiera własnej logiki — woła dokładnie ten sam kod co aplikacja
i wypisuje kolejne kroki. Odpowiada na pytanie „czy moje poświadczenia i wybrane środowisko
działają", pozwalając odróżnić błąd konfiguracji od błędu w kodzie bez uruchamiania całej aplikacji.
Token KSeF generuje się jednorazowo w [Aplikacji Podatnika](https://ap-test.ksef.mf.gov.pl)
(Tokeny → Generuj token), z uprawnieniem _przeglądanie faktur_.

## Stack

Next.js 16 (App Router) w TypeScripcie ze `strict`, PostgreSQL z Prismą 7 (adapter `pg`), Zod do
walidacji, Tailwind CSS z shadcn/ui, Docker Compose do uruchomienia lokalnego.

## Znane ograniczenia

- Model domenowy i główne ścieżki (rejestr, bufor, upload, ręczne pobieranie z KSeF) są
  zaimplementowane; brakuje jeszcze m.in. harmonogramu, pełnej kategoryzacji UI i podglądu PDF/XML.
- Ręczne pobieranie z KSeF używa `POST /invoices/query/metadata` + pobrania XML po numerze KSeF
  (nie paczki eksportu). Przy limicie 10 000 rekordów klient kontynuuje zapytanie od daty ostatniego
  rekordu; jeśli mimo to wynik pozostaje ucięty, import zapisuje ostrzeżenie w `ImportRun.error`.
- Server Actions przechwytujące błędy muszą przepuszczać wyjątki `redirect()` Next.js
  (`isRedirectError` z wewnętrznego modułu `next/dist/...`) — inaczej udany redirect wygląda jak
  błąd `NEXT_REDIRECT`.
- Obraz Dockera jest deweloperski (hot reload), nie produkcyjny wielostopniowy build.
- Kontener używa `npm install` zamiast `npm ci`: lockfile generowany na macOS/arm64 nie zawiera
  opcjonalnych zależności platformowych, których npm żąda na Linuksie.
