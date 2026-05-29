# Google integrations foundation

Status: prepared for future use, disabled by default.

This folder is only a technical foundation for future Google app integrations in Simplifica 3D. It does not enable Google login, OAuth, Calendar, Drive, Gmail or Sheets.

## Current guarantees

- No Google SDK is installed by this foundation.
- No OAuth flow is active.
- No Google button is added to the UI.
- No Client ID, Client Secret, refresh token or access token is stored here.
- No external Google API is called.
- The current email/password Supabase Auth flow remains unchanged.

## Future feature flags

All flags must remain false until a future activation phase:

- `google_integrations_enabled`
- `google_auth_enabled`
- `google_calendar_enabled`
- `google_drive_enabled`
- `google_gmail_enabled`
- `google_sheets_enabled`

## Future environment variables

These variables are documented for a future secure backend or Supabase Edge Function. Do not expose them in the frontend.

```txt
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_ENCRYPTION_KEY=
```

## Future activation checklist

1. Configure Google OAuth in Google Cloud and Supabase or a secure backend.
2. Store secrets only in backend/Vercel/Supabase secrets.
3. Implement the relevant Supabase Edge Function.
4. Enable the global integration flag.
5. Enable only the specific Google app flag needed for beta users.
6. Validate RLS, logs and token encryption.
7. Add UI entry points only after the backend is ready.

## Files

- `google.config.example.js`: safe example configuration with every feature disabled.
- `googleIntegrationService.js`: placeholder service that returns disabled responses.
- `auth/`, `calendar/`, `drive/`, `gmail/`, `sheets/`: future module boundaries.
