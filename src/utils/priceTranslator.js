const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Translates Gujarati numerals to standard English digits.
 * @param {string} str - String containing numerals
 * @returns {string} String with standard digits
 */
export function translateGujaratiToEnglish(str) {
  if (typeof str !== 'string') return String(str || '');
  let result = str;
  for (let i = 0; i < 10; i++) {
    const reg = new RegExp(gujaratiDigits[i], 'g');
    result = result.replace(reg, englishDigits[i]);
  }
  return result;
}

/**
 * Translates standard English digits to Gujarati numerals.
 * @param {string|number} str - String or number containing digits
 * @returns {string} String with Gujarati numerals
 */
export function translateEnglishToGujarati(str) {
  const s = String(str);
  let result = s;
  for (let i = 0; i < 10; i++) {
    const reg = new RegExp(englishDigits[i], 'g');
    result = result.replace(reg, gujaratiDigits[i]);
  }
  return result;
}

/**
 * Parses a price value that might contain Gujarati digits and text descriptions.
 * Converts to a clean JavaScript float number.
 * @param {string|number} priceInput - Raw price value
 * @returns {number} Parsed float number
 */
export function parsePrice(priceInput) {
  if (priceInput === undefined || priceInput === null) return 0;
  if (typeof priceInput === 'number') return priceInput;

  let str = String(priceInput).trim();

  // Translate Gujarati digits to standard digits
  str = translateGujaratiToEnglish(str);

  // Extract decimal number
  const match = str.match(/-?[0-9]+(?:\.[0-9]+)?/);
  if (match) {
    const val = parseFloat(match[0]);
    return isNaN(val) ? 0 : val;
  }

  return 0;
}

/**
 * Formats a price value dynamically based on language locale.
 * @param {number|string} priceVal - Numeric value or raw string
 * @param {string} lang - Language code ('en' or 'gu')
 * @returns {string} Formatted price label
 */
export function formatPrice(priceVal, lang = 'en') {
  const num = typeof priceVal === 'number' ? priceVal : parsePrice(priceVal);
  const formattedEnglish = num.toFixed(2);

  if (lang === 'gu') {
    const guNum = translateEnglishToGujarati(formattedEnglish);
    return `₹ ${guNum}`;
  }

  return `₹ ${formattedEnglish}`;
}
