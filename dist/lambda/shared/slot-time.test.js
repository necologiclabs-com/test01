"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fc = __importStar(require("fast-check"));
const slot_time_1 = require("./slot-time");
(0, vitest_1.describe)('Slot Time Calculation Property Tests', () => {
    /**
     * **Feature: data-collection-scheduler, Property 5: スロットタイムの5秒境界への切り捨て**
     * **Validates: Requirements 4.1, 3.2**
     *
     * For any timestamp, the calculated slot time must have:
     * - Seconds that are a multiple of 5
     * - Value less than or equal to original timestamp
     * - Difference from original timestamp less than 5 seconds
     */
    (0, vitest_1.it)('Property 5: truncates any timestamp to 5-second boundary', () => {
        fc.assert(fc.property(
        // Generate dates within reasonable range (1970-2100)
        fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') }), (timestamp) => {
            const slotTime = (0, slot_time_1.calculateSlotTime)(timestamp);
            const slotDate = new Date(slotTime);
            // Check 1: Seconds must be a multiple of 5
            const seconds = slotDate.getUTCSeconds();
            (0, vitest_1.expect)(seconds % 5).toBe(0);
            // Check 2: Slot time must be <= original timestamp
            (0, vitest_1.expect)(slotDate.getTime()).toBeLessThanOrEqual(timestamp.getTime());
            // Check 3: Difference must be < 5 seconds (5000 milliseconds)
            const difference = timestamp.getTime() - slotDate.getTime();
            (0, vitest_1.expect)(difference).toBeLessThan(5000);
            (0, vitest_1.expect)(difference).toBeGreaterThanOrEqual(0);
        }), { numRuns: 100 });
    });
    /**
     * **Feature: data-collection-scheduler, Property 6: スロットタイム ISO8601 形式**
     * **Validates: Requirements 4.3**
     *
     * For any calculated slot time, the output string must:
     * - Match ISO8601 pattern YYYY-MM-DDTHH:mm:ssZ
     * - Be parseable back to an equivalent Date
     */
    (0, vitest_1.it)('Property 6: outputs valid ISO8601 format', () => {
        fc.assert(fc.property(
        // Generate dates within reasonable range (1970-2100)
        fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') }), (timestamp) => {
            const slotTime = (0, slot_time_1.calculateSlotTime)(timestamp);
            // Check 1: Must match ISO8601 pattern with second precision
            const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
            (0, vitest_1.expect)(slotTime).toMatch(iso8601Pattern);
            // Check 2: Must be parseable back to a valid Date
            const parsedDate = new Date(slotTime);
            (0, vitest_1.expect)(parsedDate.toString()).not.toBe('Invalid Date');
            // Check 3: Round-trip should produce equivalent timestamp
            const roundTrip = parsedDate.toISOString();
            (0, vitest_1.expect)(roundTrip).toBe(slotTime);
        }), { numRuns: 100 });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2xvdC10aW1lLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9sYW1iZGEvc2hhcmVkL3Nsb3QtdGltZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQThDO0FBQzlDLCtDQUFpQztBQUNqQywyQ0FBZ0Q7QUFFaEQsSUFBQSxpQkFBUSxFQUFDLHNDQUFzQyxFQUFFLEdBQUcsRUFBRTtJQUNsRDs7Ozs7Ozs7T0FRRztJQUNILElBQUEsV0FBRSxFQUFDLDBEQUEwRCxFQUFFLEdBQUcsRUFBRTtRQUNoRSxFQUFFLENBQUMsTUFBTSxDQUNMLEVBQUUsQ0FBQyxRQUFRO1FBQ1AscURBQXFEO1FBQ3JELEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsRUFDckUsQ0FBQyxTQUFTLEVBQUUsRUFBRTtZQUNWLE1BQU0sUUFBUSxHQUFHLElBQUEsNkJBQWlCLEVBQUMsU0FBUyxDQUFDLENBQUM7WUFDOUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFcEMsMkNBQTJDO1lBQzNDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN6QyxJQUFBLGVBQU0sRUFBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTVCLG1EQUFtRDtZQUNuRCxJQUFBLGVBQU0sRUFBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUVwRSw4REFBOEQ7WUFDOUQsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLE9BQU8sRUFBRSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1RCxJQUFBLGVBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEMsSUFBQSxlQUFNLEVBQUMsVUFBVSxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUNKLEVBQ0QsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQ25CLENBQUM7SUFDTixDQUFDLENBQUMsQ0FBQztJQUVIOzs7Ozs7O09BT0c7SUFDSCxJQUFBLFdBQUUsRUFBQywwQ0FBMEMsRUFBRSxHQUFHLEVBQUU7UUFDaEQsRUFBRSxDQUFDLE1BQU0sQ0FDTCxFQUFFLENBQUMsUUFBUTtRQUNQLHFEQUFxRDtRQUNyRCxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEVBQ3JFLENBQUMsU0FBUyxFQUFFLEVBQUU7WUFDVixNQUFNLFFBQVEsR0FBRyxJQUFBLDZCQUFpQixFQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTlDLDREQUE0RDtZQUM1RCxNQUFNLGNBQWMsR0FBRywrQ0FBK0MsQ0FBQztZQUN2RSxJQUFBLGVBQU0sRUFBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFekMsa0RBQWtEO1lBQ2xELE1BQU0sVUFBVSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLElBQUEsZUFBTSxFQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFdkQsMERBQTBEO1lBQzFELE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMzQyxJQUFBLGVBQU0sRUFBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUNKLEVBQ0QsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQ25CLENBQUM7SUFDTixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVzY3JpYmUsIGl0LCBleHBlY3QgfSBmcm9tICd2aXRlc3QnO1xyXG5pbXBvcnQgKiBhcyBmYyBmcm9tICdmYXN0LWNoZWNrJztcclxuaW1wb3J0IHsgY2FsY3VsYXRlU2xvdFRpbWUgfSBmcm9tICcuL3Nsb3QtdGltZSc7XHJcblxyXG5kZXNjcmliZSgnU2xvdCBUaW1lIENhbGN1bGF0aW9uIFByb3BlcnR5IFRlc3RzJywgKCkgPT4ge1xyXG4gICAgLyoqXHJcbiAgICAgKiAqKkZlYXR1cmU6IGRhdGEtY29sbGVjdGlvbi1zY2hlZHVsZXIsIFByb3BlcnR5IDU6IOOCueODreODg+ODiOOCv+OCpOODoOOBrjXnp5LlooPnlYzjgbjjga7liIfjgormjajjgaYqKlxyXG4gICAgICogKipWYWxpZGF0ZXM6IFJlcXVpcmVtZW50cyA0LjEsIDMuMioqXHJcbiAgICAgKiBcclxuICAgICAqIEZvciBhbnkgdGltZXN0YW1wLCB0aGUgY2FsY3VsYXRlZCBzbG90IHRpbWUgbXVzdCBoYXZlOlxyXG4gICAgICogLSBTZWNvbmRzIHRoYXQgYXJlIGEgbXVsdGlwbGUgb2YgNVxyXG4gICAgICogLSBWYWx1ZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gb3JpZ2luYWwgdGltZXN0YW1wXHJcbiAgICAgKiAtIERpZmZlcmVuY2UgZnJvbSBvcmlnaW5hbCB0aW1lc3RhbXAgbGVzcyB0aGFuIDUgc2Vjb25kc1xyXG4gICAgICovXHJcbiAgICBpdCgnUHJvcGVydHkgNTogdHJ1bmNhdGVzIGFueSB0aW1lc3RhbXAgdG8gNS1zZWNvbmQgYm91bmRhcnknLCAoKSA9PiB7XHJcbiAgICAgICAgZmMuYXNzZXJ0KFxyXG4gICAgICAgICAgICBmYy5wcm9wZXJ0eShcclxuICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlIGRhdGVzIHdpdGhpbiByZWFzb25hYmxlIHJhbmdlICgxOTcwLTIxMDApXHJcbiAgICAgICAgICAgICAgICBmYy5kYXRlKHsgbWluOiBuZXcgRGF0ZSgnMTk3MC0wMS0wMScpLCBtYXg6IG5ldyBEYXRlKCcyMTAwLTEyLTMxJykgfSksXHJcbiAgICAgICAgICAgICAgICAodGltZXN0YW1wKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2xvdFRpbWUgPSBjYWxjdWxhdGVTbG90VGltZSh0aW1lc3RhbXApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNsb3REYXRlID0gbmV3IERhdGUoc2xvdFRpbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayAxOiBTZWNvbmRzIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA1XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Vjb25kcyA9IHNsb3REYXRlLmdldFVUQ1NlY29uZHMoKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3Qoc2Vjb25kcyAlIDUpLnRvQmUoMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIDI6IFNsb3QgdGltZSBtdXN0IGJlIDw9IG9yaWdpbmFsIHRpbWVzdGFtcFxyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChzbG90RGF0ZS5nZXRUaW1lKCkpLnRvQmVMZXNzVGhhbk9yRXF1YWwodGltZXN0YW1wLmdldFRpbWUoKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIDM6IERpZmZlcmVuY2UgbXVzdCBiZSA8IDUgc2Vjb25kcyAoNTAwMCBtaWxsaXNlY29uZHMpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlmZmVyZW5jZSA9IHRpbWVzdGFtcC5nZXRUaW1lKCkgLSBzbG90RGF0ZS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGRpZmZlcmVuY2UpLnRvQmVMZXNzVGhhbig1MDAwKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoZGlmZmVyZW5jZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgeyBudW1SdW5zOiAxMDAgfVxyXG4gICAgICAgICk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICoqRmVhdHVyZTogZGF0YS1jb2xsZWN0aW9uLXNjaGVkdWxlciwgUHJvcGVydHkgNjog44K544Ot44OD44OI44K/44Kk44OgIElTTzg2MDEg5b2i5byPKipcclxuICAgICAqICoqVmFsaWRhdGVzOiBSZXF1aXJlbWVudHMgNC4zKipcclxuICAgICAqIFxyXG4gICAgICogRm9yIGFueSBjYWxjdWxhdGVkIHNsb3QgdGltZSwgdGhlIG91dHB1dCBzdHJpbmcgbXVzdDpcclxuICAgICAqIC0gTWF0Y2ggSVNPODYwMSBwYXR0ZXJuIFlZWVktTU0tRERUSEg6bW06c3NaXHJcbiAgICAgKiAtIEJlIHBhcnNlYWJsZSBiYWNrIHRvIGFuIGVxdWl2YWxlbnQgRGF0ZVxyXG4gICAgICovXHJcbiAgICBpdCgnUHJvcGVydHkgNjogb3V0cHV0cyB2YWxpZCBJU084NjAxIGZvcm1hdCcsICgpID0+IHtcclxuICAgICAgICBmYy5hc3NlcnQoXHJcbiAgICAgICAgICAgIGZjLnByb3BlcnR5KFxyXG4gICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgZGF0ZXMgd2l0aGluIHJlYXNvbmFibGUgcmFuZ2UgKDE5NzAtMjEwMClcclxuICAgICAgICAgICAgICAgIGZjLmRhdGUoeyBtaW46IG5ldyBEYXRlKCcxOTcwLTAxLTAxJyksIG1heDogbmV3IERhdGUoJzIxMDAtMTItMzEnKSB9KSxcclxuICAgICAgICAgICAgICAgICh0aW1lc3RhbXApID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzbG90VGltZSA9IGNhbGN1bGF0ZVNsb3RUaW1lKHRpbWVzdGFtcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIDE6IE11c3QgbWF0Y2ggSVNPODYwMSBwYXR0ZXJuIHdpdGggc2Vjb25kIHByZWNpc2lvblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzbzg2MDFQYXR0ZXJuID0gL15cXGR7NH0tXFxkezJ9LVxcZHsyfVRcXGR7Mn06XFxkezJ9OlxcZHsyfVxcLlxcZHszfVokLztcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3Qoc2xvdFRpbWUpLnRvTWF0Y2goaXNvODYwMVBhdHRlcm4pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayAyOiBNdXN0IGJlIHBhcnNlYWJsZSBiYWNrIHRvIGEgdmFsaWQgRGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUgPSBuZXcgRGF0ZShzbG90VGltZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHBhcnNlZERhdGUudG9TdHJpbmcoKSkubm90LnRvQmUoJ0ludmFsaWQgRGF0ZScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayAzOiBSb3VuZC10cmlwIHNob3VsZCBwcm9kdWNlIGVxdWl2YWxlbnQgdGltZXN0YW1wXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm91bmRUcmlwID0gcGFyc2VkRGF0ZS50b0lTT1N0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChyb3VuZFRyaXApLnRvQmUoc2xvdFRpbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICB7IG51bVJ1bnM6IDEwMCB9XHJcbiAgICAgICAgKTtcclxuICAgIH0pO1xyXG59KTtcclxuIl19