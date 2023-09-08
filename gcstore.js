const path = require('path');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage({ keyFilename: process.env.GCS_KEY_JSON });
const bucketName = 'imageswebapp';
const bucket = storage.bucket(bucketName);

module.exports = bucket;