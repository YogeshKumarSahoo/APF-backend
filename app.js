const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Reduced limit since images go to S3

// Import services
const googleSheetsService = require('./services/googleSheetsService');
const s3Service = require('./services/s3Service');

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

        // Upload images to S3 and get URLs
        let imageUrls = {};
        try {
            imageUrls = await s3Service.uploadBranchImages(branchId, {
                noticeBoardBase64,
                waitingAreaBase64,
                branchBoardBase64
            }, {
                branchName,
                latitude,
                longitude
            });
        } catch (s3Error) {
            console.error('S3 upload error:', s3Error);
            return res.status(500).json({
                success: false,
                error: 'Failed to upload images to S3',
                details: s3Error.message
            });
        }

        // Prepare row data for Google Sheets (now with S3 URLs instead of base64)
        const rowData = [
            branchId,
            branchName,
            latitude.toString(),
            longitude.toString(),
            imageUrls.noticeBoardUrl || '',
            imageUrls.waitingAreaUrl || '',
            imageUrls.branchBoardUrl || '',
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
                timestamp: new Date().toISOString(),
                images: {
                    noticeBoardUrl: imageUrls.noticeBoardUrl,
                    waitingAreaUrl: imageUrls.waitingAreaUrl,
                    branchBoardUrl: imageUrls.branchBoardUrl
                }
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
