// Pure CSS horizontal bar chart — zero dependencies, strict geometry.
export default function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="bar-chart">
      {data.map(item => (
        <div key={item.label} className="bar-chart__row">
          <span className="bar-chart__label">{item.label}</span>
          <div className="bar-chart__track">
            <div
              className="bar-chart__fill"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color || 'var(--ink)',
              }}
            />
          </div>
          <span className="bar-chart__value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}