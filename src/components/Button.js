export default function Button({ variant = 'solid', busy = false, disabled = false, className = '', children, ...rest }) {
  const classes = ['btn', variant === 'outline' ? 'btn--outline' : 'btn--solid', busy && 'btn--busy', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} disabled={busy || disabled} {...rest}>
      {children}
    </button>
  )
}
