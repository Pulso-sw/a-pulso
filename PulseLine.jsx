export default function PulseLine({ animate = true, height = 60 }) {
  const path =
    "M0,30 L40,30 L52,10 L64,50 L76,30 L120,30 L132,4 L144,54 L156,30 " +
    "L200,30 L212,-4 L224,58 L236,30 L280,30";

  return (
    <svg viewBox="0 0 280 60" width="100%" height={height} preserveAspectRatio="none">
      <path
        d={path}
        fill="none"
        stroke="var(--pulso)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          animate
            ? { strokeDasharray: 400, strokeDashoffset: 400, animation: "draw 2.2s ease-out forwards" }
            : undefined
        }
      />
      <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}
