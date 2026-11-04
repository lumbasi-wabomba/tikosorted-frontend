export default function Input({ label, prefix, id, className = '', ...rest }) {
  return (
    <label className={`field ${className}`} htmlFor={id}>
      {label && <span className="field__label">{label}</span>}
      <div className="field__wrap">
        {prefix && <span className="field__prefix">{prefix}</span>}
        <input id={id} className="field__input" {...rest} />
      </div>
    </label>
  )
}