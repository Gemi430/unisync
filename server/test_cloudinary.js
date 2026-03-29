const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Testing Cloudinary Connection...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing');

cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary Connection Successful:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Cloudinary Connection Failed:', err);
    process.exit(1);
  });
