const statusConfig = {
  soumise: { label: 'Soumise', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  en_cours: { label: 'En cours', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  traitee: { label: 'Traitée', bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  validee: { label: 'Validée', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  rejetee: { label: 'Rejetée', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  retour_agent: { label: 'Retour agent', bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
};

const urgenceConfig = {
  basse: { label: 'Basse', bg: 'bg-green-100', text: 'text-green-700' },
  moyenne: { label: 'Moyenne', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  haute: { label: 'Haute', bg: 'bg-red-100', text: 'text-red-700' },
};

const categorieLabels = {
  voirie: 'Voirie',
  eclairage_public: 'Éclairage public',
  assainissement: 'Assainissement',
  nuisance_sonore: 'Nuisance sonore',
  urbanisme: 'Urbanisme',
  administratif: 'Administratif',
  autre: 'Autre',
};

export function StatusBadge({ statut }) {
  const config = statusConfig[statut] || statusConfig.soumise;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}

export function UrgenceBadge({ urgence }) {
  const config = urgenceConfig[urgence] || urgenceConfig.moyenne;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export function CategorieLabel({ categorie }) {
  return categorieLabels[categorie] || categorie;
}
