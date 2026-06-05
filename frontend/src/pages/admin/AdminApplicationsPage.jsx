import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import PassportOcrTable from '../../components/PassportOcrTable'
import TranscriptOcrTable from '../../components/TranscriptOcrTable'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import {
  Box, Typography, Card, CardContent, Button,
  Chip, CircularProgress, Alert, Table, TableBody, TableCell, TableHead,
  TableRow, Paper, Divider, TableContainer, IconButton, Collapse, Stack, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, TextField
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

function ApplicationRow({ app, onApprove, onReject, onOverride }) {
  const [open, setOpen] = useState(false)
  const isPending = app.status === 'Pending_TDHEP'

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ fontWeight: 600 }}>{app.studentName}</TableCell>
        <TableCell>{app.studentEmail}</TableCell>
        <TableCell>{app.programName}</TableCell>
        <TableCell>{app.destinationCountry}</TableCell>
        <TableCell>
          <StatusBadge status={app.status} />
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {isPending ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => onApprove(app.id)}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelOutlinedIcon />}
                onClick={() => onReject(app.id)}
              >
                Reject
              </Button>
            </Stack>
          ) : (
            <Button
              variant="outlined"
              color="warning"
              size="small"
              onClick={() => onOverride(app.id)}
            >
              Override
            </Button>
          )}
        </TableCell>
        <TableCell align="right">
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, background: '#f8fafc' }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2.5, bgcolor: '#fff', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" gutterBottom component="div" fontWeight={700} color="#0f172a" mb={2}>
                Extracted Student OCR Profile Details
              </Typography>
              
              {!app.studentPassportOcrData && !app.studentTranscriptOcrData && (
                <Typography variant="body2" color="text.secondary">No OCR data available</Typography>
              )}

              <Grid container spacing={3}>
                {app.studentPassportOcrData && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" fontWeight={700} color="#1e40af" mb={0.5}>PASSPORT OCR INFO</Typography>
                    <PassportOcrTable ocrData={app.studentPassportOcrData} />
                  </Grid>
                )}
                {app.studentTranscriptOcrData && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" fontWeight={700} color="#1e40af" mb={0.5}>TRANSCRIPT OCR INFO</Typography>
                    <TranscriptOcrTable ocrData={app.studentTranscriptOcrData} />
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

export default function AdminApplicationsPage() {
  const queryClient = useQueryClient()
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)
  const [overrideAppId, setOverrideAppId] = useState(null)
  const [overrideForm, setOverrideForm] = useState({ approved: true, remark: '' })

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['adminapps'],
    queryFn: () => api.get('/applications').then(r => r.data),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve, remark }) =>
      api.post(`/applications/${id}/review`, { approved: approve, remark }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminapps'])
      alert('Application reviewed successfully.')
    },
    onError: (err) => alert(err.response?.data || 'Failed to review application.'),
  })

  const overrideMutation = useMutation({
    mutationFn: ({ id, approved, remark }) =>
      api.post(`/applications/${id}/override`, { approved, remark }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminapps'])
      setIsOverrideOpen(false)
      setOverrideForm({ approved: true, remark: '' })
      setOverrideAppId(null)
      alert('Application overridden successfully.')
    },
    onError: (err) => alert(err.response?.data || 'Override failed.'),
  })

  const handleApprove = (id) => {
    if (window.confirm('Are you sure you want to approve this application?')) {
      reviewMutation.mutate({ id, approve: true, remark: 'Approved by TDHEP.' })
    }
  }

  const handleReject = (id) => {
    const remark = prompt('Reason for rejection:')
    if (remark) {
      reviewMutation.mutate({ id, approve: false, remark })
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader title="All applications" subtitle={`${applications.length} total`} />
      
      <TableContainer component={Paper} variant="outlined" sx={{ overflow: 'hidden' }}>
        <Table size="small">
          <TableHead sx={{ background: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.5 }}>Student Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.5 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.5 }}>Program Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.5 }}>Destination</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.5 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.5 }}>Actions</TableCell>
              <TableCell sx={{ width: 50, py: 1.5 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No applications submitted yet.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <ApplicationRow
                  key={app.id}
                  app={app}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onOverride={(id) => {
                    setOverrideAppId(id)
                    setIsOverrideOpen(true)
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isOverrideOpen} onClose={() => setIsOverrideOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Manual Application Override</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            select
            size="small"
            label="Target Override Status"
            sx={{ mb: 3.5, mt: 1 }}
            value={overrideForm.approved ? 'true' : 'false'}
            onChange={(e) => setOverrideForm({ ...overrideForm, approved: e.target.value === 'true' })}
          >
            <MenuItem value="true">Force Approve (Approved)</MenuItem>
            <MenuItem value="false">Force Reject (Rejected)</MenuItem>
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Override Reason / Remark"
            placeholder="Provide a mandatory remark explaining the override decision..."
            value={overrideForm.remark}
            onChange={(e) => setOverrideForm({ ...overrideForm, remark: e.target.value })}
            helperText="This action overrides the workflow state and writes to the approval logs."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setIsOverrideOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={!overrideForm.remark.trim() || overrideMutation.isPending}
            onClick={() => overrideMutation.mutate({
              id: overrideAppId,
              approved: overrideForm.approved,
              remark: overrideForm.remark
            })}
          >
            {overrideMutation.isPending ? 'Processing...' : 'Submit Override'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
