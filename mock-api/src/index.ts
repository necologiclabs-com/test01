import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// /response_count endpoint
app.get('/response_count', (req: Request, res: Response) => {
    const { from, to } = req.query;

    // Validate query parameters
    if (!from || !to) {
        return res.status(400).json({
            error: 'Missing required query parameters: from and to'
        });
    }

    // Parse ISO8601 timestamps
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

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
        from: from as string,
        to: to as string,
        count
    });
});

const server = app.listen(PORT, () => {
    console.log(`Mock AI Employee API listening on port ${PORT}`);
});

export { app, server };
