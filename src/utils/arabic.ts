// Arabic text normalization for instant POS & Inventory live search

export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Remove tashkeel / diacritics
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alefs
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbuta
    .replace(/ة/g, 'ه')
    // Normalize Yaa / Alif Maqsura
    .replace(/[ىي]/g, 'ي')
    // Convert Arabic-Indic numerals to Latin numerals
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

export function matchesLiveSearch(source: string, query: string): boolean {
  if (!query) return true;
  const normalizedSource = normalizeArabicText(source);
  const normalizedQuery = normalizeArabicText(query);
  return normalizedSource.includes(normalizedQuery);
}
