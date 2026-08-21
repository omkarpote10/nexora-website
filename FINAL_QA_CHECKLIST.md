# NEXORA Final QA Checklist

## Visual
- Check homepage WebGL scene loads.
- Verify CSS fallback still works if Three.js is blocked.
- Verify service/work/about/contact hero scenes.
- Check scroll-story chapter transitions.
- Verify no section overlaps at common desktop widths.
- Verify mobile spacing at 360px, 390px, 430px widths.

## Navigation
- Test every top-nav link.
- Test mobile menu.
- Test page transitions.
- Test footer links.
- Test Privacy and Terms.

## Forms
- Complete every project brief step.
- Try invalid email.
- Try missing required fields.
- Submit a real test lead.
- Confirm lead appears in admin dashboard.
- Change lead status.
- Add note.
- Add activity.
- Test Email action.
- Test WhatsApp action if phone exists.

## Admin
- Change default credentials before launch.
- Verify logout.
- Verify admin routes are not linked publicly.
- Verify delete confirmation.

## SEO
- Check title/description on all pages.
- Verify canonical URL.
- Verify favicon.
- Open /robots.txt.
- Open /sitemap.xml.
- Verify production NEXORA_SITE_URL.

## Security
- Set a strong NEXORA_SECRET_KEY.
- Set secure admin password.
- Use HTTPS.
- Set NEXORA_HTTPS=1.
- Configure SMTP using an app password.
- Do not commit production credentials.

## Performance
- Test mobile Chrome on a real Android phone.
- Test iPhone Safari if available.
- Test with reduced-motion enabled.
- Test slower connection.
- Consider hosting Three.js locally instead of CDN.

## Legal / Business
- Replace starter Privacy and Terms with reviewed final versions.
- Replace placeholder email/phone/domain.
- Add actual firm/company details where legally required.
- Verify concept projects remain clearly labeled.
