# Branch Data API

A clean Express API for appending branch data to Google Sheets with AWS S3 image storage.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```env
   # Google Sheets Configuration
   GOOGLE_SHEETS_SERVICE_ACCOUNT=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   SPREADSHEET_ID=your-spreadsheet-id
   SHEET_NAME=Sheet1
   
   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your-aws-access-key-id
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-s3-bucket-name
   
   # Server Configuration
   PORT=3000
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

## Setup Instructions

### Google Sheets Setup
1. Create a Google Cloud Project
2. Enable the Google Sheets API
3. Create a Service Account
4. Download the JSON key file
5. Extract the service account email and private key
6. Share your Google Sheet with the service account email

### AWS S3 Setup
1. Create an AWS account and S3 bucket
2. Create an IAM user with S3 permissions
3. Generate access keys for the IAM user
4. Configure bucket permissions for public read access
5. Add AWS credentials to your `.env` file

**Required S3 Permissions:**
- `s3:PutObject` - Upload images
- `s3:PutObjectAcl` - Set public read access

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
- **Response:**
  ```json
  {
    "success": true,
    "message": "Branch data appended successfully",
    "data": {
      "branchId": "12345",
      "branchName": "Test Branch Downtown",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "images": {
        "noticeBoardUrl": "https://your-bucket.s3.us-east-1.amazonaws.com/branches/12345/notice-board-1705312200000.jpg",
        "waitingAreaUrl": "https://your-bucket.s3.us-east-1.amazonaws.com/branches/12345/waiting-area-1705312200001.jpg",
        "branchBoardUrl": "https://your-bucket.s3.us-east-1.amazonaws.com/branches/12345/branch-board-1705312200002.jpg"
      }
    }
  }
  ```

**Note:** Images are automatically uploaded to S3 with comprehensive metadata including branch information, coordinates, timestamps, and file details. URLs are stored in Google Sheets instead of base64 data.

### Image Metadata
Each uploaded image includes the following metadata:
- `branch-id`: Unique branch identifier
- `branch-name`: Name of the branch
- `image-type`: Type of image (notice-board, waiting-area, branch-board)
- `latitude`: Branch latitude coordinate
- `longitude`: Branch longitude coordinate
- `upload-timestamp`: ISO timestamp of upload
- `original-filename`: Generated filename
- `content-type`: MIME type of the image
- `file-size`: Size of the uploaded file in bytes

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
