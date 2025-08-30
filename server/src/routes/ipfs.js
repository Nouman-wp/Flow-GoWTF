const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const PinataSDK = require('pinata-sdk');

const router = express.Router();

// Configure Pinata
const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload file to IPFS
router.post('/upload', [
  authenticateToken,
  upload.single('file'),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { metadata = {} } = req.body;
    const file = req.file;

    // Prepare file data for Pinata
    const fileData = {
      name: file.originalname,
      description: metadata.description || 'Uploaded to Aniverse NFT Platform',
      image: file.buffer,
      attributes: metadata.attributes || [],
      external_url: metadata.external_url || '',
      collection: metadata.collection || 'Aniverse',
      creator: req.user.flowWalletAddress
    };

    // Upload to Pinata
    const result = await pinata.pinFileToIPFS(file.buffer, {
      pinataMetadata: {
        name: file.originalname,
        keyvalues: {
          platform: 'Aniverse',
          creator: req.user.flowWalletAddress,
          timestamp: Date.now().toString()
        }
      }
    });

    // Create metadata JSON
    const metadataJSON = {
      name: file.originalname,
      description: metadata.description || 'Uploaded to Aniverse NFT Platform',
      image: `ipfs://${result.IpfsHash}`,
      external_url: metadata.external_url || '',
      attributes: metadata.attributes || [],
      collection: metadata.collection || 'Aniverse',
      creator: req.user.flowWalletAddress,
      timestamp: Date.now()
    };

    // Upload metadata to IPFS
    const metadataResult = await pinata.pinJSONToIPFS(metadataJSON, {
      pinataMetadata: {
        name: `${file.originalname}_metadata`,
        keyvalues: {
          type: 'metadata',
          platform: 'Aniverse',
          creator: req.user.flowWalletAddress
        }
      }
    });

    res.json({
      message: 'File uploaded successfully',
      file: {
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        ipfsHash: result.IpfsHash,
        ipfsUrl: `ipfs://${result.IpfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      },
      metadata: {
        ipfsHash: metadataResult.IpfsHash,
        ipfsUrl: `ipfs://${metadataResult.IpfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`
      }
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file to IPFS',
      message: error.message 
    });
  }
});

// Upload metadata to IPFS
router.post('/metadata', [
  authenticateToken,
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('description').isString().trim().isLength({ min: 1, max: 1000 }),
  body('image').isString(),
  body('external_url').optional().isURL(),
  body('attributes').isArray(),
  body('collection').optional().isString(),
  body('properties').optional().isObject()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const {
      name,
      description,
      image,
      external_url,
      attributes,
      collection = 'Aniverse',
      properties = {}
    } = req.body;

    // Create metadata JSON
    const metadataJSON = {
      name,
      description,
      image,
      external_url,
      attributes,
      collection,
      properties,
      creator: req.user.flowWalletAddress,
      timestamp: Date.now(),
      platform: 'Aniverse'
    };

    // Upload metadata to IPFS
    const result = await pinata.pinJSONToIPFS(metadataJSON, {
      pinataMetadata: {
        name: `${name}_metadata`,
        keyvalues: {
          type: 'metadata',
          platform: 'Aniverse',
          creator: req.user.flowWalletAddress,
          collection
        }
      }
    });

    res.json({
      message: 'Metadata uploaded successfully',
      metadata: {
        ipfsHash: result.IpfsHash,
        ipfsUrl: `ipfs://${result.IpfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        data: metadataJSON
      }
    });

  } catch (error) {
    console.error('Metadata upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload metadata to IPFS',
      message: error.message 
    });
  }
});

// Get file info from IPFS
router.get('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    
    // Validate CID format
    if (!/^[a-zA-Z0-9]{46}$/.test(cid)) {
      return res.status(400).json({ error: 'Invalid IPFS CID format' });
    }

    // Get file info from Pinata
    const fileInfo = await pinata.getFileFromIPFS(cid);
    
    res.json({
      cid,
      ipfsUrl: `ipfs://${cid}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
      size: fileInfo.size,
      timestamp: fileInfo.timestamp
    });

  } catch (error) {
    console.error('Get IPFS file error:', error);
    res.status(500).json({ 
      error: 'Failed to get file from IPFS',
      message: error.message 
    });
  }
});

// Batch upload multiple files
router.post('/batch-upload', [
  authenticateToken,
  upload.array('files', 10), // Max 10 files
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { metadata = {} } = req.body;
    const files = req.files;
    const results = [];

    // Upload each file
    for (const file of files) {
      try {
        // Upload file to Pinata
        const fileResult = await pinata.pinFileToIPFS(file.buffer, {
          pinataMetadata: {
            name: file.originalname,
            keyvalues: {
              platform: 'Aniverse',
              creator: req.user.flowWalletAddress,
              timestamp: Date.now().toString()
            }
          }
        });

        // Create metadata for this file
        const fileMetadata = {
          name: file.originalname,
          description: metadata.description || 'Uploaded to Aniverse NFT Platform',
          image: `ipfs://${fileResult.IpfsHash}`,
          attributes: metadata.attributes || [],
          external_url: metadata.external_url || '',
          collection: metadata.collection || 'Aniverse',
          creator: req.user.flowWalletAddress,
          timestamp: Date.now()
        };

        // Upload metadata to IPFS
        const metadataResult = await pinata.pinJSONToIPFS(fileMetadata, {
          pinataMetadata: {
            name: `${file.originalname}_metadata`,
            keyvalues: {
              type: 'metadata',
              platform: 'Aniverse',
              creator: req.user.flowWalletAddress
            }
          }
        });

        results.push({
          name: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          file: {
            ipfsHash: fileResult.IpfsHash,
            ipfsUrl: `ipfs://${fileResult.IpfsHash}`,
            gatewayUrl: `https://gateway.pinata.cloud/ipfs/${fileResult.IpfsHash}`
          },
          metadata: {
            ipfsHash: metadataResult.IpfsHash,
            ipfsUrl: `ipfs://${metadataResult.IpfsHash}`,
            gatewayUrl: `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`
          }
        });

      } catch (fileError) {
        console.error(`Error uploading file ${file.originalname}:`, fileError);
        results.push({
          name: file.originalname,
          error: fileError.message
        });
      }
    }

    res.json({
      message: 'Batch upload completed',
      results,
      totalFiles: files.length,
      successfulUploads: results.filter(r => !r.error).length,
      failedUploads: results.filter(r => r.error).length
    });

  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process batch upload',
      message: error.message 
    });
  }
});

// Get user's uploads
router.get('/user/uploads', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get user's uploads from Pinata (this would require additional Pinata API calls)
    // For now, return a placeholder response
    res.json({
      message: 'User uploads feature coming soon',
      uploads: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });

  } catch (error) {
    console.error('Get user uploads error:', error);
    res.status(500).json({ 
      error: 'Failed to get user uploads',
      message: error.message 
    });
  }
});

module.exports = router;
