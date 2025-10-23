const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Import Google Sheets service
const googleSheetsService = require('./services/googleSheetsService');

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Branch Data API is running' });
});

// POST endpoint to append branch data to Google Sheet
app.post('/api/branches', async (req, res) => {
    try {
        const {
            branchId,
            branchName,
            latitude,
            longitude,
            noticeBoardBase64,
            waitingAreaBase64,
            branchBoardBase64
        } = req.body;

        // Validate required fields
        if (!branchId || !branchName || !latitude || !longitude) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['branchId', 'branchName', 'latitude', 'longitude']
            });
        }

        // Prepare row data for Google Sheets
        const rowData = [
            branchId,
            branchName,
            latitude.toString(),
            longitude.toString(),
            noticeBoardBase64 || '',
            waitingAreaBase64 || '',
            branchBoardBase64 || '',
            new Date().toISOString() // Timestamp
        ];

        // Append to Google Sheet
        const result = await googleSheetsService.appendRowToSheet(rowData);

        res.json({
            success: true,
            message: 'Branch data appended successfully',
            data: {
                branchId,
                branchName,
                latitude,
                longitude,
                timestamp: new Date().toISOString()
            },
            sheetUpdate: result
        });

    } catch (error) {
        console.error('Error appending branch data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to append branch data to sheet',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!',
        details: err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`Branch Data API server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Branch endpoint: POST http://localhost:${PORT}/api/branches`);
});
