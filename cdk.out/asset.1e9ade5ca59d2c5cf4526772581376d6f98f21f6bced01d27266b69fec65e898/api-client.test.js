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
const api_client_1 = require("./api-client");
/**
 * Property-based tests for API client
 * Requirements: 2.2, 2.3
 */
(0, vitest_1.describe)('API Client Property Tests', () => {
    /**
     * **Feature: data-collection-scheduler, Property 3: ISO8601 形式での API URL 構築**
     * **Validates: Requirements 2.2, 2.3**
     *
     * For any valid time window with from/to dates, the constructed URL should contain
     * properly formatted ISO8601 query parameters that can be parsed back to equivalent timestamps.
     */
    (0, vitest_1.it)('Property 3: URL construction with ISO8601 format', () => {
        fc.assert(fc.property(
        // Generate valid ISO8601 timestamps
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), fc.integer({ min: 1, max: 3600 }), // Duration in seconds
        fc.webUrl(), // Base URL
        (startDate, durationSeconds, baseUrl) => {
            // Create time window
            const from = startDate.toISOString();
            const toDate = new Date(startDate.getTime() + durationSeconds * 1000);
            const to = toDate.toISOString();
            // Build URL
            const url = (0, api_client_1.buildApiUrl)(baseUrl, from, to);
            // Parse URL to extract query parameters
            const urlObj = new URL(url);
            const fromParam = urlObj.searchParams.get('from');
            const toParam = urlObj.searchParams.get('to');
            // Verify parameters exist
            (0, vitest_1.expect)(fromParam).toBeTruthy();
            (0, vitest_1.expect)(toParam).toBeTruthy();
            // Verify parameters can be parsed back to equivalent timestamps
            const parsedFrom = new Date(fromParam);
            const parsedTo = new Date(toParam);
            (0, vitest_1.expect)(parsedFrom.toISOString()).toBe(from);
            (0, vitest_1.expect)(parsedTo.toISOString()).toBe(to);
            // Verify URL structure
            (0, vitest_1.expect)(url).toContain('/response_count');
            (0, vitest_1.expect)(url).toContain('from=');
            (0, vitest_1.expect)(url).toContain('to=');
        }), { numRuns: 100 });
    });
    /**
     * **Feature: data-collection-scheduler, Property 4: API レスポンスパースのラウンドトリップ**
     * **Validates: Requirements 2.3**
     *
     * For any valid JSON response containing from, to, and count fields, parsing should produce
     * a structured object with equivalent values that can be serialized back to equivalent JSON.
     */
    (0, vitest_1.it)('Property 4: API response parse round-trip', () => {
        fc.assert(fc.property(
        // Generate valid API response data
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), fc.integer({ min: 1, max: 3600 }), fc.integer({ min: 0, max: 10 }), (startDate, durationSeconds, count) => {
            const from = startDate.toISOString();
            const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
            const to = endDate.toISOString();
            // Create original response object
            const originalResponse = { from, to, count };
            // Serialize to JSON
            const jsonString = JSON.stringify(originalResponse);
            // Parse back
            const parsedResponse = JSON.parse(jsonString);
            // Verify round-trip consistency
            (0, vitest_1.expect)(parsedResponse.from).toBe(originalResponse.from);
            (0, vitest_1.expect)(parsedResponse.to).toBe(originalResponse.to);
            (0, vitest_1.expect)(parsedResponse.count).toBe(originalResponse.count);
            // Verify structure
            (0, vitest_1.expect)(typeof parsedResponse.from).toBe('string');
            (0, vitest_1.expect)(typeof parsedResponse.to).toBe('string');
            (0, vitest_1.expect)(typeof parsedResponse.count).toBe('number');
            // Verify timestamps are valid ISO8601
            const fromDate = new Date(parsedResponse.from);
            const toDateParsed = new Date(parsedResponse.to);
            (0, vitest_1.expect)(fromDate.toISOString()).toBe(parsedResponse.from);
            (0, vitest_1.expect)(toDateParsed.toISOString()).toBe(parsedResponse.to);
        }), { numRuns: 100 });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLWNsaWVudC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGFtYmRhL2NvbGxlY3Rvci9hcGktY2xpZW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtQ0FBOEM7QUFDOUMsK0NBQWlDO0FBQ2pDLDZDQUEyQztBQUczQzs7O0dBR0c7QUFFSCxJQUFBLGlCQUFRLEVBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO0lBQ3ZDOzs7Ozs7T0FNRztJQUNILElBQUEsV0FBRSxFQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtRQUN4RCxFQUFFLENBQUMsTUFBTSxDQUNMLEVBQUUsQ0FBQyxRQUFRO1FBQ1Asb0NBQW9DO1FBQ3BDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsRUFDckUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsc0JBQXNCO1FBQ3pELEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxXQUFXO1FBQ3hCLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUNwQyxxQkFBcUI7WUFDckIsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxlQUFlLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDdEUsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRWhDLFlBQVk7WUFDWixNQUFNLEdBQUcsR0FBRyxJQUFBLHdCQUFXLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUUzQyx3Q0FBd0M7WUFDeEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUIsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFOUMsMEJBQTBCO1lBQzFCLElBQUEsZUFBTSxFQUFDLFNBQVMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQy9CLElBQUEsZUFBTSxFQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRTdCLGdFQUFnRTtZQUNoRSxNQUFNLFVBQVUsR0FBRyxJQUFJLElBQUksQ0FBQyxTQUFVLENBQUMsQ0FBQztZQUN4QyxNQUFNLFFBQVEsR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFRLENBQUMsQ0FBQztZQUVwQyxJQUFBLGVBQU0sRUFBQyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUMsSUFBQSxlQUFNLEVBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXhDLHVCQUF1QjtZQUN2QixJQUFBLGVBQU0sRUFBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUN6QyxJQUFBLGVBQU0sRUFBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDL0IsSUFBQSxlQUFNLEVBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FDSixFQUNELEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUNuQixDQUFDO0lBQ04sQ0FBQyxDQUFDLENBQUM7SUFFSDs7Ozs7O09BTUc7SUFDSCxJQUFBLFdBQUUsRUFBQywyQ0FBMkMsRUFBRSxHQUFHLEVBQUU7UUFDakQsRUFBRSxDQUFDLE1BQU0sQ0FDTCxFQUFFLENBQUMsUUFBUTtRQUNQLG1DQUFtQztRQUNuQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEVBQ3JFLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUNqQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDL0IsQ0FBQyxTQUFTLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ2xDLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEdBQUcsZUFBZSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUVqQyxrQ0FBa0M7WUFDbEMsTUFBTSxnQkFBZ0IsR0FBZ0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDO1lBRTFELG9CQUFvQjtZQUNwQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFcEQsYUFBYTtZQUNiLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFnQixDQUFDO1lBRTdELGdDQUFnQztZQUNoQyxJQUFBLGVBQU0sRUFBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hELElBQUEsZUFBTSxFQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEQsSUFBQSxlQUFNLEVBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUxRCxtQkFBbUI7WUFDbkIsSUFBQSxlQUFNLEVBQUMsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELElBQUEsZUFBTSxFQUFDLE9BQU8sY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoRCxJQUFBLGVBQU0sRUFBQyxPQUFPLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFbkQsc0NBQXNDO1lBQ3RDLE1BQU0sUUFBUSxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxNQUFNLFlBQVksR0FBRyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakQsSUFBQSxlQUFNLEVBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6RCxJQUFBLGVBQU0sRUFBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELENBQUMsQ0FDSixFQUNELEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUNuQixDQUFDO0lBQ04sQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlc2NyaWJlLCBpdCwgZXhwZWN0IH0gZnJvbSAndml0ZXN0JztcclxuaW1wb3J0ICogYXMgZmMgZnJvbSAnZmFzdC1jaGVjayc7XHJcbmltcG9ydCB7IGJ1aWxkQXBpVXJsIH0gZnJvbSAnLi9hcGktY2xpZW50JztcclxuaW1wb3J0IHsgQXBpUmVzcG9uc2UgfSBmcm9tICcuLi9zaGFyZWQvdHlwZXMnO1xyXG5cclxuLyoqXHJcbiAqIFByb3BlcnR5LWJhc2VkIHRlc3RzIGZvciBBUEkgY2xpZW50XHJcbiAqIFJlcXVpcmVtZW50czogMi4yLCAyLjNcclxuICovXHJcblxyXG5kZXNjcmliZSgnQVBJIENsaWVudCBQcm9wZXJ0eSBUZXN0cycsICgpID0+IHtcclxuICAgIC8qKlxyXG4gICAgICogKipGZWF0dXJlOiBkYXRhLWNvbGxlY3Rpb24tc2NoZWR1bGVyLCBQcm9wZXJ0eSAzOiBJU084NjAxIOW9ouW8j+OBp+OBriBBUEkgVVJMIOani+eviSoqXHJcbiAgICAgKiAqKlZhbGlkYXRlczogUmVxdWlyZW1lbnRzIDIuMiwgMi4zKipcclxuICAgICAqIFxyXG4gICAgICogRm9yIGFueSB2YWxpZCB0aW1lIHdpbmRvdyB3aXRoIGZyb20vdG8gZGF0ZXMsIHRoZSBjb25zdHJ1Y3RlZCBVUkwgc2hvdWxkIGNvbnRhaW5cclxuICAgICAqIHByb3Blcmx5IGZvcm1hdHRlZCBJU084NjAxIHF1ZXJ5IHBhcmFtZXRlcnMgdGhhdCBjYW4gYmUgcGFyc2VkIGJhY2sgdG8gZXF1aXZhbGVudCB0aW1lc3RhbXBzLlxyXG4gICAgICovXHJcbiAgICBpdCgnUHJvcGVydHkgMzogVVJMIGNvbnN0cnVjdGlvbiB3aXRoIElTTzg2MDEgZm9ybWF0JywgKCkgPT4ge1xyXG4gICAgICAgIGZjLmFzc2VydChcclxuICAgICAgICAgICAgZmMucHJvcGVydHkoXHJcbiAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSB2YWxpZCBJU084NjAxIHRpbWVzdGFtcHNcclxuICAgICAgICAgICAgICAgIGZjLmRhdGUoeyBtaW46IG5ldyBEYXRlKCcyMDIwLTAxLTAxJyksIG1heDogbmV3IERhdGUoJzIwMzAtMTItMzEnKSB9KSxcclxuICAgICAgICAgICAgICAgIGZjLmludGVnZXIoeyBtaW46IDEsIG1heDogMzYwMCB9KSwgLy8gRHVyYXRpb24gaW4gc2Vjb25kc1xyXG4gICAgICAgICAgICAgICAgZmMud2ViVXJsKCksIC8vIEJhc2UgVVJMXHJcbiAgICAgICAgICAgICAgICAoc3RhcnREYXRlLCBkdXJhdGlvblNlY29uZHMsIGJhc2VVcmwpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGltZSB3aW5kb3dcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcm9tID0gc3RhcnREYXRlLnRvSVNPU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9EYXRlID0gbmV3IERhdGUoc3RhcnREYXRlLmdldFRpbWUoKSArIGR1cmF0aW9uU2Vjb25kcyAqIDEwMDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvID0gdG9EYXRlLnRvSVNPU3RyaW5nKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEJ1aWxkIFVSTFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IGJ1aWxkQXBpVXJsKGJhc2VVcmwsIGZyb20sIHRvKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgVVJMIHRvIGV4dHJhY3QgcXVlcnkgcGFyYW1ldGVyc1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVybE9iaiA9IG5ldyBVUkwodXJsKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcm9tUGFyYW0gPSB1cmxPYmouc2VhcmNoUGFyYW1zLmdldCgnZnJvbScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvUGFyYW0gPSB1cmxPYmouc2VhcmNoUGFyYW1zLmdldCgndG8nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVmVyaWZ5IHBhcmFtZXRlcnMgZXhpc3RcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoZnJvbVBhcmFtKS50b0JlVHJ1dGh5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHRvUGFyYW0pLnRvQmVUcnV0aHkoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVmVyaWZ5IHBhcmFtZXRlcnMgY2FuIGJlIHBhcnNlZCBiYWNrIHRvIGVxdWl2YWxlbnQgdGltZXN0YW1wc1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZEZyb20gPSBuZXcgRGF0ZShmcm9tUGFyYW0hKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWRUbyA9IG5ldyBEYXRlKHRvUGFyYW0hKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHBhcnNlZEZyb20udG9JU09TdHJpbmcoKSkudG9CZShmcm9tKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QocGFyc2VkVG8udG9JU09TdHJpbmcoKSkudG9CZSh0byk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFZlcmlmeSBVUkwgc3RydWN0dXJlXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHVybCkudG9Db250YWluKCcvcmVzcG9uc2VfY291bnQnKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QodXJsKS50b0NvbnRhaW4oJ2Zyb209Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHVybCkudG9Db250YWluKCd0bz0nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgeyBudW1SdW5zOiAxMDAgfVxyXG4gICAgICAgICk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICoqRmVhdHVyZTogZGF0YS1jb2xsZWN0aW9uLXNjaGVkdWxlciwgUHJvcGVydHkgNDogQVBJIOODrOOCueODneODs+OCueODkeODvOOCueOBruODqeOCpuODs+ODieODiOODquODg+ODlyoqXHJcbiAgICAgKiAqKlZhbGlkYXRlczogUmVxdWlyZW1lbnRzIDIuMyoqXHJcbiAgICAgKiBcclxuICAgICAqIEZvciBhbnkgdmFsaWQgSlNPTiByZXNwb25zZSBjb250YWluaW5nIGZyb20sIHRvLCBhbmQgY291bnQgZmllbGRzLCBwYXJzaW5nIHNob3VsZCBwcm9kdWNlXHJcbiAgICAgKiBhIHN0cnVjdHVyZWQgb2JqZWN0IHdpdGggZXF1aXZhbGVudCB2YWx1ZXMgdGhhdCBjYW4gYmUgc2VyaWFsaXplZCBiYWNrIHRvIGVxdWl2YWxlbnQgSlNPTi5cclxuICAgICAqL1xyXG4gICAgaXQoJ1Byb3BlcnR5IDQ6IEFQSSByZXNwb25zZSBwYXJzZSByb3VuZC10cmlwJywgKCkgPT4ge1xyXG4gICAgICAgIGZjLmFzc2VydChcclxuICAgICAgICAgICAgZmMucHJvcGVydHkoXHJcbiAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSB2YWxpZCBBUEkgcmVzcG9uc2UgZGF0YVxyXG4gICAgICAgICAgICAgICAgZmMuZGF0ZSh7IG1pbjogbmV3IERhdGUoJzIwMjAtMDEtMDEnKSwgbWF4OiBuZXcgRGF0ZSgnMjAzMC0xMi0zMScpIH0pLFxyXG4gICAgICAgICAgICAgICAgZmMuaW50ZWdlcih7IG1pbjogMSwgbWF4OiAzNjAwIH0pLFxyXG4gICAgICAgICAgICAgICAgZmMuaW50ZWdlcih7IG1pbjogMCwgbWF4OiAxMCB9KSxcclxuICAgICAgICAgICAgICAgIChzdGFydERhdGUsIGR1cmF0aW9uU2Vjb25kcywgY291bnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcm9tID0gc3RhcnREYXRlLnRvSVNPU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW5kRGF0ZSA9IG5ldyBEYXRlKHN0YXJ0RGF0ZS5nZXRUaW1lKCkgKyBkdXJhdGlvblNlY29uZHMgKiAxMDAwKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0byA9IGVuZERhdGUudG9JU09TdHJpbmcoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIG9yaWdpbmFsIHJlc3BvbnNlIG9iamVjdFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsUmVzcG9uc2U6IEFwaVJlc3BvbnNlID0geyBmcm9tLCB0bywgY291bnQgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2VyaWFsaXplIHRvIEpTT05cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBqc29uU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkob3JpZ2luYWxSZXNwb25zZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIGJhY2tcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWRSZXNwb25zZSA9IEpTT04ucGFyc2UoanNvblN0cmluZykgYXMgQXBpUmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFZlcmlmeSByb3VuZC10cmlwIGNvbnNpc3RlbmN5XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHBhcnNlZFJlc3BvbnNlLmZyb20pLnRvQmUob3JpZ2luYWxSZXNwb25zZS5mcm9tKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QocGFyc2VkUmVzcG9uc2UudG8pLnRvQmUob3JpZ2luYWxSZXNwb25zZS50byk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHBhcnNlZFJlc3BvbnNlLmNvdW50KS50b0JlKG9yaWdpbmFsUmVzcG9uc2UuY291bnQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBWZXJpZnkgc3RydWN0dXJlXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHR5cGVvZiBwYXJzZWRSZXNwb25zZS5mcm9tKS50b0JlKCdzdHJpbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QodHlwZW9mIHBhcnNlZFJlc3BvbnNlLnRvKS50b0JlKCdzdHJpbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QodHlwZW9mIHBhcnNlZFJlc3BvbnNlLmNvdW50KS50b0JlKCdudW1iZXInKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVmVyaWZ5IHRpbWVzdGFtcHMgYXJlIHZhbGlkIElTTzg2MDFcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcm9tRGF0ZSA9IG5ldyBEYXRlKHBhcnNlZFJlc3BvbnNlLmZyb20pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvRGF0ZVBhcnNlZCA9IG5ldyBEYXRlKHBhcnNlZFJlc3BvbnNlLnRvKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoZnJvbURhdGUudG9JU09TdHJpbmcoKSkudG9CZShwYXJzZWRSZXNwb25zZS5mcm9tKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QodG9EYXRlUGFyc2VkLnRvSVNPU3RyaW5nKCkpLnRvQmUocGFyc2VkUmVzcG9uc2UudG8pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICB7IG51bVJ1bnM6IDEwMCB9XHJcbiAgICAgICAgKTtcclxuICAgIH0pO1xyXG59KTtcclxuIl19