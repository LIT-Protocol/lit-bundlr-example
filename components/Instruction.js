import s from '../styles/Home.module.css'

const Instruction = ({title, subtitle }) => {
    return (
        <div className={s.step}>
            <div>{ title }</div>
            <div>{ subtitle }</div>
        </div>
    );
}

export default Instruction;