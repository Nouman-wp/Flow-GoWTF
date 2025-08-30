import NonFungibleToken from "./interfaces/NonFungibleToken.cdc"
import MetadataViews from "./interfaces/MetadataViews.cdc"

// Aniverse NFT Contract
// This contract implements the Flow NFT standard for anime-themed NFTs

pub contract AniverseNFT: NonFungibleToken {
    
    // NFT Resource
    pub resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        
        pub let id: UInt64
        pub let name: String
        pub let description: String
        pub let image: String
        pub let externalURL: String?
        pub let attributes: [Attribute]
        pub let collection: String
        pub let rarity: String
        pub let mintDate: UFix64
        pub let creator: Address
        
        // Metadata for the NFT
        pub struct Attribute {
            pub let trait_type: String
            pub let value: String
        }
        
        init(
            id: UInt64,
            name: String,
            description: String,
            image: String,
            externalURL: String?,
            attributes: [Attribute],
            collection: String,
            rarity: String,
            creator: Address
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
            self.creator = creator
        }
        
        // Required by NonFungibleToken.INFT
        pub fun getID(): UInt64 {
            return self.id
        }
        
        // Required by MetadataViews.Resolver
        pub fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.name,
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.image),
                        externalURL: self.externalURL
                    )
                case Type<MetadataViews.NFTView>():
                    return MetadataViews.NFTView(
                        id: self.id,
                        name: self.name,
                        description: self.description,
                        thumbnail: self.image,
                        externalURL: self.externalURL,
                        attributes: self.attributes.map { attr in
                            MetadataViews.Attribute(
                                trait_type: attr.trait_type,
                                value: attr.value
                            )
                        }
                    )
                default:
                    return nil
            }
        }
    }
    
    // Collection Resource
    pub resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
        
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}
        pub var idCounter: UInt64
        
        init() {
            self.ownedNFTs = {}
            self.idCounter = 0
        }
        
        // Required by NonFungibleToken.Provider
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let nft <- self.ownedNFTs.remove(key: withdrawID) 
                ?? panic("NFT does not exist in collection")
            return <- nft
        }
        
        // Required by NonFungibleToken.Receiver
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let nft = token as! @NFT
            self.ownedNFTs[nft.id] = <- nft
        }
        
        // Required by NonFungibleToken.CollectionPublic
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT? {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT?
        }
        
        // Required by MetadataViews.ResolverCollection
        pub fun resolveView(_ view: Type): AnyStruct? {
            return nil
        }
        
        pub fun resolveViewTyped<T: MetadataViews.Resolver>(_ view: Type): T? {
            return nil
        }
        
        // Get the number of NFTs in the collection
        pub fun getLength(): Int {
            return self.ownedNFTs.length
        }
        
        // Check if an NFT exists in the collection
        pub fun contains(id: UInt64): Bool {
            return self.ownedNFTs[id] != nil
        }
    }
    
    // Admin Resource for minting and managing NFTs
    pub resource Admin {
        
        pub fun mintNFT(
            name: String,
            description: String,
            image: String,
            externalURL: String?,
            attributes: [NFT.Attribute],
            collection: String,
            rarity: String,
            recipient: &{NonFungibleToken.CollectionPublic}
        ): UInt64 {
            let id = self.uuid
            
            let nft = NFT(
                id: id,
                name: name,
                description: description,
                image: image,
                externalURL: externalURL,
                attributes: attributes,
                collection: collection,
                rarity: rarity,
                creator: recipient.owner?.address ?? panic("Invalid recipient")
            )
            
            recipient.deposit(token: <- nft)
            
            emit NonFungibleToken.Withdraw(id: id, from: nil, to: recipient.owner?.address)
            emit NonFungibleToken.Deposit(id: id, to: recipient.owner?.address, from: nil)
            
            return id
        }
        
        // Mint limited supply NFTs
        pub fun mintLimitedNFT(
            name: String,
            description: String,
            image: String,
            externalURL: String?,
            attributes: [NFT.Attribute],
            collection: String,
            rarity: String,
            recipient: &{NonFungibleToken.CollectionPublic},
            maxSupply: UInt64
        ): UInt64 {
            // Check if max supply reached
            // This is a simplified version - in production you'd track supply per collection
            return self.mintNFT(
                name: name,
                description: description,
                image: image,
                externalURL: externalURL,
                attributes: attributes,
                collection: collection,
                rarity: rarity,
                recipient: recipient
            )
        }
        
        // Create a new collection
        pub fun createCollection(): @Collection {
            return <- create Collection()
        }
        
        // Destroy the admin resource
        destroy() {}
    }
    
    // Events
    pub event CollectionCreated(owner: Address)
    pub event NFTMinted(id: UInt64, name: String, collection: String)
    
    // Public functions
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }
    
    // Get the total supply of NFTs
    pub fun getTotalSupply(): UInt64 {
        return self.uuid
    }
    
    // Get NFT metadata by ID
    pub fun getNFTMetadata(id: UInt64): NFT? {
        // This would need to be implemented with a mapping of all NFTs
        // For now, return nil
        return nil
    }
    
    // Initialize the contract
    init() {
        // Emit the contract initialization event
        emit NonFungibleToken.ContractInitialized()
    }
}
