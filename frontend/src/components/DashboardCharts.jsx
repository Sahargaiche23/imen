import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#1e3a5f', '#e97c2e', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f59e0b'];

const STATUS_COLORS = {
  soumise: '#eab308',
  en_cours: '#3b82f6',
  traitee: '#8b5cf6',
  validee: '#10b981',
  rejetee: '#ef4444',
  retour_agent: '#f97316',
};

const STATUS_LABELS = {
  soumise: 'Soumise',
  en_cours: 'En cours',
  traitee: 'Traitée',
  validee: 'Validée',
  rejetee: 'Rejetée',
  retour_agent: 'Retour agent',
};

const CAT_LABELS = {
  voirie: 'Voirie',
  eclairage_public: 'Éclairage',
  assainissement: 'Assainissement',
  nuisance_sonore: 'Nuisance',
  urbanisme: 'Urbanisme',
  administratif: 'Administratif',
  autre: 'Autre',
};

export function MonthlyChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4">Plaintes par mois</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            formatter={(value) => [value, 'Plaintes']}
          />
          <Area type="monotone" dataKey="count" stroke="#1e3a5f" strokeWidth={2.5} fill="url(#colorCount)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart({ data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const chartData = Object.entries(data).map(([cat, count]) => ({
    name: CAT_LABELS[cat] || cat,
    value: count,
  }));
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4">Répartition par catégorie</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const chartData = Object.entries(data).map(([statut, count]) => ({
    name: STATUS_LABELS[statut] || statut,
    count,
    fill: STATUS_COLORS[statut] || '#94a3b8',
  }));
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4">Distribution par statut</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            formatter={(value) => [value, 'Plaintes']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SatisfactionChart({ data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const satisfait = data.satisfait || 0;
  const nonSatisfait = data.non_satisfait || 0;
  const total = satisfait + nonSatisfait;
  if (total === 0) return null;
  const taux = Math.round((satisfait / total) * 100);

  const chartData = [
    { name: 'Satisfait', value: satisfait },
    { name: 'Non satisfait', value: nonSatisfait },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4">Satisfaction citoyens</h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width="50%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              <Cell fill="#10b981" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">{taux}%</p>
            <p className="text-xs text-slate-500">Taux de satisfaction</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-slate-600">Satisfait : {satisfait}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-600">Non satisfait : {nonSatisfait}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
