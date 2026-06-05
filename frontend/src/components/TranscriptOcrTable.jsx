import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material'

export default function TranscriptOcrTable({ ocrData }) {
  if (!ocrData) return null

  return (
    <Box sx={{ mt: 1.5 }}>
      {ocrData.studentName && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          <strong>Student Name:</strong> {ocrData.studentName}
        </Typography>
      )}
      {ocrData.matricNumber && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          <strong>Matric Number:</strong> {ocrData.matricNumber}
        </Typography>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ background: '#f8fafc' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#ede9fe' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#4c1d95' }}>Year</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#4c1d95' }}>Semester</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#4c1d95' }}>GPA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ocrData.semesters && ocrData.semesters.length > 0 ? (
              ocrData.semesters.map((sem, index) => (
                <TableRow key={index} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                  <TableCell sx={{ py: 1 }}>{sem.year}</TableCell>
                  <TableCell sx={{ py: 1 }}>{sem.semester}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 1 }}>{sem.gpa != null ? sem.gpa.toFixed(2) : 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                  No semesters found.
                </TableCell>
              </TableRow>
            )}
            {ocrData.cgpa != null && (
              <TableRow sx={{ bgcolor: '#e0e7ff' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                  CGPA
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#1e40af', fontSize: 14 }}>
                  {ocrData.cgpa.toFixed(2)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
