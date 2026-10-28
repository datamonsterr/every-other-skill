# Spec: offline-first order sync

The corner-shop checkout app (phone, Expo) records sales at the till. The shop's internet drops for minutes to hours. A small backend (Rust, Postgres) keeps the price list and the day's totals; the owner's phone reads totals from it.

Requirements:
- A sale is never lost and never counted twice, even if the phone retries after a timeout.
- Prices are set on the owner's phone and must reach every till phone; a till may sell at a stale price while offline, and the record must keep the price actually charged.
- Two till phones may be used at once.
- The owner sees today's totals within a minute of connectivity returning.
- One developer maintains this part-time.
