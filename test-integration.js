// Test script to debug S3 and Google Sheets integration
const s3Service = require('./services/s3Service');
const googleSheetsService = require('./services/googleSheetsService');

async function testIntegration() {
    console.log('=== Testing S3 and Google Sheets Integration ===\n');
    
    try {
        // Test 1: Check environment variables
        console.log('1. Checking environment variables...');
        console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
        console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
        console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME ? '✅ Set' : '❌ Missing');
        console.log('AWS_REGION:', process.env.AWS_REGION || 'us-east-1');
        console.log('');
        
        // Test 2: Validate S3 environment
        console.log('2. Validating S3 environment...');
        try {
            s3Service.validateEnvironment();
            console.log('✅ S3 environment validation passed');
        } catch (error) {
            console.log('❌ S3 environment validation failed:', error.message);
            return;
        }
        console.log('');
        
        // Test 3: Validate Google Sheets environment
        console.log('3. Validating Google Sheets environment...');
        try {
            googleSheetsService.validateEnvironment();
            console.log('✅ Google Sheets environment validation passed');
        } catch (error) {
            console.log('❌ Google Sheets environment validation failed:', error.message);
            return;
        }
        console.log('');
        
        // Test 4: Test with sample data
        console.log('4. Testing with sample data...');
        const testData = {
            branchId: 'test-' + Date.now(),
            branchName: 'Test Branch',
            latitude: 37.7749,
            longitude: -122.4194,
            noticeBoardBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            waitingAreaBase64: '',
            branchBoardBase64: ''
        };
        
        console.log('Test data:', {
            branchId: testData.branchId,
            branchName: testData.branchName,
            hasNoticeBoard: !!testData.noticeBoardBase64,
            hasWaitingArea: !!testData.waitingAreaBase64,
            hasBranchBoard: !!testData.branchBoardBase64
        });
        
        // Test S3 upload
        console.log('\n5. Testing S3 upload...');
        const imageUrls = await s3Service.uploadBranchImages(testData.branchId, {
            noticeBoardBase64: testData.noticeBoardBase64,
            waitingAreaBase64: testData.waitingAreaBase64,
            branchBoardBase64: testData.branchBoardBase64
        }, {
            branchName: testData.branchName,
            latitude: testData.latitude,
            longitude: testData.longitude
        });
        
        console.log('S3 upload results:', imageUrls);
        
        // Test Google Sheets
        console.log('\n6. Testing Google Sheets update...');
        const rowData = [
            testData.branchId,
            testData.branchName,
            testData.latitude.toString(),
            testData.longitude.toString(),
            imageUrls.noticeBoardUrl || '',
            imageUrls.waitingAreaUrl || '',
            imageUrls.branchBoardUrl || '',
            new Date().toISOString()
        ];
        
        console.log('Row data to write:', rowData);
        
        const sheetResult = await googleSheetsService.appendRowToSheet(rowData);
        console.log('Google Sheets result:', sheetResult);
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testIntegration();
