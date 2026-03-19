

## Problem

The demo upload fails because the storage key (`demo/{sessionId}/{file.name}`) passes the raw filename directly. Filenames with spaces, special characters, or non-Latin characters (e.g. Greek `ΕΤΟΣ`) produce an "Invalid key" error from Storage.

## Solution

Sanitize the filename before using it as a storage key. Replace non-alphanumeric characters (except dots, hyphens, underscores) with underscores, and transliterate or strip non-ASCII characters.

## File to Edit

**`src/components/demo/DemoUploader.tsx`** (1 change)

Add a filename sanitizer and apply it when building `filePath`:

```typescript
// Before line 79, add helper:
const sanitizeName = (name: string) =>
  name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // strip diacritics
    .replace(/[^a-zA-Z0-9._-]/g, "_")                  // replace unsafe chars
    .replace(/_+/g, "_");                               // collapse multiple underscores

// Line 79 changes from:
const filePath = `demo/${sessionId}/${file.name}`;
// to:
const filePath = `demo/${sessionId}/${sanitizeName(file.name)}`;
```

This also applies to the main app uploader in `src/hooks/useDocuments.ts` if the same pattern exists there -- will check and fix both.

