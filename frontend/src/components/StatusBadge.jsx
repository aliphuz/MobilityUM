const config = {
  Approved:                { bg: '#dcfce7', color: '#15803d', label: 'Approved' },
  Rejected:                { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
  Pending_TDHEP:           { bg: '#fef3c7', color: '#d97706', label: 'Pending TDHEP' },
  Pending_AcademicAdvisor: { bg: '#dbeafe', color: '#1d4ed8', label: 'Pending Advisor' },
  Draft:                   { bg: '#f1f5f9', color: '#475569', label: 'Draft' },
};

export default function StatusBadge({ status }) {
  const s = config[status] || config.Draft;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 12px', borderRadius: 99,
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'
    }}>{s.label}</span>
  );
}