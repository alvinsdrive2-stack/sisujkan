interface StatusStampProps {
  kompeten: boolean
}

export function StatusStamp({ kompeten }: StatusStampProps) {
  const color = kompeten ? '#16a34a' : '#dc2626'

  return (
    <svg
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        opacity: 0.6,
      }}
    >
      <defs>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Border circle */}
      <ellipse
        cx="200" cy="150" rx="160" ry="100"
        fill="none"
        stroke={color}
        strokeWidth="6"
        opacity="0.8"
        filter="url(#shadow)"
      />

      {/* Text */}
      <text
        x="200" y={kompeten ? 165 : 140}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize={kompeten ? 52 : 36}
        opacity="0.8"
        transform={`rotate(-25, 200, 150)`}
        filter="url(#shadow)"
      >
        {kompeten ? 'KOMPETEN' : 'TIDAK'}
      </text>

      {!kompeten && (
        <text
          x="200" y={180}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize={36}
          opacity="0.8"
          transform={`rotate(-25, 200, 150)`}
          filter="url(#shadow)"
        >
          KOMPETEN
        </text>
      )}
    </svg>
  )
}
