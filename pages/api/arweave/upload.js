// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import Bundlr from '@bundlr-network/client';

export default async function handler(req, res) {

    const data = JSON.parse(req.body);

    // NOTE: .default is required for non-ts code, otherwise we could simply use Bundlr(.., .., ..);
    const bundlr = new Bundlr(data.node, data.currency, data.jwk);

    // create a Bundlr Transaction
    const tx = bundlr.createTransaction(data.encryptedData)

    // sign the transaction
    await tx.sign()

    const id = tx.id
    
    // upload the transaction
    const result = await tx.upload();
    
    console.log("result:", result);

    res.status(200).json({ txId: id });
}
