import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import {
  Box, Typography, Card, CardContent, CardActions,
  Button, Chip, Grid, Alert, Paper, TextField, MenuItem,
  CircularProgress, CardMedia, Stepper, Step, StepLabel, Stack
} from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PeopleIcon from '@mui/icons-material/People'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import StudentProfile from './StudentProfile'
import PageHeader from '../../components/PageHeader'

export default function StudentDashboard() {
  return (
    <Layout>
      <Box>
        <Routes>
          <Route index element={<ProgramsPage />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="profile" element={<StudentProfile />} />
        </Routes>
      </Box>
    </Layout>
  )
}

function StatusChip({ status }) {
  const config = {
    Approved: { label: 'Approved', color: 'success' },
    Rejected: { label: 'Rejected', color: 'error' },
    Pending_TDHEP: { label: 'Pending TDHEP', color: 'warning' },
    Pending_AcademicAdvisor: { label: 'Pending Advisor', color: 'info' },
    Draft: { label: 'Draft', color: 'default' },
  }
  const s = config[status] || config.Draft
  return <Chip label={s.label} color={s.color} size="small" sx={{ fontWeight: 600 }} />
}

function ProgramsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [durationTypeFilter, setDurationTypeFilter] = useState('All')
  const [destinationFilter, setDestinationFilter] = useState('All')

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => api.get('/programs').then(r => r.data),
  })

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then(r => r.data),
  })

  const applyMutation = useMutation({
    mutationFn: (programId) => api.post('/applications', { programId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myapplications'])
      alert('Application submitted successfully!')
    },
    onError: (e) => alert(e.response?.data?.message || e.response?.data || 'Already applied or error occurred.'),
  })

  const destinations = ['All', ...new Set(programs.map(p => p.destinationCountry))]

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.hostUniversity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = durationTypeFilter === 'All' || p.durationType === durationTypeFilter
    const matchesDest = destinationFilter === 'All' || p.destinationCountry === destinationFilter
    return matchesSearch && matchesType && matchesDest
  })

  const hasPassport = profile?.passportUploaded;
  const hasVisa = profile?.visaUploaded;
  const hasMissingOrExpiredDocs = (!hasPassport && !hasVisa) ||
    (hasPassport && profile?.passportExpiry && new Date(profile.passportExpiry) < new Date()) ||
    (hasVisa && profile?.visaExpiry && new Date(profile.visaExpiry) < new Date());

  return (
    <>
      <PageHeader title="Available Programs" subtitle="Browse and apply to international mobility programmes" />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
        {hasMissingOrExpiredDocs && (
          <Alert severity="error" sx={{ fontWeight: 500, borderRadius: 2 }}>
            You have missing or expired documents. At least one valid document (Passport or Visa) is required to apply. Documents must be valid for at least 6 months beyond the program deadline. Please update them in your Profile tab before applying.
          </Alert>
        )}

        {/* Search & Filter Row */}
        <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                label="Search programs"
                placeholder="Search by name, university, or country..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                sx={{ bgcolor: '#fff' }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Duration Type"
                value={durationTypeFilter}
                onChange={e => setDurationTypeFilter(e.target.value)}
                sx={{ bgcolor: '#fff' }}
              >
                <MenuItem value="All">All Durations</MenuItem>
                <MenuItem value="ShortTerm">Short Term</MenuItem>
                <MenuItem value="LongTerm">Long Term</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Destination Country"
                value={destinationFilter}
                onChange={e => setDestinationFilter(e.target.value)}
                sx={{ bgcolor: '#fff' }}
              >
                {destinations.map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!isLoading && filteredPrograms.length === 0 && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>No programs match your filters.</Alert>
        )}

        <Grid container spacing={3}>
          {filteredPrograms.map(p => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <Chip
                  label={p.durationType === 'LongTerm' ? 'Long Term' : 'Short Term'}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 1,
                    bgcolor: p.durationType === 'LongTerm' ? '#4c1d95' : '#16a34a',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 10.5,
                    boxShadow: 2
                  }}
                />
                <CardMedia
                  component="img"
                  height="300"
                  image={p.imageUrl || 'https://via.placeholder.com/640x300?text=Program+image+not+available'}
                  alt={p.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ fontSize: 16, lineHeight: 1.3, color: '#0f172a' }}>
                      {p.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
                      {p.hostUniversity}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: '#64748b' }}>
                    <LocationOnIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2" fontWeight={500}>
                      {p.destinationCountry}
                    </Typography>
                  </Stack>

                  <Box sx={{ mt: 'auto', pt: 1 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      <Chip
                        icon={<PeopleIcon sx={{ fontSize: 14 }} />}
                        label={`Quota: ${p.quota}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11, fontWeight: 600 }}
                      />
                      <Chip
                        icon={<CalendarMonthIcon sx={{ fontSize: 14 }} />}
                        label={`Deadline: ${new Date(p.applicationDeadline).toLocaleDateString()}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11, fontWeight: 600 }}
                      />
                    </Stack>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => applyMutation.mutate(p.id)}
                    disabled={applyMutation.isPending}
                    sx={{ py: 1, fontWeight: 700 }}
                  >
                    Apply Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  )
}

function ApplicationsPage() {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['myapplications'],
    queryFn: () => api.get('/applications').then(r => r.data),
  })

  const getStepperConfig = (app) => {
    const isLongTerm = app.durationType === 'LongTerm';
    if (isLongTerm) {
      const steps = ['Submitted', 'Advisor Review', 'TDHEP Review', app.status === 'Rejected' ? 'Rejected' : 'Approved'];
      let activeStep = 0;
      if (app.status === 'Pending_AcademicAdvisor') activeStep = 1;
      else if (app.status === 'Pending_TDHEP') activeStep = 2;
      else if (app.status === 'Approved') activeStep = 4;
      else if (app.status === 'Rejected') activeStep = 3;
      return { steps, activeStep };
    } else {
      const steps = ['Submitted', 'TDHEP Review', app.status === 'Rejected' ? 'Rejected' : 'Approved'];
      let activeStep = 0;
      if (app.status === 'Pending_TDHEP') activeStep = 1;
      else if (app.status === 'Approved') activeStep = 3;
      else if (app.status === 'Rejected') activeStep = 2;
      return { steps, activeStep };
    }
  }

  return (
    <>
      <PageHeader
        title="My Applications"
        subtitle={`${applications.length} application${applications.length !== 1 ? 's' : ''} submitted`}
      />
      <Box sx={{ maxWidth: 760 }}>
        {isLoading && <CircularProgress />}
        {!isLoading && applications.length === 0 && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>No applications yet. Browse programs to get started.</Alert>
        )}

        {applications.map(app => {
          const { steps, activeStep } = getStepperConfig(app);
          const isRejected = app.status === 'Rejected';
          return (
            <Card key={app.id} sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                  <Box>
                    <Typography fontWeight={700} fontSize={16} color="#0f172a">{app.programName}</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.3} mb={0.5}>
                      {app.destinationCountry} • {app.durationType === 'LongTerm' ? 'Long term' : 'Short term'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Submitted {new Date(app.submittedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <StatusChip status={app.status} />
                </Box>

                <Box sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label, idx) => {
                      const isOutcomeStep = idx === steps.length - 1;
                      return (
                        <Step key={label}>
                          <StepLabel 
                            error={isOutcomeStep && isRejected}
                          >
                            {label}
                          </StepLabel>
                        </Step>
                      );
                    })}
                  </Stepper>
                </Box>

                <Typography variant="body2" fontWeight={700} mb={1.5} color="#0f172a">Approval History Logs</Typography>
                {app.approvalLogs?.length > 0 ? (
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {app.approvalLogs.map((log, i) => (
                      <Box
                        key={i}
                        sx={{
                          borderLeft: '3px solid',
                          borderColor: log.toStatus === 'Rejected' ? '#dc2626' : '#2563eb',
                          pl: 2, py: 1.2, background: '#f8fafc', borderRadius: 1.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {log.actorName} updated status to {log.toStatus.replace(/_/g, ' ')}
                        </Typography>
                        {log.remark && <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>"{log.remark}"</Typography>}
                        <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>No approval history available yet.</Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </>
  )
}
