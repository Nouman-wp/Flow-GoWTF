import NonFungibleToken from 0xNonFungibleToken
import AniverseNFT from 0xAniverseNFT

transaction {
    prepare(signer: AuthAccount) {
        if signer.borrow<&AniverseNFT.Collection>(from: AniverseNFT.CollectionStoragePath) == nil {
            let collection <- AniverseNFT.createEmptyCollection()
            signer.save(<-collection, to: AniverseNFT.CollectionStoragePath)

            signer.link<&AniverseNFT.Collection{NonFungibleToken.CollectionPublic}>(
                AniverseNFT.CollectionPublicPath,
                target: AniverseNFT.CollectionStoragePath
            )
        }
    }
}


