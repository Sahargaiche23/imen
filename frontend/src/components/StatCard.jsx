export default function StatCard({ icon: Icon, label, value, color = 'blue', iconColor }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  };
  const iconColorMap = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`p-3 rounded-lg bg-white shadow-sm ${iconColorMap[color]}`}>
            <Icon size={24} />
          </div>
        )}
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
