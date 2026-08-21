# NEXORA Production Deployment

## Recommended simple setup

This build runs with Flask + Gunicorn.

### 1. Configure environment variables

Copy `.env.example` values into your hosting provider's environment settings.

At minimum set:

- `NEXORA_SECRET_KEY`
- `NEXORA_ADMIN_USER`
- `NEXORA_ADMIN_PASS`
- `NEXORA_SITE_URL`
- `NEXORA_HTTPS=1`
- `NEXORA_CONTACT_EMAIL`

Never commit production passwords into the code.

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Start production server

```bash
gunicorn app:app --workers 2 --threads 4 --timeout 60
```

The included `Procfile` uses the same command.

## Email alerts

SMTP alerts are optional. If configured, each new project enquiry sends a notification email.

For Gmail, use a Google App Password rather than your normal account password.

## HTTPS

Production hosting should always use HTTPS. Set:

```text
NEXORA_HTTPS=1
```

This enables secure session cookies.

## Database

This package currently uses SQLite for portability and demos.

For a real multi-user hosted CRM, migrate the lead database to managed PostgreSQL before significant traffic. SQLite is fine for an early low-volume launch but should not be treated as the long-term production database for a growing agency CRM.

## Public launch checklist

- Replace prototype contact information.
- Use a real Nexora domain.
- Configure branded email.
- Change all admin credentials.
- Configure HTTPS.
- Configure SMTP alerts.
- Test mobile layouts.
- Test every form route.
- Test `/admin`.
- Test `/health`.
- Verify `/robots.txt`.
- Verify `/sitemap.xml`.
- Add real legal/privacy pages before collecting production leads.
- Add analytics only after deciding your consent/privacy approach.


## Motion and mobile QA

Before launch, test at minimum:

- iPhone Safari
- Android Chrome
- Desktop Chrome
- Desktop Edge
- Firefox
- reduced-motion accessibility mode
- slow mobile connection
- touch navigation
- form flow from start to submission
- page transitions on all public navigation links

For lower-powered devices, particle effects are intentionally reduced on small screens.


## Three.js / WebGL

V10 uses Three.js for the live hero scenes. The prototype references:

`https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`

For a stricter production setup, vendor the exact Three.js build locally under `static/` and update the script reference. This removes the external runtime dependency and gives you full control over caching.

Test WebGL on:
- Chrome desktop
- Edge desktop
- Firefox
- Safari / iPhone
- Android Chrome

The CSS hero artwork remains available as a fallback when the WebGL scene cannot initialize.
