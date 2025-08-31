import FungibleToken from 0xFungibleToken
import FlowToken from 0xFlowToken
import NonFungibleToken from 0xNonFungibleToken
import AniverseNFT from 0xAniverseNFT

transaction(
    seller: Address,
    price: UFix64,
    name: String,
    description: String,
    image: String,
    externalURL: String?,
    attributes: [{String: String}],
    collectionName: String,
    rarity: String
) {
    let buyerVault: &FlowToken.Vault

    prepare(signer: AuthAccount) {
        self.buyerVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Missing FlowToken Vault")

        let sellerReceiver = getAccount(seller)
            .getCapability(/public/flowTokenReceiver)
            .borrow<&{FungibleToken.Receiver}>()
            ?? panic("Seller receiver not found")

        let sent <- self.buyerVault.withdraw(amount: price) as! @FlowToken.Vault
        sellerReceiver.deposit(from: <- sent)

        let minterRef = signer.borrow<&AniverseNFT.Minter>(from: AniverseNFT.MinterStoragePath)
            ?? panic("Minter not found in signer account")

        let receiver = signer.getCapability(AniverseNFT.CollectionPublicPath)
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Buyer collection not set up")

        let attrs: [AniverseNFT.NFT.Attribute] = []
        for a in attributes {
            let t = a["trait_type"] ?? panic("attr trait_type missing")
            let v = a["value"] ?? panic("attr value missing")
            attrs.append(AniverseNFT.NFT.Attribute(trait_type: t, value: v))
        }

        _ = minterRef.mintNFT(
            name: name,
            description: description,
            image: image,
            externalURL: externalURL,
            attributes: attrs,
            collection: collectionName,
            rarity: rarity,
            recipient: receiver
        )
    }
}


