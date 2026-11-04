# Lotto Duel tenant

Free lottery-league game living inside `kelatic-booking` at `/lotto`, backed by its **own** Supabase project
(`kelatic-booking`, ref `oospqrsutjiiejbikpof`) — separate auth and data from the salon.

## How it works

```
NY Open Data ──► lotto-fetch-draws (Edge Fn) ──► lotto_draws INSERT
   ▲  pg_cron 05:15 + 13:15 UTC                     │ trigger (pure SQL, no HTTP)
   │                                                ▼
   │                      lotto_entries.matched_numbers updated ──► Realtime ──► /lotto/league/[id]
   │                      lotto_notifications rows queued
   │                                                │ AFTER INSERT (statement) → pg_net async
   │                                                ▼
   └──── 10-min sweep ───────────────────► lotto-alerts (Edge Fn) ──► Twilio SMS
```

- Writes happen only through RPCs (`lotto_create_pool`, `lotto_join_pool`, `lotto_set_phone`) — players can't pick numbers or edit cards.
- Pools lock (`open → live`) at the first counted draw, so late joiners can't enter mid-game.
- Draws only count for pools/cards that existed before that draw (10:59pm ET).
- Roster cap is enforced twice: inside `lotto_join_pool` (row-locked) and by a BEFORE INSERT trigger.

## Tiers

| | Free | Pro ($4.99/mo · $29/yr) |
|---|---|---|
| Players per league | 10 | 100 |
| Games | Powerball | Powerball + Mega Millions |
| Alerts | Live board | Live board + SMS for whole roster |

11th join attempt → player sees "We've let your Commissioner know", Commissioner gets one upgrade text per hour.

## Setup checklist

**Next.js env (`.env.local` + Vercel):**
```
NEXT_PUBLIC_LOTTO_SUPABASE_URL=https://oospqrsutjiiejbikpof.supabase.co
NEXT_PUBLIC_LOTTO_SUPABASE_ANON_KEY=<publishable key from the Lotto project>
```

**Supabase Auth (Lotto project → Authentication → URL Configuration):**
add `https://kelatic.com/lotto/auth/callback` and `http://localhost:3000/lotto/auth/callback` to Redirect URLs.

**Edge Function secrets (Lotto project → Edge Functions → Secrets):**
```
LOTTO_APP_URL=https://kelatic.com
# SMS — leave LOTTO_SMS_ENABLED unset until a Lotto Duel A2P campaign is approved
LOTTO_SMS_ENABLED=true
TWILIO_ACCOUNT_SID=…
TWILIO_AUTH_TOKEN=…
TWILIO_MESSAGING_SERVICE_SID=…   # preferred (or TWILIO_PHONE_NUMBER)
# Billing
LOTTO_STRIPE_SECRET_KEY=sk_…
LOTTO_STRIPE_PRICE_MONTHLY=price_…   # $4.99 / month recurring
LOTTO_STRIPE_PRICE_YEARLY=price_…    # $29 / year recurring
LOTTO_STRIPE_WEBHOOK_SECRET=whsec_…
```

**Stripe webhook endpoint:** `https://oospqrsutjiiejbikpof.supabase.co/functions/v1/lotto-stripe-webhook`
events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

## Deploying changes

```bash
npx supabase --workdir tenants/lotto-duel link --project-ref oospqrsutjiiejbikpof
npx supabase --workdir tenants/lotto-duel db push
npx supabase --workdir tenants/lotto-duel functions deploy lotto-alerts --no-verify-jwt
npx supabase --workdir tenants/lotto-duel functions deploy lotto-fetch-draws --no-verify-jwt
npx supabase --workdir tenants/lotto-duel functions deploy lotto-stripe-webhook --no-verify-jwt
npx supabase --workdir tenants/lotto-duel functions deploy lotto-create-checkout
```

Never run the repo's root `npm run db:push` for Lotto — that targets the salon project.

## Ops queries

```sql
-- what's queued / why texts were skipped
select kind, status, detail, count(*) from lotto_notifications group by 1,2,3;
-- force a draw fetch now
select lotto_kick_fetch_draws();
```

## Legacy prototype tables

`users`, `pools`, `entries`, `draws` (and `process_new_draw()`) in this project are the earlier prototype with
test data only. Nothing here reads them. Drop when ready:
```sql
drop trigger if exists after_draw_insert on draws;
drop function if exists process_new_draw();
drop table if exists entries, pools, draws, users;
```
