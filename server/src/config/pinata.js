const { PinataSDK } = require('@pinata/sdk');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class PinataService {
  constructor() {
    this.pinata = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    try {
      const { PINATA_API_KEY, PINATA_SECRET_KEY } = process.env;
      
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        console.warn('⚠️ Pinata API credentials not found. IPFS functionality will be limited.');
        return;
      }

      this.pinata = new PinataSDK(PINATA_API_KEY, PINATA_SECRET_KEY);
      this.isConfigured = true;
      
      console.log('✅ Pinata service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Pinata service:', error);
    }
  }

  // Test Pinata connection
  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, message: 'Pinata not configured' };
    }

    try {
      const result = await this.pinata.testAuthentication();
      return { success: true, message: 'Pinata connection successful', data: result };
    } catch (error) {
      return { success: false, message: 'Pinata connection failed', error: error.message };
    }
  }

  // Upload file to IPFS
  async uploadFile(filePath, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Pinata service not configured');
    }

    try {
      const formData = new FormData();
      
      // Add file to form data
      const fileStream = fs.createReadStream(filePath);
      const fileName = options.fileName || path.basename(filePath);
      
      formData.append('file', fileStream, {
        filename: fileName,
        contentType: options.contentType || 'application/octet-stream'
      });

      // Add metadata if provided
      if (options.metadata) {
        formData.append('pinataMetadata', JSON.stringify({
          name: options.metadata.name || fileName,
          keyvalues: options.metadata.keyvalues || {}
        }));
      }

      // Add options if provided
      if (options.pinataOptions) {
        formData.append('pinataOptions', JSON.stringify(options.pinataOptions));
      }

      const result = await this.pinata.pinFileToIPFS(formData);
      
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      };
    } catch (error) {
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  // Upload buffer to IPFS
  async uploadBuffer(buffer, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Pinata service not configured');
    }

    try {
      const formData = new FormData();
      
      // Add buffer to form data
      formData.append('file', buffer, {
        filename: options.fileName || 'file',
        contentType: options.contentType || 'application/octet-stream'
      });

      // Add metadata if provided
      if (options.metadata) {
        formData.append('pinataMetadata', JSON.stringify({
          name: options.metadata.name || 'file',
          keyvalues: options.metadata.keyvalues || {}
        }));
      }

      // Add options if provided
      if (options.pinataOptions) {
        formData.append('pinataOptions', JSON.stringify(options.pinataOptions));
      }

      const result = await this.pinata.pinFileToIPFS(formData);
      
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      };
    } catch (error) {
      throw new Error(`Failed to upload buffer to IPFS: ${error.message}`);
    }
  }

  // Upload JSON metadata to IPFS
  async uploadJSON(metadata, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Pinata service not configured');
    }

    try {
      const pinataOptions = {
        pinataMetadata: {
          name: options.name || 'metadata.json',
          keyvalues: options.keyvalues || {}
        },
        pinataOptions: {
          cidVersion: 0
        }
      };

      const result = await this.pinata.pinJSONToIPFS(metadata, pinataOptions);
      
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      };
    } catch (error) {
      throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
    }
  }

  // Upload NFT metadata
  async uploadNFTMetadata(nftData, options = {}) {
    try {
      const metadata = {
        name: nftData.name,
        description: nftData.description,
        image: nftData.image,
        external_url: nftData.externalUrl || '',
        attributes: nftData.attributes || [],
        properties: {
          files: [
            {
              type: nftData.imageType || 'image/png',
              uri: nftData.image
            }
          ],
          category: 'image',
          ...nftData.properties
        }
      };

      return await this.uploadJSON(metadata, {
        name: `${nftData.name}_metadata.json`,
        keyvalues: {
          type: 'nft_metadata',
          collection: nftData.collection || 'aniverse',
          rarity: nftData.rarity || 'common',
          ...options.keyvalues
        }
      });
    } catch (error) {
      throw new Error(`Failed to upload NFT metadata: ${error.message}`);
    }
  }

  // Upload collection metadata
  async uploadCollectionMetadata(collectionData, options = {}) {
    try {
      const metadata = {
        name: collectionData.name,
        description: collectionData.description,
        image: collectionData.image,
        external_url: collectionData.externalUrl || '',
        attributes: collectionData.attributes || [],
        properties: {
          files: [
            {
              type: collectionData.imageType || 'image/png',
              uri: collectionData.image
            }
          ],
          category: 'collection',
          ...collectionData.properties
        }
      };

      return await this.uploadJSON(metadata, {
        name: `${collectionData.name}_collection_metadata.json`,
        keyvalues: {
          type: 'collection_metadata',
          category: collectionData.category || 'anime',
          ...options.keyvalues
        }
      });
    } catch (error) {
      throw new Error(`Failed to upload collection metadata: ${error.message}`);
    }
  }

  // Get file info from IPFS
  async getFileInfo(ipfsHash) {
    if (!this.isConfigured) {
      throw new Error('Pinata service not configured');
    }

    try {
      const result = await this.pinata.getFilesByCount(1, { hashContains: ipfsHash });
      
      if (result.count > 0) {
        const file = result.rows[0];
        return {
          success: true,
          ipfsHash: file.ipfs_pin_hash,
          size: file.size,
          timestamp: file.date_pinned,
          name: file.metadata.name,
          keyvalues: file.metadata.keyvalues || {}
        };
      } else {
        return { success: false, message: 'File not found' };
      }
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  // Unpin file from IPFS
  async unpinFile(ipfsHash) {
    if (!this.isConfigured) {
      throw new Error('Pinata service not configured');
    }

    try {
      const result = await this.pinata.unpin(ipfsHash);
      return { success: true, message: 'File unpinned successfully' };
    } catch (error) {
      throw new Error(`Failed to unpin file: ${error.message}`);
    }
  }

  // Get user's pinned files
  async getPinnedFiles(options = {}) {
    if (!this.isConfigured) {
      throw new Error('Pinata service not configured');
    }

    try {
      const { pageLimit = 10, pageOffset = 0, filters = {} } = options;
      
      const result = await this.pinata.getFilesByCount(pageLimit, {
        pageOffset,
        ...filters
      });

      return {
        success: true,
        count: result.count,
        rows: result.rows.map(file => ({
          ipfsHash: file.ipfs_pin_hash,
          size: file.size,
          timestamp: file.date_pinned,
          name: file.metadata?.name || 'Unknown',
          keyvalues: file.metadata?.keyvalues || {}
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get pinned files: ${error.message}`);
    }
  }

  // Batch upload files
  async batchUpload(files, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Pinata service not configured');
    }

    try {
      const results = [];
      
      for (const file of files) {
        try {
          let result;
          
          if (file.type === 'buffer') {
            result = await this.uploadBuffer(file.data, file.options);
          } else if (file.type === 'json') {
            result = await this.uploadJSON(file.data, file.options);
          } else {
            result = await this.uploadFile(file.path, file.options);
          }
          
          results.push({ success: true, file: file.name || 'unknown', ...result });
        } catch (error) {
          results.push({ 
            success: false, 
            file: file.name || 'unknown', 
            error: error.message 
          });
        }
      }

      return {
        success: true,
        total: files.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      throw new Error(`Failed to batch upload files: ${error.message}`);
    }
  }

  // Get gateway URL for IPFS hash
  getGatewayUrl(ipfsHash, gateway = 'pinata') {
    const gateways = {
      pinata: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      ipfs: `https://ipfs.io/ipfs/${ipfsHash}`,
      cloudflare: `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
      dweb: `https://dweb.link/ipfs/${ipfsHash}`
    };

    return gateways[gateway] || gateways.pinata;
  }

  // Validate IPFS hash format
  validateIPFSHash(hash) {
    // Basic validation for IPFS hash (CID v0 or v1)
    const cidRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafy[a-z2-7]{55}$/;
    return cidRegex.test(hash);
  }
}

// Create singleton instance
const pinataService = new PinataService();

module.exports = pinataService;
