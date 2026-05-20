## Plan: Admin Password Reset for kgjohn02@gmail.com

The Supabase service role key isn't available in the sandbox shell, so a direct Node script can't run. The clean way is a one-off edge function (edge functions automatically receive `SUPABASE_SERVICE_ROLE_KEY`).

### Steps

1. **Create a temporary edge function** `admin-reset-password` that:
   - Accepts `{ email, newPassword, secret }` in the body.
   - Validates a hardcoded shared secret so it can't be abused while it briefly exists.
   - Looks up the user via `supabase.auth.admin.listUsers` (paged) and matches by email (case-insensitive).
   - Calls `supabase.auth.admin.updateUserById(userId, { password: newPassword })`.

2. **Invoke it once** with:
   - `email`: `kgjohn02@gmail.com`
   - `newPassword`: `Ic3rink$511`

3. **Verify** response is `{ ok: true, email: "kgjohn02@gmail.com" }`.

4. **Delete the edge function immediately** so it can never be called again.

5. **Confirm** login at `/auth` works with the new password.

### Notes
- No app code, schema, or RLS changes.
- The function exists only for a single invocation, then is removed.
- The service role key never leaves the edge function environment.
- Please confirm the email — your previous message said `gjohn02@gmail.com` and this one says `kgjohn02@gmail.com`. I'll use `kgjohn02@gmail.com` from the latest message unless you say otherwise.
