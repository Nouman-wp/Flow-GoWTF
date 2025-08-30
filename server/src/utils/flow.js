const fcl = require('@onflow/fcl');
const t = require('@onflow/types');

// Configure FCL for the environment
const configureFCL = () => {
  if (process.env.NODE_ENV === 'production') {
    // Mainnet configuration
    fcl.config()
      .put('accessNode.api', 'https://rest-mainnet.onflow.org')
      .put('discovery.wallet', 'https://fcl-discovery.onflow.org/authn')
      .put('discovery.authn.endpoint', 'https://fcl-discovery.onflow.org/api/authn')
      .put('app.detail.title', 'Aniverse NFT Platform')
      .put('app.detail.icon', 'https://aniverse.com/icon.png');
  } else {
    // Testnet configuration
    fcl.config()
      .put('accessNode.api', process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
      .put('discovery.wallet', 'https://fcl-discovery.onflow.org/authn')
      .put('discovery.authn.endpoint', 'https://fcl-discovery.onflow.org/api/authn')
      .put('app.detail.title', 'Aniverse NFT Platform (Testnet)')
      .put('app.detail.icon', 'https://aniverse.com/icon.png');
  }
};

// Initialize FCL configuration
configureFCL();

// Flow transaction templates
const FLOW_TRANSACTIONS = {
  CREATE_COLLECTION: `
    import NonFungibleToken from 0xNonFungibleToken
    import AniverseNFT from ${process.env.FLOW_CONTRACT_ADDRESS}
    
    transaction {
      prepare(signer: AuthAccount) {
        // Create a new empty collection
        let collection <- AniverseNFT.createEmptyCollection()
        
        // Store it in the account
        signer.save(<-collection, to: AniverseNFT.CollectionStoragePath)
        
        // Create a public capability for the collection
        signer.link<&AniverseNFT.Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.ReceiverPublic, AniverseNFT.CollectionPublic}>(
          AniverseNFT.CollectionPublicPath,
          target: AniverseNFT.CollectionStoragePath
        )
      }
    }
  `,
  
  MINT_NFT: `
    import NonFungibleToken from 0xNonFungibleToken
    import AniverseNFT from ${process.env.FLOW_CONTRACT_ADDRESS}
    
    transaction(
      name: String,
      description: String,
      image: String,
      externalURL: String?,
      attributes: [AniverseNFT.Attribute],
      collection: String,
      rarity: String
    ) {
      let minter: &AniverseNFT.Admin
      let recipient: &{NonFungibleToken.CollectionPublic}
      
      prepare(signer: AuthAccount) {
        // Get the minter capability
        self.minter = signer.borrow<&AniverseNFT.Admin>(from: AniverseNFT.AdminStoragePath)
          ?? panic("Could not borrow Admin capability")
        
        // Get the recipient's collection capability
        self.recipient = getAccount(0xRecipientAddress)
          .getCapability<&{NonFungibleToken.CollectionPublic}>(AniverseNFT.CollectionPublicPath)
          ?? panic("Could not get recipient collection capability")
      }
      
      execute {
        // Mint the NFT
        let nftId = self.minter.mintNFT(
          name: name,
          description: description,
          image: image,
          externalURL: externalURL,
          attributes: attributes,
          collection: collection,
          rarity: rarity,
          recipient: self.recipient
        )
        
        log("NFT minted with ID: ".concat(nftId.toString()))
      }
    }
  `,
  
  TRANSFER_NFT: `
    import NonFungibleToken from 0xNonFungibleToken
    import AniverseNFT from ${process.env.FLOW_CONTRACT_ADDRESS}
    
    transaction(
      id: UInt64,
      recipient: Address
    ) {
      let senderCollection: &AniverseNFT.Collection
      let recipientCollection: &{NonFungibleToken.Receiver}
      
      prepare(signer: AuthAccount) {
        // Get the sender's collection
        self.senderCollection = signer.borrow<&AniverseNFT.Collection>(from: AniverseNFT.CollectionStoragePath)
          ?? panic("Could not borrow sender collection")
        
        // Get the recipient's collection capability
        self.recipientCollection = getAccount(recipient)
          .getCapability<&{NonFungibleToken.Receiver}>(AniverseNFT.CollectionReceiverPath)
          ?? panic("Could not borrow recipient collection")
      }
      
      execute {
        // Withdraw the NFT from the sender's collection
        let nft <- self.senderCollection.withdraw(withdrawID: id)
        
        // Deposit it to the recipient's collection
        self.recipientCollection.deposit(token: <-nft)
        
        log("NFT transferred to: ".concat(recipient.toString()))
      }
    }
  `
};

// Flow scripts (read-only operations)
const FLOW_SCRIPTS = {
  GET_COLLECTION_LENGTH: `
    import NonFungibleToken from 0xNonFungibleToken
    import AniverseNFT from ${process.env.FLOW_CONTRACT_ADDRESS}
    
    pub fun main(address: Address): Int {
      let collection = getAccount(address)
        .getCapability<&AniverseNFT.Collection{NonFungibleToken.CollectionPublic}>(AniverseNFT.CollectionPublicPath)
        ?? panic("Could not borrow collection capability")
      
      return collection.getLength()
    }
  `,
  
  GET_NFT_IDS: `
    import NonFungibleToken from 0xNonFungibleToken
    import AniverseNFT from ${process.env.FLOW_CONTRACT_ADDRESS}
    
    pub fun main(address: Address): [UInt64] {
      let collection = getAccount(address)
        .getCapability<&AniverseNFT.Collection{NonFungibleToken.CollectionPublic}>(AniverseNFT.CollectionPublicPath)
        ?? panic("Could not borrow collection capability")
      
      return collection.getIDs()
    }
  `,
  
  GET_NFT_METADATA: `
    import NonFungibleToken from 0xNonFungibleToken
    import AniverseNFT from ${process.env.FLOW_CONTRACT_ADDRESS}
    
    pub fun main(address: Address, id: UInt64): AniverseNFT.NFT? {
      let collection = getAccount(address)
        .getCapability<&AniverseNFT.Collection{NonFungibleToken.CollectionPublic}>(AniverseNFT.CollectionPublicPath)
        ?? panic("Could not borrow collection capability")
      
      return collection.borrowNFT(id: id)
    }
  `
};

// Flow utility functions
const flowUtils = {
  // Get account info
  async getAccount(address) {
    try {
      const account = await fcl.send([fcl.getAccount(address)]);
      return fcl.decode(account);
    } catch (error) {
      console.error('Error getting account:', error);
      throw error;
    }
  },

  // Execute a transaction
  async executeTransaction(transactionCode, args = [], proposer, authorizer, payer) {
    try {
      const transactionId = await fcl.send([
        fcl.transaction(transactionCode),
        fcl.args(args),
        fcl.proposer(proposer),
        fcl.authorizations([authorizer]),
        fcl.payer(payer)
      ]);
      
      const transaction = await fcl.tx(transactionId).onceSealed();
      return transaction;
    } catch (error) {
      console.error('Error executing transaction:', error);
      throw error;
    }
  },

  // Execute a script (read-only)
  async executeScript(scriptCode, args = []) {
    try {
      const result = await fcl.send([
        fcl.script(scriptCode),
        fcl.args(args)
      ]);
      
      return fcl.decode(result);
    } catch (error) {
      console.error('Error executing script:', error);
      throw error;
    }
  },

  // Create a new collection for a user
  async createCollection(userAddress) {
    try {
      const transaction = await this.executeTransaction(
        FLOW_TRANSACTIONS.CREATE_COLLECTION,
        [],
        userAddress,
        userAddress,
        userAddress
      );
      
      return transaction;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  },

  // Mint a new NFT
  async mintNFT(
    name,
    description,
    image,
    externalURL,
    attributes,
    collection,
    rarity,
    recipientAddress,
    minterAddress
  ) {
    try {
      const args = [
        fcl.arg(name, t.String),
        fcl.arg(description, t.String),
        fcl.arg(image, t.String),
        fcl.arg(externalURL, t.Optional(t.String)),
        fcl.arg(attributes, t.Array(t.Struct('Attribute', {
          trait_type: t.String,
          value: t.String
        }))),
        fcl.arg(collection, t.String),
        fcl.arg(rarity, t.String)
      ];

      const transaction = await this.executeTransaction(
        FLOW_TRANSACTIONS.MINT_NFT,
        args,
        minterAddress,
        minterAddress,
        minterAddress
      );
      
      return transaction;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  },

  // Transfer an NFT
  async transferNFT(nftId, fromAddress, toAddress) {
    try {
      const args = [
        fcl.arg(nftId, t.UInt64),
        fcl.arg(toAddress, t.Address)
      ];

      const transaction = await this.executeTransaction(
        FLOW_TRANSACTIONS.TRANSFER_NFT,
        args,
        fromAddress,
        fromAddress,
        fromAddress
      );
      
      return transaction;
    } catch (error) {
      console.error('Error transferring NFT:', error);
      throw error;
    }
  },

  // Get collection length
  async getCollectionLength(address) {
    try {
      const result = await this.executeScript(FLOW_SCRIPTS.GET_COLLECTION_LENGTH, [
        fcl.arg(address, t.Address)
      ]);
      
      return result;
    } catch (error) {
      console.error('Error getting collection length:', error);
      throw error;
    }
  },

  // Get NFT IDs in collection
  async getNFTIds(address) {
    try {
      const result = await this.executeScript(FLOW_SCRIPTS.GET_NFT_IDS, [
        fcl.arg(address, t.Address)
      ]);
      
      return result;
    } catch (error) {
      console.error('Error getting NFT IDs:', error);
      throw error;
    }
  },

  // Get NFT metadata
  async getNFTMetadata(address, nftId) {
    try {
      const result = await this.executeScript(FLOW_SCRIPTS.GET_NFT_METADATA, [
        fcl.arg(address, t.Address),
        fcl.arg(nftId, t.UInt64)
      ]);
      
      return result;
    } catch (error) {
      console.error('Error getting NFT metadata:', error);
      throw error;
    }
  },

  // Check if account has collection
  async hasCollection(address) {
    try {
      const account = await this.getAccount(address);
      return account.contracts[process.env.FLOW_CONTRACT_ADDRESS] !== undefined;
    } catch (error) {
      console.error('Error checking collection:', error);
      return false;
    }
  },

  // Get Flow balance
  async getFlowBalance(address) {
    try {
      const account = await this.getAccount(address);
      return account.balance;
    } catch (error) {
      console.error('Error getting Flow balance:', error);
      throw error;
    }
  }
};

module.exports = {
  fcl,
  flowUtils,
  FLOW_TRANSACTIONS,
  FLOW_SCRIPTS
};
