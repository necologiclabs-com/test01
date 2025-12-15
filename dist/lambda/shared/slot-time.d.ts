/**
 * Calculates slot time by truncating timestamp to nearest 5-second boundary
 *
 * Requirements: 4.1, 4.2, 4.3
 * - Truncates seconds to nearest multiple of 5
 * - Preserves boundary values (e.g., 05, 10, 15 remain unchanged)
 * - Returns ISO8601 format with second precision (YYYY-MM-DDTHH:mm:ssZ)
 *
 * @param timestamp - Any Date object
 * @returns ISO8601 string with seconds truncated to 5-second boundary
 *
 * @example
 * calculateSlotTime(new Date('2025-12-02T10:23:07Z')) // "2025-12-02T10:23:05Z"
 * calculateSlotTime(new Date('2025-12-02T10:23:05Z')) // "2025-12-02T10:23:05Z"
 * calculateSlotTime(new Date('2025-12-02T10:23:13Z')) // "2025-12-02T10:23:10Z"
 */
export declare function calculateSlotTime(timestamp: Date): string;
