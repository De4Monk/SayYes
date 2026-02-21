/**
 * Date utilities for SayYes ERP — standardized timezone handling for Asia/Tbilisi (UTC+4).
 * All dashboard queries should use these helpers to avoid timezone drift.
 */

const TIMEZONE = 'Asia/Tbilisi';
const OFFSET_HOURS = 4; // UTC+4

/**
 * Returns the current Date adjusted to Tbilisi local time context.
 * Note: JS Date is always UTC internally, but this gives us correct local values
 * when we extract year/month/day for query boundaries.
 */
function getTbilisiDate() {
    const now = new Date();
    // Shift UTC time by +4 hours to get Tbilisi "wall clock" values
    return new Date(now.getTime() + OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Returns ISO string boundaries for "today" in Asia/Tbilisi.
 * Use these for Supabase `.gte()` / `.lte()` range queries on timestamptz columns.
 * @returns {{ startOfDay: string, endOfDay: string }}
 */
export function getTodayBounds() {
    const tbilisi = getTbilisiDate();
    const year = tbilisi.getUTCFullYear();
    const month = String(tbilisi.getUTCMonth() + 1).padStart(2, '0');
    const day = String(tbilisi.getUTCDate()).padStart(2, '0');

    // Midnight in Tbilisi = 20:00 previous day UTC (UTC+4)
    // We express the bounds as proper ISO with the timezone offset
    return {
        startOfDay: `${year}-${month}-${day}T00:00:00+04:00`,
        endOfDay: `${year}-${month}-${day}T23:59:59+04:00`,
    };
}

/**
 * Returns ISO string boundaries for the same weekday last week in Asia/Tbilisi.
 * Used for revenue trend comparison.
 * @returns {{ startOfDay: string, endOfDay: string }}
 */
export function getLastWeekSameDayBounds() {
    const tbilisi = getTbilisiDate();
    tbilisi.setUTCDate(tbilisi.getUTCDate() - 7);

    const year = tbilisi.getUTCFullYear();
    const month = String(tbilisi.getUTCMonth() + 1).padStart(2, '0');
    const day = String(tbilisi.getUTCDate()).padStart(2, '0');

    return {
        startOfDay: `${year}-${month}-${day}T00:00:00+04:00`,
        endOfDay: `${year}-${month}-${day}T23:59:59+04:00`,
    };
}

/**
 * Returns ISO string boundaries for the current calendar month in Asia/Tbilisi.
 * @returns {{ startOfMonth: string, endOfMonth: string }}
 */
export function getCurrentMonthBounds() {
    const tbilisi = getTbilisiDate();
    const year = tbilisi.getUTCFullYear();
    const month = String(tbilisi.getUTCMonth() + 1).padStart(2, '0');

    // Last day of month
    const lastDay = new Date(Date.UTC(year, tbilisi.getUTCMonth() + 1, 0)).getUTCDate();

    return {
        startOfMonth: `${year}-${month}-01T00:00:00+04:00`,
        endOfMonth: `${year}-${month}-${String(lastDay).padStart(2, '0')}T23:59:59+04:00`,
    };
}

/**
 * Formats a date string for display in Tbilisi timezone.
 * @param {string} isoString — ISO timestamp from DB
 * @param {Intl.DateTimeFormatOptions} options — formatting options
 * @returns {string}
 */
export function formatTbilisi(isoString, options = {}) {
    return new Date(isoString).toLocaleString('ru-RU', {
        timeZone: TIMEZONE,
        ...options,
    });
}

/**
 * Returns the localized weekday name for "today" in Tbilisi.
 * @returns {string} e.g. "вторник"
 */
export function getTodayWeekdayName() {
    return formatTbilisi(new Date().toISOString(), { weekday: 'long' });
}

/**
 * Returns a formatted "today" date header string for dashboards.
 * @returns {string} e.g. "вторник, 22 фев."
 */
export function getTodayDateHeader() {
    return formatTbilisi(new Date().toISOString(), {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });
}
