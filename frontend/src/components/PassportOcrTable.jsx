import { Table, TableBody, TableCell, TableContainer, TableRow, Paper } from '@mui/material'

export default function PassportOcrTable({ ocrData }) {
  if (!ocrData) return null

  const rows = [
    { label: 'First Name', value: ocrData.firstName },
    { label: 'Last Name', value: ocrData.lastName },
    { label: 'Document No.', value: ocrData.documentNumber },
    { label: 'Date of Birth', value: ocrData.dateOfBirth ? new Date(ocrData.dateOfBirth).toLocaleDateString() : '' },
    { label: 'Expiry Date', value: ocrData.expiryDate ? new Date(ocrData.expiryDate).toLocaleDateString() : '' },
    { label: 'Country', value: ocrData.nationality },
    { label: 'Sex', value: ocrData.sex }
  ]

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1.5, background: '#f8fafc' }}>
      <Table size="small">
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 500, borderBottom: '1px solid #e2e8f0', py: 1 }}>
                {row.label}
              </TableCell>
              <TableCell sx={{ color: '#0f172a', fontWeight: 700, borderBottom: '1px solid #e2e8f0', py: 1 }}>
                {row.value || 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
