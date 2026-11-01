# AshariBook auth emails

These templates are pasted into the Supabase dashboard. They intentionally use
`{{ .RedirectTo }}` plus `{{ .TokenHash }}` instead of
`{{ .ConfirmationURL }}`:

- The link goes straight to the app callback (`/auth/callback` on web).
- The app verifies the token with `verifyOtp`, so the link still works if the
  user opens the email in a different browser or device.
- The `RedirectTo` value comes from the app and respects
  `NEXT_PUBLIC_SITE_URL` on web.

## 1. Set the app URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: your production web URL, for example
  `https://app.yourdomain.com`
- **Redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`
  - `https://app.yourdomain.com/auth/callback`
  - `https://app.yourdomain.com/auth/confirm`

On the web deployment, set:

```bash
NEXT_PUBLIC_SITE_URL=https://app.yourdomain.com
```

If `NEXT_PUBLIC_SITE_URL` is missing, the app falls back to the browser origin.
That is convenient locally, but it means a signup started on
`http://localhost:3000` will produce a localhost link. Never ship a production
build without `NEXT_PUBLIC_SITE_URL`.

## 2. Paste the templates

In **Supabase Dashboard → Authentication → Emails**:

### Confirm sign up

Subject:

```text
Confirm your AshariBook email
```

Body: paste the contents of [`confirmation.html`](./confirmation.html).

### Reset password

Subject:

```text
Reset your AshariBook password
```

Body: paste the contents of [`recovery.html`](./recovery.html).

Both templates use the same redirect URL (`.../auth/callback`). The
`type=recovery` parameter tells the callback to open the reset-password screen,
so the recovery link does not need a `next` query string.

## 3. Fix emails landing in spam

Supabase's built-in email sender is intended for development and has tight rate
limits. For production, use **Authentication → Emails → SMTP Settings** with a
real transactional email provider. Resend, Postmark, Amazon SES, and SendGrid all
work.

A reliable setup looks like this:

1. **Verify a domain you own** with the email provider. Do not send from a Gmail,
   Outlook, or other free mailbox.
2. **Use a dedicated subdomain** such as `auth.yourdomain.com` or
   `mail.yourdomain.com`. This isolates auth reputation from your main domain.
3. **Set the sender** to something like
   `AshariBook <no-reply@auth.yourdomain.com>`.
4. **Add the provider's DNS records**:
   - SPF: usually a `TXT` record on the sending subdomain, for example
     `v=spf1 include:_spf.resend.com ~all` (use the exact value from your
     provider).
   - DKIM: the `CNAME` or `TXT` records supplied by the provider.
   - DMARC: start with
     `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`, then move to
     `p=quarantine` once reports look clean.
5. **Use HTTPS links** in production. Localhost links are a spam signal and are
   useless to recipients.
6. **Do not use URL shorteners or click tracking** in auth emails.
7. **Send a test** to a Gmail address and check the headers:
   `spf=pass`, `dkim=pass`, and `dmarc=pass`.
8. Run the message through <https://www.mail-tester.com/> and check Google
   Postmaster Tools after launch.
9. Ask new users to check spam once, then move the message to the inbox and mark
   it as "Not spam". That trains the mailbox for future auth emails.

### Resend example

Use the exact SMTP values Resend shows in its dashboard. A typical setup is:

- Host: `smtp.resend.com`
- Port: `465` (SSL) or `587` (STARTTLS)
- Username: `resend`
- Password: your Resend API key
- Sender email: `no-reply@auth.yourdomain.com`
- Sender name: `AshariBook`

Verify the domain in Resend first. Sending from `onboarding@resend.dev` is fine
for a quick test, but it is not a production sender.

## 4. Test the flows

1. Sign up on web and open the confirmation email in a different browser. The
   link should still confirm the account.
2. Sign in after confirmation.
3. Use **Forgot password?**, open the reset email, choose a new password, and
   sign in again.
4. Check that `/login?error=expired` and `/reset-password` show clear messages
   instead of a blank screen.

## Troubleshooting

- **The link points at localhost in production**: set
  `NEXT_PUBLIC_SITE_URL` and redeploy, then request a fresh email. Existing
  emails keep the old URL.
- **The link says expired**: it was already opened, prefetched by an email
  scanner, or older than the configured expiry. Request a new one.
- **The email is in spam**: finish the SMTP, SPF, DKIM, and DMARC setup above.
  Template changes alone cannot fix deliverability.