# Content Security Policy (CSP) Implementation

## Overview

The NaaS Calculator implements a comprehensive Content Security Policy to protect against Cross-Site Scripting (XSS), clickjacking, and other code injection attacks. This document explains the CSP directives, rationale, and maintenance procedures.

## Current CSP Policy

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self'
        https://cdnjs.cloudflare.com
        https://cdn.jsdelivr.net
        'sha256-b8Duv4onosuoPXMNF3knwXat2tffFvbkhM/qSHQy9u4=';
    style-src 'self'
        'unsafe-inline'
        https://cdn.jsdelivr.net
        https://cdnjs.cloudflare.com
        https://fonts.googleapis.com;
    font-src 'self'
        https://fonts.gstatic.com
        data:;
    img-src 'self'
        data:
        https:;
    connect-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
">
```

## Directive Explanations

### `default-src 'self'`
**Purpose:** Fallback for all resource types. Only allows loading from the same origin.
**Security:** Blocks any external resources unless explicitly allowed by specific directives.

### `script-src`
**Purpose:** Controls script execution sources.
**Allowed sources:**
- `'self'` - Application scripts from same origin
- `https://cdnjs.cloudflare.com` - XLSX library
- `https://cdn.jsdelivr.net` - DOMPurify library, Tailwind CSS
- `'sha256-b8Duv4onosuoPXMNF3knwXat2tffFvbkhM/qSHQy9u4='` - Hash for inline initialization script

**Security:** Removed `'unsafe-inline'` and replaced with script hash. This prevents arbitrary inline script execution while allowing the essential initialization code.

### `style-src`
**Purpose:** Controls stylesheet sources.
**Allowed sources:**
- `'self'` - Application styles
- `'unsafe-inline'` - Required for Tailwind utility classes and dynamic styling
- `https://cdn.jsdelivr.net` - Tailwind CDN
- `https://cdnjs.cloudflare.com` - Font Awesome icons
- `https://fonts.googleapis.com` - Google Fonts

**Trade-off:** `'unsafe-inline'` is necessary for Tailwind CSS utility classes. In v2.0, consider using nonces or moving to Tailwind build process.

### `font-src`
**Purpose:** Controls font file sources.
**Allowed sources:**
- `'self'` - Local fonts
- `https://fonts.gstatic.com` - Google Fonts files
- `data:` - Base64-encoded fonts

### `img-src`
**Purpose:** Controls image sources.
**Allowed sources:**
- `'self'` - Local images
- `data:` - Base64-encoded images (icons, logos)
- `https:` - External HTTPS images (for future features)

**Note:** Allows all HTTPS images for flexibility in PDF reports and future integrations.

### `connect-src 'self'`
**Purpose:** Controls AJAX, WebSocket, and fetch() destinations.
**Security:** Only allows API calls to same origin. In v2.0 backend integration, add specific backend domains.

### `object-src 'none'`
**Purpose:** Disables `<object>`, `<embed>`, and `<applet>` elements.
**Security:** Prevents Flash and other plugin-based attacks.

### `base-uri 'self'`
**Purpose:** Restricts `<base>` tag URLs.
**Security:** Prevents attackers from changing base URL to redirect relative links.

### `form-action 'self'`
**Purpose:** Restricts form submission targets.
**Security:** Prevents forms from submitting to external domains.

### `frame-ancestors 'none'`
**Purpose:** Prevents the page from being embedded in frames/iframes.
**Security:** Protects against clickjacking attacks. Equivalent to `X-Frame-Options: DENY`.

### `upgrade-insecure-requests`
**Purpose:** Automatically upgrades HTTP requests to HTTPS.
**Security:** Ensures all resources load over secure connections.

## Additional Security Headers

### `X-Content-Type-Options: nosniff`
Prevents MIME-type sniffing, forces browsers to respect declared content types.

### `X-Frame-Options: DENY`
Legacy header for older browsers that don't support `frame-ancestors`.

### `X-XSS-Protection: 1; mode=block`
Enables browser XSS filter (legacy header for older browsers).

### `Referrer-Policy: strict-origin-when-cross-origin`
Only sends origin when navigating to external sites, sends full URL for same-origin.

### `Permissions-Policy`
Disables unnecessary browser features: geolocation, microphone, camera.

## Inline Script Hash Management

### Current Inline Script
The application has one inline script block (lines 495-544 in index.html) containing:
1. Loading indicator hide logic
2. Error refresh handler
3. CDN fallback mechanism

**Hash:** `sha256-b8Duv4onosuoPXMNF3knwXat2tffFvbkhM/qSHQy9u4=`

### Updating the Hash

If you modify the inline script, you MUST regenerate the hash:

```bash
# Extract the script content (lines 495-544)
sed -n '495,544p' index.html | openssl dgst -sha256 -binary | openssl base64

# Update the hash in the CSP meta tag
```

**Alternative:** Use Node.js to generate hash:
```javascript
const crypto = require('crypto');
const fs = require('fs');

const scriptContent = `/* paste script content here */`;
const hash = crypto.createHash('sha256').update(scriptContent).digest('base64');
console.log(`'sha256-${hash}'`);
```

## Testing CSP

### Browser Console Testing
1. Open browser DevTools (F12)
2. Navigate to Console tab
3. Look for CSP violations - they appear as errors with prefix: `Refused to execute inline script because it violates the following Content Security Policy directive`

### Expected Behavior
- **No CSP violations** should appear in console
- All CDN resources (XLSX, jsPDF, DOMPurify, Tailwind, Font Awesome) should load
- Application should function normally
- Loading indicator should disappear after page load
- All features should work: component configuration, wizard, export, import

### CSP Reporting (Future Enhancement)
Consider adding `report-uri` or `report-to` directive in v1.1:
```
report-uri https://your-domain.com/csp-report;
```

## Known Limitations

### v1.0 Trade-offs

1. **`'unsafe-inline'` for styles:** Required for Tailwind utility classes. Acceptable risk as:
   - Styles can't execute code
   - All user inputs are sanitized via DOMPurify
   - No user-generated CSS accepted

2. **Single inline script:** Essential initialization logic that runs before external scripts load:
   - Loading indicator management
   - Error boundary handler
   - CDN fallback mechanism
   - Protected via SHA-256 hash instead of `'unsafe-inline'`

3. **`https:` for images:** Allows flexibility for:
   - Future external image loading
   - PDF generation with external logos
   - Integration with CRM systems (v2.0)

## Roadmap

### v1.1 Enhancements
- [ ] Move inline script to external file with proper initialization
- [ ] Add CSP reporting endpoint
- [ ] Implement nonces for any new inline scripts
- [ ] Audit third-party CDN dependencies

### v1.5 Advanced Features
- [ ] Remove `'unsafe-inline'` from styles by building Tailwind
- [ ] Implement strict-dynamic for script loading
- [ ] Add subresource integrity (SRI) for all external resources

### v2.0 Backend Integration
- [ ] Configure connect-src for backend API domains
- [ ] Add CSP reporting database storage
- [ ] Implement per-environment CSP policies (dev, staging, prod)
- [ ] Consider CSP nonce generation on server side

## Comparison: Before vs After

### Before (Weak CSP)
```
script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com
```
**Vulnerability:** Any injected script could execute, including XSS payloads.

### After (Strong CSP)
```
script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net 'sha256-...'
```
**Protection:** Only scripts from specific domains or with exact hash can execute. XSS attacks blocked.

## Security Improvements Summary

| Feature | Before | After | Impact |
|---------|--------|-------|--------|
| Script Execution | Permissive (`'unsafe-inline'`) | Restricted (hash-based) | **High** - Blocks XSS |
| Object/Embed | Not restricted | Blocked (`'none'`) | **Medium** - Prevents plugin attacks |
| Framing | Limited | Fully blocked | **Medium** - Prevents clickjacking |
| Base URI | Not restricted | Restricted | **Low** - Prevents base tag injection |
| Form Actions | Not restricted | Same-origin only | **Medium** - Prevents form hijacking |
| HTTPS Upgrade | Not enforced | Enforced | **Medium** - Ensures secure transport |

## Maintenance Checklist

When modifying index.html:

- [ ] If adding inline scripts, regenerate hash and update CSP
- [ ] If adding CDN resources, add domain to appropriate CSP directive
- [ ] Test in browser console for CSP violations
- [ ] Verify all features work after CSP changes
- [ ] Document any new exceptions or trade-offs

## References

- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Can I Use CSP](https://caniuse.com/contentsecuritypolicy)

## Contact

For questions about CSP implementation or to report security issues, contact the development team.

---

**Last Updated:** 2025-01-27
**Version:** 1.0.0
**Reviewed By:** Claude Code (Security Audit)
