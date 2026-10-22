interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  unit?: string;
  fillGradient?: boolean;
}

export function LineChart({ data, height = 140, color = '#245C40', unit = '', fillGradient = true }: LineChartProps) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.05;
  const range = max - min || 1;
  const width = 300;
  const padding = 8;
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: height - padding - ((d.value - min) / range) * (height - padding * 2),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const gradientId = `grad-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fillGradient && <path d={areaD} fill={`url(#${gradientId})`} />}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
          <text x={p.x} y={height - 1} textAnchor="middle" fontSize="9" fill="#6E746D">{data[i].label}</text>
        </g>
      ))}
      <text x={padding} y={12} fontSize="10" fill="#9CA29A" fontWeight="600">{Math.round(max)}{unit}</text>
    </svg>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  unit?: string;
  maxValue?: number;
}

export function BarChart({ data, height = 140, unit = '', maxValue }: BarChartProps) {
  const values = data.map((d) => d.value);
  const max = maxValue || Math.max(...values, 1) * 1.1;
  const width = 300;
  const padding = 8;
  const barWidth = (width - padding * 2) / data.length * 0.6;
  const gap = (width - padding * 2) / data.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - padding * 2 - 16);
        const x = padding + i * gap + (gap - barWidth) / 2;
        const y = height - padding - 16 - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx="3" fill={d.color || '#8BAF91'} />
            {d.value > 0 && <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#4A4F49" fontWeight="600">{d.value}{unit}</text>}
            <text x={x + barWidth / 2} y={height - 4} textAnchor="middle" fontSize="9" fill="#6E746D">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

interface GroupedBarChartProps {
  data: { label: string; income: number; expenses: number }[];
  height?: number;
}

export function GroupedBarChart({ data, height = 140 }: GroupedBarChartProps) {
  const allValues = data.flatMap((d) => [d.income, d.expenses]);
  const max = Math.max(...allValues, 1) * 1.15;
  const width = 300;
  const padding = 8;
  const groupWidth = (width - padding * 2) / data.length;
  const barWidth = groupWidth * 0.32;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const incomeH = (d.income / max) * (height - padding * 2 - 16);
          const expenseH = (d.expenses / max) * (height - padding * 2 - 16);
          const groupX = padding + i * groupWidth;
          return (
            <g key={i}>
              <rect x={groupX + groupWidth * 0.15} y={height - padding - 16 - incomeH} width={barWidth} height={Math.max(0, incomeH)} rx="3" fill="#245C40" />
              <rect x={groupX + groupWidth * 0.53} y={height - padding - 16 - expenseH} width={barWidth} height={Math.max(0, expenseH)} rx="3" fill="#E9A23B" />
              <text x={groupX + groupWidth / 2} y={height - 4} textAnchor="middle" fontSize="9" fill="#6E746D">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 justify-center mt-1">
        <span className="flex items-center gap-1.5 text-xs text-charcoal-400"><span className="w-2.5 h-2.5 rounded-sm bg-forest-700" />Income</span>
        <span className="flex items-center gap-1.5 text-xs text-charcoal-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />Expenses</span>
      </div>
    </div>
  );
}

interface RingChartProps {
  value: number;
  max: number;
  size?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export function RingChart({ value, max, size = 80, color = '#245C40', label, sublabel }: RingChartProps) {
  const pct = Math.min(100, (value / max) * 100);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E8DC" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-charcoal-700">{label || `${Math.round(pct)}%`}</span>
        {sublabel && <span className="text-[10px] text-charcoal-400">{sublabel}</span>}
      </div>
    </div>
  );
}
