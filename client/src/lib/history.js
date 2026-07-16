const HISTORY_KEY = 'careerpilot_match_history';

/**
 * Retrieves the match history list from LocalStorage.
 * @returns {Object[]} The list of history records
 */
export function getHistory() {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('Error reading match history:', err.message);
        return [];
    }
}

/**
 * Pushes a new item into history (caps at 20 items).
 * @param {Object} item - Match record to save
 */
export function pushHistory(item) {
    try {
        const list = getHistory();
        const newItem = {
            id: item.id || Date.now().toString(),
            resumeName: item.resumeName || 'Parsed Resume',
            jobSnippet: item.jobSnippet || '',
            matchPercentage: typeof item.matchPercentage === 'string' ? parseFloat(item.matchPercentage) : item.matchPercentage,
            overallScore: item.overallScore || 'Moderate Match',
            missingSkills: item.missingSkills || [],
            timestamp: item.timestamp || new Date().toISOString()
        };
        
        // Add to the front
        list.unshift(newItem);
        
        // Cap at last 20
        const capped = list.slice(0, 20);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(capped));
    } catch (err) {
        console.error('Error saving match history:', err.message);
    }
}

/**
 * Clears all match history from LocalStorage.
 */
export function clearHistory() {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (err) {
        console.error('Error clearing match history:', err.message);
    }
}
