# Gumijagody — rejestr faktur

Aplikacja do ewidencji faktur Gumijagoda Sp. z o.o. (kosztowe i sprzedażowe): lista z filtrami, pobieranie z KSeF do bufora, upload PDF/XML, kategorie, podgląd w przeglądarce.

Repozytorium: https://github.com/Klara923/gumijagody  
Wdrożenie: https://gumijagody-khaki.vercel.app

Hasło: `gumijagoda`  
(zadanie dopuszcza jednego użytkownika, więc jest zwykłe hasło w `APP_PASSWORD`, bez ról)

## Uruchomienie lokalne

```bash
cp .env.example .env
docker compose up --build
```

W `.env.example` jest już `KSEF_NIP=4728391059` (Gumijagoda z fixture’ów XML). Bez tego NIP-u upload XML nie wie, czy faktura jest kosztowa czy sprzedażowa. Token lokalnie nie jest potrzebny — `KSEF_CLIENT=mock`.

Compose robi `prisma generate`, migracje, seed i `dev`. Seed jest idempotentny — kolejny start nie dubluje faktur.

Aplikacja: http://localhost:3000  
Baza: Postgres na porcie **5433** (żeby nie gryźć się z lokalnym Postgresem na 5432).

Bez Dockera: własny Postgres, `npm install`, `npx prisma migrate deploy`, `npm run db:seed`, `npm run dev`.

Na Vercel ustawiłam `KSEF_CLIENT=http` + `KSEF_NIP` + `KSEF_TOKEN` w zmiennych serwera, nie w repo. Jak token przestaje działać, diagnostyka to `npm run ksef:spike`.

## Architektura (dlaczego tak)

Stack z PDF: Next.js App Router + TypeScript, Prisma, PostgreSQL, Zod, node-cron.

Świadomie rozdzieliłam warstwy:

- `src/app` / `src/components` — UI, formularze, listy
- `src/server` — dokumenty, kategorie, KSeF, walidacja, zapis do bazy

Nie chciałam mieć zapytań Prisma w komponentach React.

Bufor to flaga `stage` na dokumencie (`BUFFER` / `ACCEPTED`), nie osobna tabela. To ten sam dokument, tylko przed akceptacją. Przy imporcie i uploadzie ląduje w buforze; wpis ręczny od razu do rejestru, bo nie ma pliku do sprawdzenia.

KSeF schowałam za interfejsem (`mock` albo `http` w `src/server/infrastructure/ksef`). Lokalnie odpalam mock bez tokena, na Vercel podmieniam klienta na prawdziwe API testowe. Import idzie przez query metadata i tnie run do 50 faktur — pełnego `/invoices/exports` nie robiłam.

XML FA(2)/FA(3) sam wypełnia pola. PDF wymaga metadanych, plik zostaje załącznikiem. Kategoria: najpierw to co ktoś wybierze ręcznie, potem domyślna z kontrahenta, na końcu słowo kluczowe.

## Research

Patrzyłam na Aplikację Podatnika KSeF i na takie rzeczy jak wFirma / inFakt — wszędzie jest poczekalnia i dopiero potem rejestr, nie od razu księgowanie. Tę kolejkę (bufor → akceptacja) wzięłam. Nie robię dekretacji ani JPK, bo to było poza zakresem; tu chodzi o ogarnięcie dokumentów, a nie o pełną księgowość.

## Założenia

- Przy XML kierunek (koszt / sprzedaż) biorę z tego, czy `KSEF_NIP` jest nabywcą czy sprzedawcą.
- Duplikat: ten sam numer u tego samego kontrahenta (`@@unique`), ten sam numer KSeF (`@unique`) albo ten sam checksum pliku (`Attachment.checksum @unique`). Przed zapisem sprawdzam w kodzie i wracam 409 na polu pliku; constraint w bazie łapie wyścig przy równoległym wgraniu.
- Harmonogram może mieć kilka godzin na dobę. Lokalnie node-cron sprawdza co minutę i odpala import tylko gdy bieżąca godzina jest w ustawieniach. Na Vercel Hobby cron z `vercel.json` woła endpoint **raz na dobę** (`0 0 * * *`) — to za mało, żeby trafić w kilka slotów. Dlatego na produkcji cron-job.org bije `POST /api/cron/ksef` **co minutę** (Bearer `CRON_SECRET`). Większość ticków wraca `skipped` (`Brak slotu`); import idzie tylko w godzinach z Harmonogramu, bez `?force=1`.
- Zoom PDF zostawiłam w iframe przeglądarki. Własny viewer to sporo roboty, a zadanie i tak każe pokazać PDF w aplikacji.
- Import KSeF idzie przez `POST /invoices/query/metadata` i tnie się do 50 faktur na run. Endpoint eksportu (`/invoices/exports`) pominęłam — to kolejka, szyfrowanie i ZIP, na demo z krótkim zakresem dat nie ma sensu.

Z opcjonalnych rzeczy z sekcji 11 zrobiłam: NIP z wykazu VAT, białą listę rachunku i kategorie po słowach kluczowych (np. „transport”, „opakowan”).

## Dane testowe

Po starcie compose (albo `npm run db:seed` bez Dockera):

- w rejestrze: `FV/SEED/RECZNY/001` (Orlen, wpis ręczny) i `FV/SEED/KSEF/001` (transport, źródło KSeF)
- w buforze: `FK-SEED/FA2` (XML ABC AGD)
- drzewo: Materiały → Opakowania, Usługi → Transport

Do ręcznego uploadu są pliki w `fixtures/ksef/`: `FA2.xml`, `FA3.xml` oraz `FA2-05`…`FA2-08` i `FA3-05`…`FA3-08` (unikalne numery, żeby nie łapać 409). Są też `FA2-01`–`04` i `FA3-01`–`04` — nieużywane w seedzie ani w opisanym demo.

Na uploadzie XML nabywca w fixture to ten sam NIP `4728391059` — musi być w `KSEF_NIP` (w `.env.example` już jest).

Reguły słów (`transport` → Transport, `opakowan` → Opakowania) działają tylko przy **nowym** dokumencie i tylko gdy nie ma ręcznie wybranej kategorii ani domyślnej kategorii kontrahenta. Seed `FV/SEED/KSEF/001` ma kategorię wpisaną z góry — to nie jest test automatu.

## Jak sprawdzić extra (sekcja 11)

Słowa kluczowe: **Ręczny**, kontrahent `Euro Transport Sp. z o.o.`, kategoria pusta. Po zapisie w rejestrze ma być **Transport**. `Trans-Euro` się nie łapie — w nazwie nie ma słowa `transport`. Kontrola: ten sam wpis z Orlenem (ma domyślne Materiały) zostaje przy **Materiały**, nawet gdy w numerze jest `transport`. XML: `FA2-08.xml` (nazwa „Opakowań” i pozycja „opakowania zbiorcze”) albo `FA3-08.xml` (tylko nazwa „Opakowań” — pozycja to „folia i kartony”, bez słowa `opakowan`). W buforze kategoria = **Opakowania**.

NIP z wykazu: **Ręczny** albo **Wgraj**, w polu NIP `7740001454` (Orlen), **Pobierz z wykazu** — nazwa i adres powinny się uzupełnić.

Biała lista: po uzupełnieniu kontrahenta wklej NRB/IBAN i **Sprawdź na białej liście**. Komunikat mówi, czy rachunek jest na wykazie dla tego NIP (albo że API nie potwierdziło).

## Testy

```bash
npm test          # Jest (parser XML, kategorie, kolumny, NIP/rachunek)
npm run test:e2e  # Playwright: wpis ręczny → rejestr oraz upload XML → bufor → akceptacja → rejestr → podgląd
```

Playwright przy XML potrzebuje `KSEF_NIP=4728391059`. Na wdrożeniu i tak kliknij tę ścieżkę raz ręcznie (inne env niż lokalny mock).

## Ograniczenia

Nie ma `POST /invoices/exports`. Przy większej liczbie faktur query metadata przestanie wystarczać (na produkcji jest limit wywołań na godzinę).

Vercel Hobby nie odpali harmonogramu co godzinę sam z siebie (`vercel.json`: raz o północy UTC). Żeby godziny z Harmonogramu wstawały na prodzie, cron-job.org woła ten sam endpoint co minutę; aplikacja sama pomija tick poza slotem.

PDF nie ma moich przycisków zoom, tylko to co daje przeglądarka w ramce.

Nie ma wystawiania do KSeF, Excela, POS-a ani pełnej księgowości — tak było w zadaniu.

## Co zrobiłabym dalej

Gdyby to miało iść w prawdziwy użytek, w pierwszej kolejności dodałabym ten asynchroniczny export z KSeF, bo 50 faktur na run to świadomy strop pod demo. Harmonogram na Hobby zostawiłabym na zewnętrznym cronie albo na płatnym planie Vercela — tick co minutę już jest, tylko nie z `vercel.json`. Gdyby iframe PDF sypał się w jakiejś przeglądarce, wtedy własny podgląd stron. Z filtrów w rejestrze dałoby się jeszcze dołożyć szukanie po numerze faktury — po typie, kontrahencie, datach i kategorii już jest.
