// Testnet standard contract
import NonFungibleToken from 0x631e88ae7f1d7c20

// Aniverse NFT Contract
// This contract implements the Flow NFT standard for anime-themed NFTs

access(all) contract AniverseNFT: NonFungibleToken {

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    access(all) var totalSupply: UInt64
    
    // NFT Resource
    access(all) resource NFT: NonFungibleToken.NFT {
        
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let image: String
        access(all) let externalURL: String?
        access(all) let attributes: [Attribute]
        access(all) let collection: String
        access(all) let rarity: String
        access(all) let mintDate: UFix64
        
        // Metadata for the NFT
        access(all) struct Attribute { access(all) let trait_type: String; access(all) let value: String }
        
        init(
            id: UInt64,
            name: String,
            description: String,
            image: String,
            externalURL: String?,
            attributes: [Attribute],
            collection: String,
            rarity: String
        ) {
            self.id = id
            self.name = name
            self.description = description
            self.image = image
            self.externalURL = externalURL
            self.attributes = attributes
            self.collection = collection
            self.rarity = rarity
            self.mintDate = getCurrentBlock().timestamp
        }
        
        // Required by NonFungibleToken.NFT
        access(all) fun getID(): UInt64 {
            return self.id
        }
    }
    
    // Collection Resource
    access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
        
        access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}
        
        
        init() {
            self.ownedNFTs = {}
        }
        
        // Required by NonFungibleToken.Provider
        access(all) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let nft <- self.ownedNFTs.remove(key: withdrawID) 
                ?? panic("NFT does not exist in collection")
            return <- nft
        }
        
        // Required by NonFungibleToken.Receiver
        access(all) fun deposit(token: @NonFungibleToken.NFT) {
            let nft = token as! @NFT
            self.ownedNFTs[nft.id] = <- nft
        }
        
        // Required by NonFungibleToken.CollectionPublic
        access(all) fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        access(all) fun borrowNFT(id: UInt64): &NonFungibleToken.NFT? {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT?
        }
        
        // Get the number of NFTs in the collection
        access(all) fun getLength(): Int {
            return self.ownedNFTs.length
        }
        
        // Check if an NFT exists in the collection
        access(all) fun contains(id: UInt64): Bool {
            return self.ownedNFTs[id] != nil
        }
    }
    
    // Admin Resource for minting and managing NFTs
    access(all) resource Minter {

        access(all) fun mintNFT(
            name: String,
            description: String,
            image: String,
            externalURL: String?,
            attributes: [NFT.Attribute],
            collection: String,
            rarity: String,
            recipient: &{NonFungibleToken.CollectionPublic}
        ): UInt64 {
            let newID = AniverseNFT.totalSupply + 1 as UInt64
            AniverseNFT.totalSupply = newID

            let nft <- create NFT(
                id: newID,
                name: name,
                description: description,
                image: image,
                externalURL: externalURL,
                attributes: attributes,
                collection: collection,
                rarity: rarity
            )

            recipient.deposit(token: <- nft)

            emit NonFungibleToken.Deposit(id: newID, to: recipient.owner?.address, from: nil)
            emit NFTMinted(id: newID, name: name, collection: collection)

            return newID
        }

        access(all) fun createCollection(): @Collection {
            return <- create Collection()
        }

        // no custom destructor in Cadence 1.0
    }
    
    // Events
    access(all) event CollectionCreated(owner: Address)
    access(all) event NFTMinted(id: UInt64, name: String, collection: String)
    
    // Public functions
    access(all) fun createEmptyCollection(): @NonFungibleToken.Collection { return <- create Collection() }
    
    // Get the total supply of NFTs
    access(all) fun getTotalSupply(): UInt64 { return self.totalSupply }
    
    // Get NFT metadata by ID
    access(all) fun getNFTMetadata(id: UInt64): NFT? {
        // This would need to be implemented with a mapping of all NFTs
        // For now, return nil
        return nil
    }
    
    // Initialize the contract
    init() {
        self.CollectionStoragePath = /storage/AniverseNFTCollection
        self.CollectionPublicPath = /public/AniverseNFTCollection
        self.MinterStoragePath = /storage/AniverseNFTMinter

        self.totalSupply = 0

        // create and save a minter in contract account storage
        self.account.save(<- create Minter(), to: self.MinterStoragePath)

        emit NonFungibleToken.ContractInitialized()
    }
}
