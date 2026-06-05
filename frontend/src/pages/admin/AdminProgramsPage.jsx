import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import PassportOcrTable from '../../components/PassportOcrTable'
import TranscriptOcrTable from '../../components/TranscriptOcrTable'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import {
  Box, Typography, Card, CardContent, Button,
  Chip, TextField, MenuItem, CircularProgress,
  Alert, Table, TableBody, TableCell, TableHead,
  TableRow, Paper, Grid, TableContainer, IconButton, Collapse, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import EditIcon from '@mui/icons-material/Edit'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'

function StudentRow({ student }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{student.studentName}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{student.studentEmail}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{student.matricNumber || '-'}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{student.faculty || '-'}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{student.programme || '-'}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{student.phoneNumber || '-'}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{student.passportNumber || '-'}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{student.passportExpiry ? new Date(student.passportExpiry).toLocaleDateString() : '-'}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{student.visaExpiry ? new Date(student.visaExpiry).toLocaleDateString() : '-'}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{student.advisorName || '-'}</TableCell>
        <TableCell align="right">
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>

      <TableRow sx={{ bgcolor: '#f8fafc' }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2.5, bgcolor: '#fff', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" gutterBottom component="div" fontWeight={700} color="#0f172a" mb={2}>
                Accepted Student OCR Profile Details
              </Typography>
              
              {!student.passportOcrData && !student.transcriptOcrData && (
                <Typography variant="body2" color="text.secondary">No OCR data available</Typography>
              )}

              <Grid container spacing={3}>
                {student.passportOcrData && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" fontWeight={700} color="#1e40af" mb={0.5}>PASSPORT OCR INFO</Typography>
                    <PassportOcrTable ocrData={student.passportOcrData} />
                  </Grid>
                )}
                {student.transcriptOcrData && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" fontWeight={700} color="#1e40af" mb={0.5}>TRANSCRIPT OCR INFO</Typography>
                    <TranscriptOcrTable ocrData={student.transcriptOcrData} />
                  </Grid>
                )}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default function AdminProgramsPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [exporting, setExporting] = useState(false)
  const [form, setForm] = useState({
    name: '', destinationCountry: '', hostUniversity: '',
    durationType: 'ShortTerm', quota: 10, applicationDeadline: ''
  })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', destinationCountry: '', hostUniversity: '',
    durationType: 'ShortTerm', quota: 10, applicationDeadline: ''
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/programs/${selectedProgram}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['programs'])
      queryClient.invalidateQueries(['program-details', selectedProgram])
      setIsEditOpen(false)
      alert('Program updated successfully!')
    },
    onError: (e) => alert(e.response?.data || 'Failed to update program.'),
  })

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => api.get('/programs').then(r => r.data),
  })

  const { data: programDetails } = useQuery({
    queryKey: ['program-details', selectedProgram],
    queryFn: () => api.get(`/programs/${selectedProgram}/students`).then(r => r.data),
    enabled: !!selectedProgram,
  })

  const handleExport = async () => {
    if (!selectedProgram) return;
    try {
      setExporting(true)
      const response = await api.get(`/programs/${selectedProgram}/export`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const contentDisposition = response.headers['content-disposition'] || ''
      const fileNameMatch = contentDisposition.match(/filename="?(.*?)"?$/)
      link.setAttribute('download', fileNameMatch?.[1] || 'accepted-students.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Export failed. Try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleProgramImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedProgram) return

    try {
      setUploadingImage(true)
      setUploadMessage('')

      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post(`/programs/${selectedProgram}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setUploadMessage(data.message || 'Image uploaded successfully.')
      queryClient.invalidateQueries(['program-details', selectedProgram])
      queryClient.invalidateQueries(['programs'])
    } catch (error) {
      alert('Image upload failed.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/programs', data),
    onSuccess: () => { queryClient.invalidateQueries(['programs']); alert('Program created successfully!') },
    onError: (e) => alert(e.response?.data || 'Failed to create program.'),
  })

  if (selectedProgram && programDetails) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <PageHeader
          title={programDetails.program?.name}
          subtitle={`${programDetails.program?.hostUniversity} - ${programDetails.program?.destinationCountry}`}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleProgramImage}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => setSelectedProgram(null)}>
            Back to programs
          </Button>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exporting}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                if (programDetails?.program) {
                  setEditForm({
                    name: programDetails.program.name || '',
                    destinationCountry: programDetails.program.destinationCountry || '',
                    hostUniversity: programDetails.program.hostUniversity || '',
                    durationType: programDetails.program.durationType || 'ShortTerm',
                    quota: programDetails.program.quota || 0,
                    applicationDeadline: programDetails.program.applicationDeadline 
                      ? programDetails.program.applicationDeadline.split('T')[0]
                      : ''
                  });
                  setIsEditOpen(true);
                }
              }}
            >
              Edit details
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              Upload image
            </Button>
          </Box>
        </Box>
        
        {uploadMessage && (
          <Alert severity="success">{uploadMessage}</Alert>
        )}
        
        {programDetails.program?.imageUrl && (
          <Card variant="outlined" sx={{ overflow: 'hidden' }}>
            <Box component="img"
              src={programDetails.program.imageUrl}
              alt="Program banner"
              sx={{ width: '100%', height: 260, objectFit: 'cover' }}
            />
          </Card>
        )}

        {/* Program stats using Grid2 -> Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total quota"
              value={programDetails.program?.quota}
              accentColor="#4c1d95"
              icon={FormatListNumberedIcon}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Accepted students"
              value={programDetails.totalAccepted}
              accentColor="#16a34a"
              icon={PeopleAltIcon}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Slots remaining"
              value={Math.max(0, programDetails.program?.quota - programDetails.totalAccepted)}
              accentColor="#d97706"
              icon={EventAvailableIcon}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Duration type"
              value={programDetails.program?.durationType === 'LongTerm' ? 'Long term' : 'Short term'}
              accentColor="#0891b2"
              icon={CalendarMonthIcon}
            />
          </Grid>
        </Grid>

        {/* Accepted students table */}
        <Card variant="outlined">
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Typography fontWeight={700} fontSize={16} mb={2} color="#0f172a">
              Accepted Students ({programDetails.totalAccepted})
            </Typography>
            {programDetails.students?.length === 0 ? (
              <Alert severity="info">No students accepted yet.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ background: '#f8fafc' }}>
                    <TableRow>
                      {['Name', 'Email', 'Matric No.', 'Faculty', 'Programme', 'Phone', 'Passport No.', 'Passport Expiry', 'Visa Expiry', 'Advisor'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 600, color: '#334155', fontSize: 12, py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                      ))}
                      <TableCell sx={{ width: 50 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {programDetails.students.map(s => (
                      <StudentRow key={s.applicationId} student={s} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Edit Program Details</DialogTitle>
          <DialogContent dividers sx={{ py: 2 }}>
            <TextField fullWidth size="small" label="Program name" sx={{ mb: 2, mt: 1 }}
              value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            <TextField fullWidth size="small" label="Destination country" sx={{ mb: 2 }}
              value={editForm.destinationCountry} onChange={e => setEditForm({ ...editForm, destinationCountry: e.target.value })} />
            <TextField fullWidth size="small" label="Host university" sx={{ mb: 2 }}
              value={editForm.hostUniversity} onChange={e => setEditForm({ ...editForm, hostUniversity: e.target.value })} />
            <TextField fullWidth size="small" label="Quota" type="number" sx={{ mb: 2 }}
              value={editForm.quota} onChange={e => setEditForm({ ...editForm, quota: parseInt(e.target.value) || 0 })} />
            <TextField fullWidth size="small" label="Application deadline" type="date" sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              value={editForm.applicationDeadline} onChange={e => setEditForm({ ...editForm, applicationDeadline: e.target.value })} />
            <TextField fullWidth size="small" label="Duration type" select sx={{ mb: 1 }}
              value={editForm.durationType} onChange={e => setEditForm({ ...editForm, durationType: e.target.value })}>
              <MenuItem value="ShortTerm">Short term</MenuItem>
              <MenuItem value="LongTerm">Long term</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsEditOpen(false)} color="inherit">Cancel</Button>
            <Button variant="contained" color="primary" onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader title="Manage programs" subtitle="Create and manage mobility programme listings" />
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Typography fontWeight={700} fontSize={16} mb={2.5} color="#0f172a">Create new program</Typography>
              <TextField fullWidth size="small" label="Program name" sx={{ mb: 2 }}
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <TextField fullWidth size="small" label="Destination country" sx={{ mb: 2 }}
                value={form.destinationCountry} onChange={e => setForm({ ...form, destinationCountry: e.target.value })} />
              <TextField fullWidth size="small" label="Host university" sx={{ mb: 2 }}
                value={form.hostUniversity} onChange={e => setForm({ ...form, hostUniversity: e.target.value })} />
              <TextField fullWidth size="small" label="Quota" type="number" sx={{ mb: 2 }}
                value={form.quota} onChange={e => setForm({ ...form, quota: e.target.value })} />
              <TextField fullWidth size="small" label="Application deadline" type="date" sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
                value={form.applicationDeadline} onChange={e => setForm({ ...form, applicationDeadline: e.target.value })} />
              <TextField fullWidth size="small" label="Duration type" select sx={{ mb: 3 }}
                value={form.durationType} onChange={e => setForm({ ...form, durationType: e.target.value })}>
                <MenuItem value="ShortTerm">Short term</MenuItem>
                <MenuItem value="LongTerm">Long term</MenuItem>
              </TextField>
              <Button fullWidth variant="contained" color="primary"
                startIcon={<AddIcon />}
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending}>
                Create program
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography fontWeight={700} fontSize={16} mb={2} color="#0f172a">Active Programs ({programs.length})</Typography>
          <Stack spacing={2}>
            {programs.map(p => (
              <Card key={p.id} variant="outlined" sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: '#f8fafc' } }}
                onClick={() => setSelectedProgram(p.id)}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box>
                    <Typography fontWeight={600} fontSize={15} color="#0f172a">{p.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {p.hostUniversity} - {p.destinationCountry}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                      Quota: {p.quota} • Deadline: {new Date(p.applicationDeadline).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      label={p.durationType === 'LongTerm' ? 'Long term' : 'Short term'}
                      size="small"
                      sx={{
                        bgcolor: p.durationType === 'LongTerm' ? '#ede9fe' : '#dcfce7',
                        color: p.durationType === 'LongTerm' ? '#6d28d9' : '#15803d',
                        fontWeight: 600,
                      }}
                    />
                    <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setSelectedProgram(p.id) }}>
                      Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
