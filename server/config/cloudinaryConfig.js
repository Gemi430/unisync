const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uni-resource-platform',
    allowed_formats: ['jpg', 'png', 'pdf', 'docx', 'doc', 'txt'],
    resource_type: 'auto',
    type: 'upload',
    access_mode: 'public'
  }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, storage, upload };
