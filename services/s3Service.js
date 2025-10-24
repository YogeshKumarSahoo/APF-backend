const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Environment variables for AWS configuration
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Validate required environment variables
function validateEnvironment() {
    const required = [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_S3_BUCKET_NAME'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required AWS environment variables: ${missing.join(', ')}`);
    }
}

// Initialize S3 client
function getS3Client() {
    validateEnvironment();
    
    return new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
    });
}

// Detect content type from base64 data
function getContentTypeFromBase64(base64String) {
    const header = base64String.substring(0, 20);
    if (header.includes('data:image/jpeg') || header.includes('data:image/jpg')) {
        return 'image/jpeg';
    } else if (header.includes('data:image/png')) {
        return 'image/png';
    } else if (header.includes('data:image/gif')) {
        return 'image/gif';
    } else if (header.includes('data:image/webp')) {
        return 'image/webp';
    }
    // Default to jpeg if not detected
    return 'image/jpeg';
}

// Extract file extension from content type
function getFileExtension(contentType) {
    const extensionMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp'
    };
    return extensionMap[contentType] || 'jpg';
}

// Clean base64 string (remove data URL prefix)
function cleanBase64String(base64String) {
    // Remove data URL prefix if present
    if (base64String.includes(',')) {
        return base64String.split(',')[1];
    }
    return base64String;
}

// Upload base64 image to S3
async function uploadBase64Image(base64String, branchId, imageType, branchData = {}) {
    try {
        if (!base64String || base64String.trim() === '') {
            return null; // Skip empty images
        }

        const s3Client = getS3Client();
        
        // Detect content type and extension
        const contentType = getContentTypeFromBase64(base64String);
        const fileExtension = getFileExtension(contentType);
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${imageType}-${timestamp}.${fileExtension}`;
        const key = `branches/${branchId}/${filename}`;
        
        // Clean base64 string
        const cleanBase64 = cleanBase64String(base64String);
        
        // Convert base64 to buffer
        const buffer = Buffer.from(cleanBase64, 'base64');
        
        // Prepare metadata
        const metadata = {
            'branch-id': branchId,
            'branch-name': branchData.branchName || '',
            'image-type': imageType,
            'latitude': branchData.latitude ? branchData.latitude.toString() : '',
            'longitude': branchData.longitude ? branchData.longitude.toString() : '',
            'upload-timestamp': new Date().toISOString(),
            'original-filename': filename,
            'content-type': contentType,
            'file-size': buffer.length.toString()
        };
        
        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: AWS_S3_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read', // Make the object publicly readable
            Metadata: metadata
        });
        
        await s3Client.send(command);
        
        // Generate public URL
        const publicUrl = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
        
        console.log(`Successfully uploaded ${imageType} for branch ${branchId} to S3: ${publicUrl}`);
        console.log(`Metadata:`, metadata);
        
        return publicUrl;
        
    } catch (error) {
        console.error(`Error uploading ${imageType} for branch ${branchId} to S3:`, error);
        throw new Error(`Failed to upload ${imageType} to S3: ${error.message}`);
    }
}

// Upload multiple images for a branch
async function uploadBranchImages(branchId, images, branchData = {}) {
    const results = {};
    
    try {
        console.log(`Starting upload for branch ${branchId} with data:`, branchData);
        console.log('Images to upload:', Object.keys(images).filter(key => images[key]));
        
        // Upload each image type
        const uploadPromises = [];
        
        if (images.noticeBoardBase64) {
            console.log('Uploading notice board image...');
            uploadPromises.push(
                uploadBase64Image(images.noticeBoardBase64, branchId, 'notice-board', branchData)
                    .then(url => { 
                        console.log('Notice board URL:', url);
                        results.noticeBoardUrl = url; 
                    })
            );
        }
        
        if (images.waitingAreaBase64) {
            console.log('Uploading waiting area image...');
            uploadPromises.push(
                uploadBase64Image(images.waitingAreaBase64, branchId, 'waiting-area', branchData)
                    .then(url => { 
                        console.log('Waiting area URL:', url);
                        results.waitingAreaUrl = url; 
                    })
            );
        }
        
        if (images.branchBoardBase64) {
            console.log('Uploading branch board image...');
            uploadPromises.push(
                uploadBase64Image(images.branchBoardBase64, branchId, 'branch-board', branchData)
                    .then(url => { 
                        console.log('Branch board URL:', url);
                        results.branchBoardUrl = url; 
                    })
            );
        }
        
        console.log(`Waiting for ${uploadPromises.length} uploads to complete...`);
        
        // Wait for all uploads to complete
        await Promise.all(uploadPromises);
        
        console.log('All uploads completed. Final results:', results);
        return results;
        
    } catch (error) {
        console.error(`Error uploading images for branch ${branchId}:`, error);
        throw error;
    }
}

// Get metadata for an S3 object
async function getImageMetadata(s3Url) {
    try {
        const s3Client = getS3Client();
        
        // Extract key from S3 URL
        const urlParts = s3Url.split('/');
        const key = urlParts.slice(3).join('/'); // Remove domain parts
        
        const command = new HeadObjectCommand({
            Bucket: AWS_S3_BUCKET_NAME,
            Key: key
        });
        
        const response = await s3Client.send(command);
        
        return {
            metadata: response.Metadata || {},
            lastModified: response.LastModified,
            contentLength: response.ContentLength,
            contentType: response.ContentType,
            etag: response.ETag
        };
        
    } catch (error) {
        console.error('Error getting image metadata:', error);
        throw new Error(`Failed to get image metadata: ${error.message}`);
    }
}

// List all images for a specific branch
async function listBranchImages(branchId) {
    try {
        const s3Client = getS3Client();
        
        const command = new ListObjectsV2Command({
            Bucket: AWS_S3_BUCKET_NAME,
            Prefix: `branches/${branchId}/`
        });
        
        const response = await s3Client.send(command);
        
        return response.Contents || [];
        
    } catch (error) {
        console.error('Error listing branch images:', error);
        throw new Error(`Failed to list branch images: ${error.message}`);
    }
}

module.exports = {
    uploadBase64Image,
    uploadBranchImages,
    getImageMetadata,
    listBranchImages,
    validateEnvironment
};
