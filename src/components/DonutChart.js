// Pure SVG donut — computed via stroke-dasharray on a circle.
export default function DonutChart({ data, size = 200, thickness = 28 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="donut-chart">
      <svg width={size} height={size} className="donut-chart__svg">
        {data.map((d, i) => {
          const length = (d.value / total) * circumference
          const dashArray = `${length} ${circumference - length}`
          const dashOffset = -offset
          offset += length
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
        })}
      </svg>
      <div className="donut-chart__legend">
        {data.map((d, i) => (
          <div key={i} className="donut-chart__legend-item">
            <span className="donut-chart__dot" style={{ background: d.color }} />
            <span className="donut-chart__legend-name">{d.label}</span>
            <span className="donut-chart__legend-pct">
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}