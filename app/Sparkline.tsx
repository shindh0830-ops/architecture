"use client";

interface SparklineProps {
  values: number[];
  positive: boolean;
  width?: number;
  height?: number;
  area?: boolean;
  id?: string;
}

export default function Sparkline({
  values,
  positive,
  width = 120,
  height = 36,
  area = false,
  id,
}: SparklineProps) {
  if (values.length < 2) {
    return <div style={{ width, height }} aria-hidden="true" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y];
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  const color = positive ? "var(--delta-up)" : "var(--delta-down)";
  const gradId = `spark-grad-${id ?? "default"}`;

  const areaPath = area
    ? `${path} L ${points[points.length - 1][0].toFixed(2)},${height} L ${points[0][0].toFixed(2)},${height} Z`
    : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={positive ? "상승 추세" : "하락 추세"}
      style={{ overflow: "visible" }}
    >
      {area && areaPath ? (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
        </>
      ) : null}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
