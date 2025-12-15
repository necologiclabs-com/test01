import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateSlotTime } from './slot-time';

describe('Slot Time Calculation Property Tests', () => {
    /**
     * **Feature: data-collection-scheduler, Property 5: スロットタイムの5秒境界への切り捨て**
     * **Validates: Requirements 4.1, 3.2**
     * 
     * For any timestamp, the calculated slot time must have:
     * - Seconds that are a multiple of 5
     * - Value less than or equal to original timestamp
     * - Difference from original timestamp less than 5 seconds
     */
    it('Property 5: truncates any timestamp to 5-second boundary', () => {
        fc.assert(
            fc.property(
                // Generate dates within reasonable range (1970-2100)
                fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') }),
                (timestamp) => {
                    const slotTime = calculateSlotTime(timestamp);
                    const slotDate = new Date(slotTime);

                    // Check 1: Seconds must be a multiple of 5
                    const seconds = slotDate.getUTCSeconds();
                    expect(seconds % 5).toBe(0);

                    // Check 2: Slot time must be <= original timestamp
                    expect(slotDate.getTime()).toBeLessThanOrEqual(timestamp.getTime());

                    // Check 3: Difference must be < 5 seconds (5000 milliseconds)
                    const difference = timestamp.getTime() - slotDate.getTime();
                    expect(difference).toBeLessThan(5000);
                    expect(difference).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: data-collection-scheduler, Property 6: スロットタイム ISO8601 形式**
     * **Validates: Requirements 4.3**
     * 
     * For any calculated slot time, the output string must:
     * - Match ISO8601 pattern YYYY-MM-DDTHH:mm:ssZ
     * - Be parseable back to an equivalent Date
     */
    it('Property 6: outputs valid ISO8601 format', () => {
        fc.assert(
            fc.property(
                // Generate dates within reasonable range (1970-2100)
                fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') }),
                (timestamp) => {
                    const slotTime = calculateSlotTime(timestamp);

                    // Check 1: Must match ISO8601 pattern with second precision
                    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
                    expect(slotTime).toMatch(iso8601Pattern);

                    // Check 2: Must be parseable back to a valid Date
                    const parsedDate = new Date(slotTime);
                    expect(parsedDate.toString()).not.toBe('Invalid Date');

                    // Check 3: Round-trip should produce equivalent timestamp
                    const roundTrip = parsedDate.toISOString();
                    expect(roundTrip).toBe(slotTime);
                }
            ),
            { numRuns: 100 }
        );
    });
});
