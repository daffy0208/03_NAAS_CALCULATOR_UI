# CSP Quick Reference Guide

## TL;DR - What You Need to Know

The NaaS Calculator uses a **strict Content Security Policy** with hash-based inline script whitelisting. If you modify the inline script in `index.html`, you **must** update the hash.

## When Do I Need to Update the CSP?

### ✅ You MUST update CSP hash if you:
- Modify the inline script block (lines 495-544 in `index.html`)
- Add/remove code in the `<script>` tag between line 495 and 544
- Change whitespace or formatting in the inline script

### ✅ You MUST add to CSP directives if you:
- Add a new CDN library (script or style)
- Connect to a new external API
- Load images from a new domain
- Add new fonts from external sources

### ❌ You DON'T need to update CSP if you:
- Add external script files to `src/` folder
- Modify CSS in `css/styles.css`
- Change HTML markup (only)
- Add new JavaScript files loaded via `<script src="...">`

## How to Update CSP Hash (Step-by-Step)

### Method 1: Using OpenSSL (Linux/Mac/WSL)

```bash
# Navigate to project directory
cd /path/to/naas-calculator

# Extract inline script and generate hash
sed -n '495,544p' index.html | openssl dgst -sha256 -binary | openssl base64

# Copy the output (looks like: b8Duv4onosuoPXMNF3knwXat2tffFvbkhM/qSHQy9u4=)
```

### Method 2: Using Node.js

```javascript
// hash-csp.js
const crypto = require('crypto');
const fs = require('fs');

// Read index.html
const html = fs.readFileSync('index.html', 'utf8');

// Extract inline script (lines 495-544)
const lines = html.split('\n');
const scriptContent = lines.slice(494, 544).join('\n');

// Generate SHA-256 hash
const hash = crypto.createHash('sha256')
    .update(scriptContent)
    .digest('base64');

console.log(`'sha256-${hash}'`);
```

Run: `node hash-csp.js`

### Method 3: Using Browser DevTools

1. Open application in browser
2. Open DevTools Console (F12)
3. Look for CSP violation error (if hash is wrong):
   ```
   Refused to execute inline script because it violates the following Content Security Policy directive:
   "script-src 'self' https://... 'sha256-OLDWRONGHASH'".
   Either the 'unsafe-inline' keyword, a hash ('sha256-CORRECTHASH'), or a nonce...
   ```
4. Copy the correct hash from the error message

### Update index.html

Find line 13 in `index.html`:
```html
'sha256-b8Duv4onosuoPXMNF3knwXat2tffFvbkhM/qSHQy9u4=';
```

Replace the hash with your new hash:
```html
'sha256-YOUR_NEW_HASH_HERE=';
```

## Adding New External Resources

### Adding a CDN Script

1. Add script tag to `index.html`:
```html
<script src="https://example.com/library.js"
        integrity="sha512-..."
        crossorigin="anonymous" async></script>
```

2. Update CSP `script-src` directive:
```html
script-src 'self'
    https://cdnjs.cloudflare.com
    https://cdn.jsdelivr.net
    https://example.com  <!-- ADD THIS -->
    'sha256-...';
```

### Adding a CDN Stylesheet

1. Add link tag:
```html
<link href="https://example.com/styles.css" rel="stylesheet">
```

2. Update CSP `style-src` directive:
```html
style-src 'self'
    'unsafe-inline'
    https://cdn.jsdelivr.net
    https://cdnjs.cloudflare.com
    https://fonts.googleapis.com
    https://example.com  <!-- ADD THIS -->
```

### Adding External API Connection

Update CSP `connect-src` directive:
```html
connect-src 'self'
    https://api.example.com;  <!-- ADD THIS -->
```

## Common CSP Errors

### Error 1: "Refused to execute inline script"
**Cause:** Inline script hash doesn't match
**Solution:** Regenerate hash using methods above

### Error 2: "Refused to load the script 'https://...'"
**Cause:** Script domain not whitelisted in `script-src`
**Solution:** Add domain to `script-src` directive

### Error 3: "Refused to connect to 'https://...'"
**Cause:** API domain not whitelisted in `connect-src`
**Solution:** Add domain to `connect-src` directive

### Error 4: "Refused to load the image 'https://...'"
**Cause:** Usually not an issue (we allow `https:`)
**Solution:** Check if image URL is HTTP (not HTTPS), should auto-upgrade

## Testing Your CSP Changes

### 1. Visual Test
```bash
npm run dev
# Open http://localhost:8000
# Check that everything loads correctly
```

### 2. Console Test
- Open DevTools Console (F12)
- Look for CSP violation errors (red text with "Refused to...")
- Should be **zero** violations

### 3. Automated Test
```bash
# Open in browser
http://localhost:8000/test-csp.html
```

### 4. Feature Test
- [ ] Dashboard loads
- [ ] Components work
- [ ] Wizard navigation functions
- [ ] Import works
- [ ] Export works
- [ ] Loading indicator disappears
- [ ] No console errors

## CSP Directives Cheat Sheet

| Directive | Purpose | Current Value |
|-----------|---------|---------------|
| `default-src` | Fallback for all resources | `'self'` |
| `script-src` | JavaScript execution | `'self'` + CDNs + hash |
| `style-src` | CSS stylesheets | `'self'` + `'unsafe-inline'` + CDNs |
| `font-src` | Font files | `'self'` + Google Fonts + `data:` |
| `img-src` | Images | `'self'` + `data:` + `https:` |
| `connect-src` | AJAX/fetch/WebSocket | `'self'` |
| `object-src` | Plugins (Flash, Java) | `'none'` (blocked) |
| `base-uri` | `<base>` tag URLs | `'self'` |
| `form-action` | Form submission targets | `'self'` |
| `frame-ancestors` | Embedding in iframes | `'none'` (blocked) |

## Quick Decision Tree

```
┌─ Need to modify code in index.html?
│
├─ YES: Modifying inline <script> block?
│   │
│   ├─ YES → Update CSP hash ✓
│   │
│   └─ NO: Just HTML/markup?
│       └─ No CSP update needed ✓
│
└─ Adding external resource?
    │
    ├─ Script/CDN library → Add to script-src ✓
    ├─ Stylesheet/CSS → Add to style-src ✓
    ├─ API endpoint → Add to connect-src ✓
    ├─ Font → Add to font-src ✓
    └─ Image → Usually already allowed (https:) ✓
```

## Emergency: CSP Breaking Production?

### Temporary Fix (NOT recommended for production)
```html
<!-- TEMPORARY ONLY - Remove after fixing -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' *;">
```

### Proper Fix
1. Check browser console for CSP violation errors
2. Identify blocked resource
3. Add appropriate domain to CSP directive
4. Test thoroughly
5. Deploy

## Need More Help?

- **Full Documentation:** `docs/SECURITY_CSP.md`
- **Audit Report:** `docs/CSP_AUDIT_REPORT.md`
- **Test Page:** `test-csp.html`
- **Online Validator:** https://csp-evaluator.withgoogle.com/

## Contact

For CSP-related questions or security concerns, contact the development team.

---

**Last Updated:** 2025-01-27
**Version:** 1.0.0
**Quick Reference for:** Developers modifying index.html or adding external resources
