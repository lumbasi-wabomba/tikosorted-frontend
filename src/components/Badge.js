export default function Badge({ kind = 'default', children }) {
  const cls = 'badge' + (kind !== 'default' ? ` badge--${kind}` : '')
  return <span className={cls}>{children}</span>
}