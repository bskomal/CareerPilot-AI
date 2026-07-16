/**
 * Formats and parses percentage strings (e.g. "53.41%") to numbers safely.
 * @param {string|number} str - The value to parse
 * @returns {number} The parsed float value
 */
export function parsePercent(str) {
    if (str === undefined || str === null) return 0;
    if (typeof str === 'number') return str;
    const cleanStr = str.replace('%', '').trim();
    const val = parseFloat(cleanStr);
    return isNaN(val) ? 0 : val;
}
