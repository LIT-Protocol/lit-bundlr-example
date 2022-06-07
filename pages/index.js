// --- UI components ( unrelated to the example )
import s from '../styles/Home.module.css'
import React, {useCallback} from 'react'
import { useState } from 'react';
import prettyBytes from 'pretty-bytes';
import Script from 'next/script'

// --- Essential libs for this example
import LitJsSdk from 'lit-js-sdk'
import DropZone from '../components/DropZone';
import Completed from '../components/Completed';
import Instruction from '../components/Instruction';
import Header from '../components/Header';


export default function Home() {

  // -- arweave states
  const [JWK, setJWK] = useState(null);
  const [arweaveAddress, setArweaveAddress] = useState(null);

  const [currency, setCurrency] = useState('arweave');
  const [node, setNode] = useState("http://node1.bundlr.network");

  const [file, setFile] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [txId, setTxId] = useState(null);

  // -- lit states
  const [accessControlConditions, setAccessControlConditiosn] = useState(null);
  const [humanised, setHumanised] = useState(null);
  const [encryptedData, setEncryptedData] = useState(null);
  const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState(null);
  const [downloadedEncryptedData, setDownloadedEncryptedData] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);

  // -- init litNodeClient
  const litNodeClient = new LitJsSdk.LitNodeClient();
  litNodeClient.connect();

  //
  // (AR) event: when a key file is being dragged to the drop zone
  // @param { Array } accepted files callback from the input
  // @return { void } 
  //
  const onDropKey = useCallback(async acceptedFiles => {

    const supportedFileTypes = ['application/json'];
      
    // Only return a single file
    const file = acceptedFiles[0];

    // -- validate:: if file type is .json
    if( ! supportedFileTypes.includes(file.type) ){
      alert(`Incorrect file type! We only support ${supportedFileTypes.toString()} at the moment`);
      return;
    }

    const fileReader = new FileReader();
    
    fileReader.onload = async (e) => {

      let _JWK = JSON.parse(e.target.result);
  
      console.log("JWK:", _JWK);
  
      setJWK(_JWK);
  
      // arweave will be dealth from backend
      const res = await fetch('./api/arweave', {
        method: 'POST',
        body: JSON.stringify({
          currency,
          node,
          jwk: _JWK,
        })
      });
  
      const _arweaveAddress = (await res.json()).address;
  
      setArweaveAddress(_arweaveAddress);
      
    }

    fileReader.readAsText(file);

  }, []);

  //
  // (LIT) event: when a file is being dragged to the drop zone
  // @param { Array } accepted files callback from the input
  // @return { void } 
  //
  const onDropFile = useCallback(async acceptedFiles => {

    const supportedFileTypes = ['image/jpeg', 'image/png'];
      
    // Only return a single file
    const file = acceptedFiles[0];

    // -- validate:: if file type is .json
    if( ! supportedFileTypes.includes(file.type) ){
      alert(`Incorrect file type! We only support ${supportedFileTypes.toString()} at the moment`);
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
    
      const dataURL = e.target.result;
  
      console.log("DataURL:", dataURL);
  
      setFile(dataURL);
  
      setFileSize(prettyBytes(dataURL.length));
  
    }

    fileReader.readAsDataURL(file);

  }, []);

  // 
  // (LIT Modal) Close share modal
  // @return { void }
  // 
  const closeModal = () => {
    ACCM.ReactContentRenderer.unmount(document.getElementById("shareModal"));
  }

  // 
  // (LIT Modal) Set access control conditions
  // @return { void }
  // 
  const onClickSetAccessControl = () => {

    ACCM.ReactContentRenderer.render(
      ACCM.ShareModal,
      {
        sharingItem: [],
        onAccessControlConditionsSelected: async (accessControlConditions) => {

          console.log("accessControlConditions:", accessControlConditions);

          let humanised = await LitJsSdk.humanizeAccessControlConditions({accessControlConditions: accessControlConditions.accessControlConditions})
          
          console.log("humanised:", humanised);
            
          setAccessControlConditiosn(accessControlConditions);
          
          setHumanised(humanised);

          closeModal();

        },
        onClose: closeModal,
        getSharingLink: (sharingItem) => {},
        showStep: "ableToAccess",
      },
      document.getElementById('shareModal'),
    );

  }

  // 
  // (LIT) Encrypt image data
  // @return { void } 
  // 
  const onClickEncryptImage = async () => {

    const fileInBase64 = btoa(file);

    console.log("fileInBase64:", fileInBase64);
    
    const chain = 'ethereum';

    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})

    // Visit here to understand how to encrypt static content
    // https://developer.litprotocol.com/docs/LitTools/JSSDK/staticContent
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(fileInBase64);
    
    const encryptedSymmetricKey = await litNodeClient.saveEncryptionKey({
      accessControlConditions: accessControlConditions.accessControlConditions,
      symmetricKey,
      authSig,
      chain,
    });
    
    console.log("encryptedString:", encryptedString);

    const encryptedStringInDataURI = await blobToDataURI(encryptedString);

    console.log("encryptedStringInDataURI:", encryptedStringInDataURI);

    setEncryptedData(encryptedStringInDataURI);

    setEncryptedSymmetricKey(encryptedSymmetricKey);
    
  }

  // 
  // (AR) Sign and upload to arweave
  // @return { void } 
  // 
  const onClickSignAndUpload = async () => {

    console.log('onClickSignAndUpload');
    
    const packagedData = {
      encryptedData: await encryptedData,
      encryptedSymmetricKey,
      accessControlConditions: accessControlConditions.accessControlConditions,
    };

    console.log("packagedData:", packagedData);

    const packagedDataInString = JSON.stringify(packagedData);

    console.log("packagedDataInString:", packagedDataInString);

    // (POST) Get estimate to upload and sign
    const gastimateResult = (await (await fetch('./api/arweave/gastimate', {
      method: 'POST',
      body: JSON.stringify({
        currency,
        node,
        jwk: JWK,
        encryptedData: packagedDataInString,
      })
    })).json()).gastimate;
  
    // -- Stop if 'cancel' is selected
    if( ! confirm(gastimateResult)) return;
    
    // (POST) Get estimate to upload and sign
    const upload = await fetch('./api/arweave/upload', {
      method: 'POST',
      body: JSON.stringify({
        currency,
        node,
        jwk: JWK,
        encryptedData: packagedDataInString,
      })
    });

    const txId = (await upload.json()).txId;

    console.log("Uploaded! Transaction ID:", txId);
    
    setTxId(txId);
    
  }

  //
  // (Helper) Turn blob data to data URI
  // @param { Blob } blob
  // @return { Promise<String> } blob data in data URI
  //
  const blobToDataURI = (blob) => {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();

        reader.onload = (e) => {
        var data = e.target.result;
        resolve(data);
        };
        reader.readAsDataURL(blob);
    });
  }

  //
  // (Helper) Convert data URI to blob
  // @param { String } dataURI
  // @return { Blob } blob object
  //
  const dataURItoBlob = (dataURI) => {

    console.log(dataURI);

    
    var byteString = window.atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    var blob = new Blob([ab], {type: mimeString});

    return blob;
  }

  // 
  // (GET) Fetch Encrypted Data
  // @return { void }
  // 
  const onFetchEncryptedData = async () => {
    
    const downloadUrl = 'https://arweave.net/' + txId;

    const data = await fetch(downloadUrl);

    const encryptedData = JSON.parse(await data.text());

    console.log("encryptedData:", encryptedData);

    setDownloadedEncryptedData(encryptedData);

  }

  // 
  // (LIT) Decrypt downloaded encrypted data
  // @return { void }
  // 
  const onDecryptDownloadedData = async () => {

    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: 'ethereum'})

    const symmetricKey = await litNodeClient.getEncryptionKey({
      accessControlConditions: downloadedEncryptedData.accessControlConditions,
      // Note, below we convert the encryptedSymmetricKey from a UInt8Array to a hex string.  This is because we obtained the encryptedSymmetricKey from "saveEncryptionKey" which returns a UInt8Array.  But the getEncryptionKey method expects a hex string.
      toDecrypt: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16"),
      chain: 'ethereum',
      authSig,
    });

    const decryptedString = await LitJsSdk.decryptString(
      dataURItoBlob(downloadedEncryptedData.encryptedData),
      symmetricKey
    );

    const originalFormat = atob(decryptedString);

    console.log("Original Format:", originalFormat);

    setDecryptedData(originalFormat);

  }

  return (
    <div className={s.content}>

      {/* ----- Lit Share Modal ----- */}
      {/* 
        Hidden in the background, but will appear when you click to 
        set the access control conditions
      */}
      <div id="shareModal"></div>

      {/* ----- Header ----- */}
      <Header
        title="Here's an example of how to use Bundlr / Arweave with Lit."
      />

      {/* ==================== Prerequisite ==================== */}
      <h2>Prerequisite</h2>
      <div className={s.text}>1. You will need to have an Arweave wallet already, if not click <a target="_blank" rel="noreferrer" href="https://arweave.app/">here</a></div>
      <div className={s.text}>2. You will need to fund the node (it might take up to an hour), more info <a target="_blank" rel="noreferrer" href="https://docs.bundlr.network/docs/client/cli">here</a></div>

      {/* ==================== Encryption ==================== */}
      <h2>Encryption</h2>
      
      {/* ----- Step 1 ----- */}
      <Instruction title='1. Drop your wallet.json keyfile to login' subtitle='It uses the FileReader API to read the file as text and pass it to the Bundlr constructor to get its wallet address'/>

      {
        JWK == null
        ? <DropZone onDrop={ onDropKey }/>
        : <Completed title="Arweave JWK key loaded!" subtitle={`Address: ${arweaveAddress}`}/>
      }

      {/* ----- Step 2 ----- */}
      {
        (!JWK) ? '' : 
        <>
          <Instruction title='2. Select an image you want to upload' subtitle="It uses the FileReader API to read the image as data URL" />
    
          {
            (JWK == null || file == null) 
            ? <DropZone onDrop={ onDropFile }/> 
            : <Completed title="Got your image!" subtitle={`Size: ${ fileSize }`}/>
          }
        </>
      }

      {/* ----- Step 3 ----- */}
      {
        (!JWK || !file) ? '' 
        : 
        <>
          <Instruction title='3. Set access control conditions of your image' subtitle="Prepare access control conditions for lit nodes to sign later"/>
          
          {
            ( !JWK || !file || !accessControlConditions )
            ? <button onClick={() => onClickSetAccessControl()} className={s.btn}>Set Access Control Conditions</button>
            : <Completed title="Access control conditions set!" subtitle={`${ humanised }`}/>
          }

        </>
      }

      {/* ----- Step 4 ----- */}
      {
        (!JWK || !file || !accessControlConditions) ? '' 
        : 
        <>
          <Instruction title='4. Click to encrypt image' subtitle="Since the 'encryptString' function requires a String, we will turn the file into a string format, encrypt it and save the encryption key to lit nodes" />
          
          {
            ( !JWK || !file || !accessControlConditions || !encryptedData )
            ? <button onClick={() => onClickEncryptImage()} className={s.btn}>Encrypt Image</button>
            : <Completed title="Image encrypted!" subtitle="Encrypted key is stored to lit nodes"/>
          }

        </>
      }

      {/* ----- Step 5 ----- */}
      {
        (!JWK || !file || !accessControlConditions || !encryptedData ) ? '' 
        : 
        <>
          <Instruction title='5. Click to sign and upload to Arweave'
            subtitle='We will combine access control conditions, encrypted image data, and encrypted symmetric key as JSON, and turn it into String format'
          />
          
          {
            ( !JWK || !file || !accessControlConditions || !encryptedData || !txId )
            ? <button onClick={() => onClickSignAndUpload()} className={s.btn}>Sign and upload to Arweave</button>
            : 
            <Completed title="Encrypted image uploaded to Arweave!'">
              View Transaction: <a className={s.link} target="_blank" rel="noreferrer" href={`https://arweave.app/tx/${txId}`}>{`https://arweave.app/tx/${txId}`}</a>
              <br/>
              Download Link: <a className={s.link} target="_blank" rel="noreferrer" href={`https://arweave.net/${txId}`}>{`https://arweave.net/${txId}`}</a>

            </Completed>
          }

        </>
      }

      {/* ==================== Decryption ==================== */}

      {/* ----- Step 6 ----- */}
      {
        (!JWK || !file || !accessControlConditions || !encryptedData || !txId ) ? '' 
        : 
        <>
          <h2>Decryption</h2>
          
          <Instruction title='6. Click to fetch the encrypted data from Arweave' subtitle="The returned JSON data will have two of the three required parameters, accessControlConditions and encryptedSymmetricKey to retrieve the key shares from the lit nodes"/>
          
          {
            (!JWK || !file || !accessControlConditions || !encryptedData || !downloadedEncryptedData ) 
            ? <button onClick={() => onFetchEncryptedData()} className={s.btn}>{`https://arweave.net/${txId}`}</button>
            : 
            <Completed title="Encrypted data downloaded" className={s.code}>
                <code className={s.code}>
                { JSON.stringify(downloadedEncryptedData) }
                </code>
            </Completed>
          }
        </>
      }
      
      {/* ----- Step 7 ----- */}
      {
        (!JWK || !file || !accessControlConditions || !encryptedData || !txId || !downloadedEncryptedData ) ? '' 
        : 
        <>
          <Instruction title='7. Click to decrypt the downloaded encrypted data' subtitle="In the last step, we retrieved 'accessControlConditions' and 'encryptedSymmetricKey` as two of the required parameters to unlock the symmetric key, the last required parameter is the authentication signature from your wallet. Now that we have got all three, we will pass it to the getEncryptionKey function to get the symmetric key, and pass both symmetric key and encrypted data to the decryption function to unlock the original image"/>
          
          {
            (!JWK || !file || !accessControlConditions || !encryptedData || !downloadedEncryptedData || !decryptedData ) 
            ? <button onClick={() => onDecryptDownloadedData()} className={s.btn}>{'Decrypt downloaded encrypted data'}</button>
            : 
            <Completed title="Done. Data decrypted!" className={s.code}>
                <img src={decryptedData} />
            </Completed>
          }
        </>
      }

      

      {/* ----- Docs ----- */}
      {/* 
        Please visit the following links for more information, or 
        contact us via email, discord, twitter, etc.
      */}
      <div className={s.footer}>
        <div className={s.footer_title}>References:</div>
        <ul>
          <li><a target="_blank" rel="noreferrer" href="https://github.com/LIT-Protocol/lit-bundlr-example">GitHub</a></li>
          <li><a target="_blank" rel="noreferrer" href="https://docs.bundlr.network/docs/overview">https://docs.bundlr.network/docs/overview</a></li>
          <li><a target="_blank" rel="noreferrer" href="https://developer.litprotocol.com/docs/intro">https://developer.litprotocol.com/docs/intro</a></li>
        </ul>
      </div>

      {/* ----- Required JS libraries ----- */}
      {/* 
        Unfortunately, because NextJS forbids importing CSS modules in dependencies, this library cannot be used in NextJS natively. You must use the vanilla js project above, which will work fine with NextJS.
        READ MORE HERE: https://developer.litprotocol.com/docs/LitTools/shareModal
      */}
      <Script src="https://cdn.jsdelivr.net/npm/lit-share-modal-v2-vanilla-js/dist/index.js"></Script>

    </div>
  )
}
