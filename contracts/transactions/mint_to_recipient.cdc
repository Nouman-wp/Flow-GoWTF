import NonFungibleToken from 0xNonFungibleToken
import AniverseNFT from 0xAniverseNFT

transaction(
    recipient: Address,
    name: String,
    description: String,
    image: String,
    externalURL: String?,
    attributes: [{String: String}],
    collectionName: String,
    rarity: String
) {
    prepare(signer: AuthAccount) {
        let minterRef = signer.borrow<&AniverseNFT.Minter>(from: AniverseNFT.MinterStoragePath)
            ?? panic("Minter not found in signer account")

        let recipientAcct = getAccount(recipient)
        let receiver = recipientAcct.getCapability(AniverseNFT.CollectionPublicPath)
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Recipient collection not set up")

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


