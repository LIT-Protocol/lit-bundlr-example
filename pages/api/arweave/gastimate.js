// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import Bundlr from '@bundlr-network/client';
import prettyBytes from 'pretty-bytes';

export default async function handler(req, res) {

    const data = JSON.parse(req.body);

    // NOTE: .default is required for non-ts code, otherwise we could simply use Bundlr(.., .., ..);
    const bundlr = new Bundlr(data.node, data.currency, data.jwk);

    console.log("data.encryptedData:", data.encryptedData);

    // create a Bundlr Transaction
    const tx = bundlr.createTransaction(data.encryptedData)
    
    // want to know how much you'll need for an upload? simply:
    // get the number of bytes you want to upload
    const size = tx.size

    // query the bundlr node to see the price for that amount
    const cost = await bundlr.getPrice(size);

    res.status(200).json({ 
        gastimate: `To upload ${prettyBytes(size)} it cost about ${cost.c[0]} Winston or ${cost.c[0] / 1000000000000} AR`,
    });
}
