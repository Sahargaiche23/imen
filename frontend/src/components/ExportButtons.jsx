import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const CAT_LABELS = {
  voirie: 'Voirie', eclairage_public: 'Éclairage public', assainissement: 'Assainissement',
  nuisance_sonore: 'Nuisance sonore', urbanisme: 'Urbanisme', administratif: 'Administratif', autre: 'Autre',
};
const STATUT_LABELS = {
  soumise: 'Soumise', en_cours: 'En cours', traitee: 'Traitée',
  validee: 'Validée', rejetee: 'Rejetée', retour_agent: 'Retour agent',
};

function formatPlaintes(plaintes) {
  return plaintes.map(p => ({
    ID: p.id,
    Titre: p.titre,
    Catégorie: CAT_LABELS[p.categorie] || p.categorie,
    Urgence: p.urgence?.charAt(0).toUpperCase() + p.urgence?.slice(1),
    Statut: STATUT_LABELS[p.statut] || p.statut,
    Citoyen: p.citoyen ? `${p.citoyen.prenom} ${p.citoyen.nom}` : '-',
    Agent: p.agent ? `${p.agent.prenom} ${p.agent.nom}` : '-',
    Localisation: p.localisation || '-',
    Date: new Date(p.created_at).toLocaleDateString('fr-FR'),
    Satisfaction: p.satisfaction || '-',
  }));
}

export function ExportPDF({ plaintes, title = 'Rapport des plaintes' }) {
  const [exporting, setExporting] = useState(false);

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF('landscape');

      // Header
      doc.setFontSize(18);
      doc.setTextColor(30, 58, 95);
      doc.text('Plainte360', 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(title, 14, 28);
      doc.setFontSize(9);
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 34);
      doc.text(`Total: ${plaintes.length} plaintes`, 14, 39);

      // Table
      const data = formatPlaintes(plaintes);
      const headers = Object.keys(data[0] || {});
      const rows = data.map(row => headers.map(h => row[h]));

      autoTable(doc, {
        startY: 44,
        head: [headers],
        body: rows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 44 },
      });

      doc.save(`plaintes_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={exportPDF}
      disabled={exporting || plaintes.length === 0}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
    >
      <FileText size={16} />
      {exporting ? 'Export...' : 'Export PDF'}
    </button>
  );
}

export function ExportExcel({ plaintes, title = 'Plaintes' }) {
  const [exporting, setExporting] = useState(false);

  const exportXLSX = () => {
    setExporting(true);
    try {
      const data = formatPlaintes(plaintes);
      const ws = XLSX.utils.json_to_sheet(data);

      // Column widths
      ws['!cols'] = [
        { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 12 },
        { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 12 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title);
      XLSX.writeFile(wb, `plaintes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={exportXLSX}
      disabled={exporting || plaintes.length === 0}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
    >
      <Table size={16} />
      {exporting ? 'Export...' : 'Export Excel'}
    </button>
  );
}

export function ExportToolbar({ plaintes }) {
  return (
    <div className="flex items-center gap-2">
      <ExportPDF plaintes={plaintes} />
      <ExportExcel plaintes={plaintes} />
    </div>
  );
}
