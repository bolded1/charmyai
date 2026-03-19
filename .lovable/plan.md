

## Problem

The build is failing because 12 edge functions import `createClient` from `npm:@supabase/supabase-js@2.57.2`, which Deno cannot resolve without a `deno.json` or `package.json` listing this dependency. The `accounting-sync` function was already fixed in the previous change, but the same issue exists in all other affected files.

## Solution

Replace `npm:@supabase/supabase-js@2.57.2` with `https://esm.sh/@supabase/supabase-js@2` in all 12 affected edge functions. This mirrors the fix already applied to `accounting-sync` and is compatible with Deno without additional configuration.

## Files to Edit (12 files, same one-line change each)

1. `supabase/functions/activate-trial/index.ts`
2. `supabase/functions/admin-broadcast/index.ts`
3. `supabase/functions/admin-subscription/index.ts`
4. `supabase/functions/api-v1/index.ts`
5. `supabase/functions/billing-details/index.ts`
6. `supabase/functions/check-subscription/index.ts`
7. `supabase/functions/create-checkout/index.ts`
8. `supabase/functions/customer-portal/index.ts`
9. `supabase/functions/firm-payment-intent/index.ts`
10. `supabase/functions/setup-intent/index.ts`
11. `supabase/functions/trigger-webhook/index.ts`
12. `supabase/functions/validate-promo-code/index.ts`

In each file, change:
```
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
```
to:
```
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

No other changes needed. This should resolve the build error and allow the preview to reflect your latest code.

