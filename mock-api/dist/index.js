"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
exports.app = app;
const PORT = 3000;
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// /response_count endpoint
app.get('/response_count', (req, res) => {
    const { from, to } = req.query;
    // Validate query parameters
    if (!from || !to) {
        return res.status(400).json({
            error: 'Missing required query parameters: from and to'
        });
    }
    // Parse ISO8601 timestamps
    const fromDate = new Date(from);
    const toDate = new Date(to);
    // Validate parsed dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({
            error: 'Invalid ISO8601 format for from or to parameter'
        });
    }
    // Calculate deterministic count based on minute value
    // Using 'to' timestamp as specified in design
    const minute = toDate.getUTCMinutes();
    const count = minute % 11; // Cycles 0-10 every 11 minutes
    // Return response
    res.json({
        from: from,
        to: to,
        count
    });
});
const server = app.listen(PORT, () => {
    console.log(`Mock AI Employee API listening on port ${PORT}`);
});
exports.server = server;
