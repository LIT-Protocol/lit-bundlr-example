# How to use Bundlr/Arweave with Lit

This is an example project of showing you how to use bundlr/arweave with lit in the browser and on the backend

Demo here: https://lit-bundlr.herokuapp.com/

# Learn how it works technically

- Follow each step in `pages/index.js` 
  > eg. [Step 1](https://github.com/LIT-Protocol/lit-bundlr-example/blob/2d34f639ae196f18aa0eb5168c01342ceb708fc6/pages/index.js#L372) -> calls [onDropKey()](https://github.com/LIT-Protocol/lit-bundlr-example/blob/2d34f639ae196f18aa0eb5168c01342ceb708fc6/pages/index.js#L377) function

- Arweave APIs `pages/api/arweave`
  > `/pages/api/arweave/index.js` returns wallet address
  > `/pages/api/arweave/gastimate.js` returns the cost to upload
  > `/pages/api/arweave/upload.js` sign and upload and return transaction ID