// Small dependency-free icon set (inline SVG, stroke-based, 1.5px weight)
// so the UI doesn't need an extra npm package just for a handful of glyphs.

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconThermometer(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 14.76V3.5a2 2 0 0 0-4 0v11.26a4 4 0 1 0 4 0Z" />
    </svg>
  );
}

export function IconDroplet(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.5s6.5 7.2 6.5 11.5a6.5 6.5 0 1 1-13 0C5.5 9.7 12 2.5 12 2.5Z" />
    </svg>
  );
}

export function IconWaveform(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12h3l2-7 3 14 3-11 2 4h7" />
    </svg>
  );
}

export function IconShield(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.5 4.5 5.5v6c0 5 3.2 8.3 7.5 10 4.3-1.7 7.5-5 7.5-10v-6L12 2.5Z" />
    </svg>
  );
}

export function IconGrid(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconWifi(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2 8.5a15 15 0 0 1 20 0" />
      <path d="M5.5 12a10 10 0 0 1 13 0" />
      <path d="M9 15.5a5 5 0 0 1 6 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTrendUp(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 17 9.5 10l4 4L21 6" />
      <path d="M15 6h6v6" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconAlertTriangle(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconActivity(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12h4l2.5 7L13 3l3 9h6" />
    </svg>
  );
}

export function IconTrendDown(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7 9.5 14l4-4L21 18" />
      <path d="M15 18h6v-6" />
    </svg>
  );
}

export function IconBarChart(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10" />
      <path d="M11 20V4" />
      <path d="M18 20v-7" />
    </svg>
  );
}
