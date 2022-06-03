import UploadIcon from "./UploadIcon";
import { useDropzone } from 'react-dropzone'
import s from '../styles/Home.module.css'

const DropZone = ({onDrop, text}) => {
    
    const _text = text ?? 'Click or drop your file here';

    // useDropzone
    const { getRootProps, getInputProps, isDragActive } = useDropzone({onDrop})

    return (
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <div className={s.dropzone}>
            <div className={s.dropzoneicon}>
              <UploadIcon/>
            </div>
            <div>{ _text }</div>
          </div>
        </div>
    );
}

export default DropZone;