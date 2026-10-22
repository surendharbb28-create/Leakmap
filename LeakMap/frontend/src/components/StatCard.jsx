export default function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="bg-panel border border-line rounded-xl p-4 hover:border-[#3A454C] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] text-textDim uppercase tracking-wide">{label}</div>
        {Icon && (
          <div className="text-textDim opacity-70">
            <Icon width={14} height={14} />
          </div>
        )}
      </div>
      <div className="font-mono text-2xl font-bold leading-none" style={color ? { color } : undefined}>
        {value}
      </div>
      {sub && <div className="text-[10.5px] text-textDim mt-1.5">{sub}</div>}
    </div>
  );
}
