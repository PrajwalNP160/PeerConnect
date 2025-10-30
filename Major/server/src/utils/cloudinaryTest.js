import cloudinary from '../config/cloudinary.js';

// Test Cloudinary connection
export const testCloudinaryConnection = async () => {
  try {
    console.log('Testing Cloudinary connection...');
    
    // Test API connection
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
    
    return { success: true, result };
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error);
    
    // Check for common issues
    if (error.message.includes('Invalid API key')) {
      console.error('🔑 Issue: Invalid API key. Please check CLOUDINARY_API_KEY in .env');
    } else if (error.message.includes('Invalid cloud name')) {
      console.error('☁️ Issue: Invalid cloud name. Please check CLOUDINARY_CLOUD_NAME in .env');
    } else if (error.message.includes('Invalid API secret')) {
      console.error('🔐 Issue: Invalid API secret. Please check CLOUDINARY_API_SECRET in .env');
    }
    
    return { success: false, error: error.message };
  }
};

// Test file upload
export const testFileUpload = async () => {
  try {
    console.log('Testing file upload...');
    
    // Create a simple test upload (base64 image)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const result = await cloudinary.uploader.upload(testImage, {
      folder: 'skillswap/test',
      public_id: 'test_upload_' + Date.now(),
      resource_type: 'image'
    });
    
    console.log('✅ Test upload successful:', {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format
    });
    
    // Clean up test file
    await cloudinary.uploader.destroy(result.public_id);
    console.log('🧹 Test file cleaned up');
    
    return { success: true, result };
  } catch (error) {
    console.error('❌ Test upload failed:', error);
    return { success: false, error: error.message };
  }
};

// Run all tests
export const runCloudinaryTests = async () => {
  console.log('\n🧪 Running Cloudinary Tests...\n');
  
  const connectionTest = await testCloudinaryConnection();
  if (!connectionTest.success) {
    return connectionTest;
  }
  
  const uploadTest = await testFileUpload();
  
  console.log('\n📊 Test Results:');
  console.log('Connection:', connectionTest.success ? '✅ Pass' : '❌ Fail');
  console.log('Upload:', uploadTest.success ? '✅ Pass' : '❌ Fail');
  
  return {
    success: connectionTest.success && uploadTest.success,
    connection: connectionTest,
    upload: uploadTest
  };
};
