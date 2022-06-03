import s from '../styles/Home.module.css'
import DoneIcon from './DoneIcon';

const Completed = ({title, subtitle, children}) => {
    return (
        <div className={s.done}>
            <DoneIcon/>
            <div>{ title }</div>
            <div>
                { subtitle }
                { children }
            </div>
        </div>
    );
}

export default Completed;