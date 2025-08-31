const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pinataService = require('../src/config/pinata');
const Collection = require('../src/models/Collection');
const NFT = require('../src/models/NFT');

async function connectDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

function pickRarity(index) {
  const rarities = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  return rarities[index] || 'common';
}

function randomPrice() {
  // 100 - 1000 FLOW
  const cents = Math.floor(100 + Math.random() * (1000 - 100));
  return cents; // store as number; interpreted as FLOW units client-side
}

async function main() {
  const args = process.argv.slice(2);
  const assetsArgIndex = args.indexOf('--assets');
  const creatorArgIndex = args.indexOf('--creator');

  if (assetsArgIndex === -1 || !args[assetsArgIndex + 1]) {
    throw new Error('Usage: node scripts/seedCollections.js --assets <path> --creator <userId>');
  }
  if (creatorArgIndex === -1 || !args[creatorArgIndex + 1]) {
    throw new Error('Missing --creator <userId>');
  }

  // Accept both assets/collections and assets/collection
  let assetsRoot = path.resolve(args[assetsArgIndex + 1]);
  if (!fs.existsSync(assetsRoot)) {
    const alt = path.resolve(assetsRoot.replace(/collections$/i, 'collection'));
    if (fs.existsSync(alt)) assetsRoot = alt;
  }
  const creatorId = args[creatorArgIndex + 1];

  await connectDb();
  console.log('Connected to MongoDB');

  // Ensure flowTokenId index is sparse unique to allow multiple docs without the field
  try {
    const indexes = await NFT.collection.indexes();
    const hasNonSparseUnique = indexes.find(idx => idx.name === 'flowTokenId_1' && idx.unique && !idx.sparse);
    if (hasNonSparseUnique) {
      await NFT.collection.dropIndex('flowTokenId_1');
      console.log('Dropped non-sparse unique index flowTokenId_1');
    }
  } catch (e) {
    // ignore if index missing
  }
  try {
    await NFT.collection.createIndex({ flowTokenId: 1 }, { unique: true, sparse: true });
    console.log('Ensured sparse unique index on flowTokenId');
  } catch (e) {
    // ignore if already exists with correct options
  }

  if (!pinataService.isConfigured) {
    throw new Error('Pinata not configured. Set PINATA_API_KEY and PINATA_SECRET_KEY in server/.env');
  }

  const folders = fs.readdirSync(assetsRoot).filter((f) => {
    const full = path.join(assetsRoot, f);
    return fs.statSync(full).isDirectory();
  });

  for (const folder of folders) {
    const folderPath = path.join(assetsRoot, folder);
    const images = fs
      .readdirSync(folderPath)
      .filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
      .slice(0, 100);

    if (images.length === 0) {
      console.log(`Skipping ${folder} (no images found)`);
      continue;
    }

    // Use first image as collection image
    const firstImagePath = path.join(folderPath, images[0]);
    const imgRes = await pinataService.uploadFile(firstImagePath, {
      metadata: { name: `${folder}_cover` },
    });

    const collectionDoc = await Collection.create({
      name: folder,
      description: `${folder} official collection on Aniverse`,
      image: `ipfs://${imgRes.ipfsHash}`,
      creator: creatorId,
      category: 'anime',
      tags: ['anime'],
      attributes: { rarity: 'common', series: folder },
      supply: { total: images.length, minted: 0, available: images.length, isLimited: true },
      pricing: { mintPrice: 0, currency: 'FLOW', royaltyPercentage: 2.5 },
      status: 'active',
      visibility: 'public',
    });

    console.log(`Created collection ${collectionDoc.name} (${collectionDoc._id})`);

    for (let i = 0; i < images.length; i++) {
      const imgName = images[i];
      const imgPath = path.join(folderPath, imgName);
      const upload = await pinataService.uploadFile(imgPath, { metadata: { name: imgName } });

      const rarity = pickRarity(i);
      const price = randomPrice();

      const nftName = path.parse(imgName).name;
      const description = `${nftName} from ${folder} collection`;

      const metadataUpload = await pinataService.uploadNFTMetadata({
        name: nftName,
        description,
        image: `ipfs://${upload.ipfsHash}`,
        attributes: [
          { trait_type: 'collection', value: folder },
          { trait_type: 'rarity', value: rarity },
        ],
        collection: folder,
        rarity,
      });

      const nft = await NFT.create({
        tokenId: `ANV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: nftName,
        description,
        image: `ipfs://${upload.ipfsHash}`,
        attributes: [
          { trait_type: 'collection', value: folder },
          { trait_type: 'rarity', value: rarity },
        ],
        collection: collectionDoc._id,
        collectionName: folder,
        rarity,
        rarityScore: 0,
        creator: creatorId,
        owner: creatorId,
        isForSale: true,
        salePrice: price,
        saleCurrency: 'FLOW',
        metadata: {
          ipfsHash: metadataUpload.ipfsHash,
          metadataURL: `ipfs://${metadataUpload.ipfsHash}`,
        },
        status: 'listed',
      });

      console.log(`  NFT created: ${nft.name} price=${price} FLOW ipfs=${upload.ipfsHash}`);
    }
  }

  console.log('Seeding complete.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
