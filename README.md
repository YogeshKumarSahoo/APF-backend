# Branch Data API

A clean Express API for appending branch data to Google Sheets.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```env
   GOOGLE_SHEETS_SERVICE_ACCOUNT=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   SPREADSHEET_ID=your-spreadsheet-id
   SHEET_NAME=Sheet1
   PORT=3000
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

## Google Sheets Setup

1. Create a Google Cloud Project
2. Enable the Google Sheets API
3. Create a Service Account
4. Download the JSON key file
5. Extract the service account email and private key
6. Share your Google Sheet with the service account email

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status

### Add Branch Data
- **POST** `/api/branches`
- **Body:**
  ```json
  {
    "branchId": "12345",
    "branchName": "Test Branch Downtown",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "noticeBoardBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "waitingAreaBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "branchBoardBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
  }
  ```

## Testing the API

You can test the API using curl:

```bash
curl -X POST http://localhost:3000/api/branches \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": "12345",
    "branchName": "Test Branch Downtown",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "noticeBoardBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "waitingAreaBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "branchBoardBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
  }'
```
