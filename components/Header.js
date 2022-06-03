import { LitLogo } from '@websaam/ui';
import s from '../styles/Home.module.css'

const Header = ({title}) => {
    return (
        <>
            <div className={s.header}>
                <LitLogo
                cursorPointer={true}
                onClick={() => {console.log();}}
                title="Lit Protocol"
                subtitle="x Bundlr/Arweave Example"
                />
            </div>

            <h1 className={s.title}>
                { title }
            </h1>
        </>
    );
}

export default Header;