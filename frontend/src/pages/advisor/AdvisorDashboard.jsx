import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import PassportOcrTable from '../../components/PassportOcrTable'
import TranscriptOcrTable from '../../components/TranscriptOcrTable'
import {
  Box, Typography, Card, CardContent, Button,
  Avatar, Chip, CircularProgress, Alert, Divider,
  Tab, Tabs, Grid, TextField, Paper, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions, Stack,
  Link, Collapse, Stepper, Step, StepLabel
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import SchoolIcon from '@mui/icons-material/School'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import PersonAddIcon from '@mui/icons-material/PersonAdd'

import PageHeader from '../../components/PageHeader'

function CustomStatCard({ icon: Icon, value, label, accentColor }) {
  return (
    <Card sx={{ bgcolor: '#ffffff', borderLeft: `4px solid ${accentColor}`, borderRadius: 2 }} variant="outlined">
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          {Icon && (
            <Box sx={{ color: accentColor, display: 'flex', alignItems: 'center' }}>
              <Icon sx={{ fontSize: 40 }} />
            </Box>
          )}
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ fontSize: '32px', lineHeight: 1.1, color: '#0f172a' }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

function StudentApplicationHistory({ studentId }) {
  const { data: studentApps = [], isLoading } = useQuery({
    queryKey: ['studentApplicationHistory', studentId],
    queryFn: () => api.get('/applications').then(r => r.data.filter(a => a.studentId === studentId))
  });

  if (isLoading) return <CircularProgress size={20} />;

  if (studentApps.length === 0) {
    return <Typography color="text.secondary" variant="body2">No applications submitted yet.</Typography>;
  }

  const getActiveStep = (status) => {
    switch (status) {
      case 'Draft': return 0;
      case 'Pending_AcademicAdvisor': return 1;
      case 'Pending_TDHEP': return 2;
      case 'Approved':
      case 'Rejected':
        return 4;
      default: return 1;
    }
  };

  const steps = ['Submitted', 'Advisor Review', 'TDHEP Review', 'Outcome'];

  return (
    <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
      {studentApps.map((app) => {
        const activeStep = getActiveStep(app.status);
        const isRejected = app.status === 'Rejected';
        return (
          <Paper key={app.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                {app.programName} ({app.destinationCountry})
              </Typography>
              <Chip
                label={app.status.replace(/_/g, ' ')}
                size="small"
                color={app.status === 'Approved' ? 'success' : app.status === 'Rejected' ? 'error' : 'warning'}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            
            <Box sx={{ width: '100%', mb: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label, index) => {
                  const labelProps = {};
                  if (index === 3 && isRejected) {
                    labelProps.error = true;
                  }
                  return (
                    <Step key={label}>
                      <StepLabel {...labelProps}>{index === 3 && isRejected ? 'Rejected' : label}</StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            </Box>

            <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="text.secondary">Approval History Logs</Typography>
            {app.approvalLogs && app.approvalLogs.length > 0 ? (
              <Box sx={{ display: 'grid', gap: 1 }}>
                {app.approvalLogs.map((log) => {
                  const initials = log.actorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <Paper
                      key={log.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderLeft: '3px solid',
                        borderColor: log.toStatus === 'Approved' ? 'success.main'
                                   : log.toStatus === 'Rejected' ? 'error.main' : 'primary.main',
                        bgcolor: '#f8fafc'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'primary.light', color: '#fff' }}>{initials}</Avatar>
                          <Typography variant="subtitle2" sx={{ fontSize: 12, fontWeight: 700 }}>{log.actorName}</Typography>
                          <Chip label={log.actorRole} size="small" variant="outlined" sx={{ height: 18, fontSize: 9, fontWeight: 600 }} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }} mb={0.5}>
                        {log.fromStatus} → {log.toStatus}
                      </Typography>
                      {log.remark && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: 11.5 }}>
                          "{log.remark}"
                        </Typography>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">No approval logs found.</Typography>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}

function StudentCard({ student, onAccept, acceptMutation }) {
  const [open, setOpen] = useState(false)
  const initials = student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const isPending = student.advisorStatus === 'Pending'

  const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000
  const isPassportValid = student.passportExpiry && (new Date(student.passportExpiry) - new Date() > sixMonths)
  const isVisaValid = student.visaExpiry && (new Date(student.visaExpiry) - new Date() > sixMonths)

  return (
    <Card sx={{ bgcolor: '#ffffff', mb: 2, borderRadius: 2 }} variant="outlined">
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2.5} alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Avatar src={student.profilePhotoUrl || undefined} sx={{ width: 56, height: 56, bgcolor: '#f1f5f9', color: '#0f172a', fontWeight: 700, fontSize: 16 }}>
              {initials}
            </Avatar>
            <Box>
              <Typography fontWeight={700} fontSize={16} color="#0f172a">
                {student.studentName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                {student.studentEmail}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Matric: {student.matricNumber || 'N/A'} • Faculty: {student.faculty || 'N/A'} • Prog: {student.programme || 'N/A'}
              </Typography>
              
              {/* Document status chips */}
              <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={student.passportUploaded ? "Passport ✓" : "Passport"}
                  color={student.passportUploaded ? "success" : "default"}
                  variant={student.passportUploaded ? "filled" : "outlined"}
                  size="small"
                  sx={{ fontWeight: 600, fontSize: 11 }}
                />
                <Chip
                  label={student.visaUploaded ? "Visa ✓" : "Visa"}
                  color={student.visaUploaded ? "success" : "default"}
                  variant={student.visaUploaded ? "filled" : "outlined"}
                  size="small"
                  sx={{ fontWeight: 600, fontSize: 11 }}
                />
                <Chip
                  label={student.transcriptUploaded ? "Transcript ✓" : "Transcript"}
                  color={student.transcriptUploaded ? "success" : "default"}
                  variant={student.transcriptUploaded ? "filled" : "outlined"}
                  size="small"
                  sx={{ fontWeight: 600, fontSize: 11 }}
                />
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            {isPending ? (
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => onAccept(student.studentId)}
                disabled={acceptMutation.isPending}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Accept Supervision
              </Button>
            ) : (
              <Chip
                label="Accepted"
                color="success"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
            <Button
              size="small"
              variant="text"
              onClick={() => setOpen(!open)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#065f46',
                '&:hover': { background: 'rgba(6, 95, 70, 0.04)' }
              }}
            >
              {open ? 'Hide details' : 'View details'}
            </Button>
          </Stack>
        </Stack>

        <Collapse in={open} sx={{ mt: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#0f172a" mb={2}>Supervised Student Profile Details</Typography>
              <Stack spacing={2}>
                <TextField fullWidth size="small" label="Phone Number" value={student.phoneNumber || 'Not provided'} variant="filled" disabled />
                <TextField fullWidth size="small" label="Faculty" value={student.faculty || 'Not provided'} variant="filled" disabled />
                <TextField fullWidth size="small" label="Programme" value={student.programme || 'Not provided'} variant="filled" disabled />
                <TextField fullWidth size="small" label="Current Year" value={student.currentYear || 'Not provided'} variant="filled" disabled />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#0f172a" mb={2}>Document & OCR Details</Typography>
              <Stack spacing={2.5}>
                {student.passportUploaded ? (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">PASSPORT</Typography>
                      <Link href={student.passportBlobUrl} target="_blank" rel="noreferrer" underline="hover" sx={{ fontSize: 13, fontWeight: 600 }}>
                        View Passport
                      </Link>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                      <Chip
                        label={isPassportValid ? "Valid (> 6 months)" : "Expires soon (≤ 6 months)"}
                        color={isPassportValid ? "success" : "error"}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      {student.passportExpiry && (
                        <Typography variant="caption" color="text.secondary">
                          Expiry: {new Date(student.passportExpiry).toLocaleDateString()}
                        </Typography>
                      )}
                    </Stack>
                    {student.passportOcrConfirmed && student.passportOcrData ? (
                      <PassportOcrTable ocrData={student.passportOcrData} />
                    ) : (
                      <Typography variant="caption" color="text.secondary" display="block">No OCR data confirmed yet</Typography>
                    )}
                  </Paper>
                ) : (
                  <Alert severity="warning" sx={{ py: 0.5, borderRadius: 2 }}>Passport not uploaded</Alert>
                )}

                {student.visaUploaded ? (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">VISA</Typography>
                      <Link href={student.visaBlobUrl} target="_blank" rel="noreferrer" underline="hover" sx={{ fontSize: 13, fontWeight: 600 }}>
                        View Visa
                      </Link>
                    </Stack>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Type:</strong> {student.visaType || 'N/A'}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={isVisaValid ? "Valid (> 6 months)" : "Expires soon (≤ 6 months)"}
                        color={isVisaValid ? "success" : "error"}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      {student.visaExpiry && (
                        <Typography variant="caption" color="text.secondary">
                          Expiry: {new Date(student.visaExpiry).toLocaleDateString()}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                ) : (
                  <Alert severity="warning" sx={{ py: 0.5, borderRadius: 2 }}>Visa not uploaded</Alert>
                )}

                {student.transcriptUploaded ? (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">ACADEMIC TRANSCRIPT</Typography>
                      <Link href={student.transcriptBlobUrl} target="_blank" rel="noreferrer" underline="hover" sx={{ fontSize: 13, fontWeight: 600 }}>
                        View Transcript
                      </Link>
                    </Stack>
                    {student.transcriptOcrConfirmed && student.transcriptOcrData ? (
                      <TranscriptOcrTable ocrData={student.transcriptOcrData} />
                    ) : (
                      <Typography variant="caption" color="text.secondary" display="block">No OCR data confirmed yet</Typography>
                    )}
                  </Paper>
                ) : (
                  <Alert severity="warning" sx={{ py: 0.5, borderRadius: 2 }}>Transcript not uploaded</Alert>
                )}
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="#0f172a">Application History</Typography>
          <StudentApplicationHistory studentId={student.studentId} />
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default function AdvisorDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [studentEmail, setStudentEmail] = useState('')
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectRemark, setRejectRemark] = useState('')
  const [expandedApps, setExpandedApps] = useState({})

  // 1. Fetch Students
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['advisorstudents'],
    queryFn: () => api.get('/advisor/students').then(r => r.data),
  })

  // 2. Fetch Applications
  const { data: allApplications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['advisorapps'],
    queryFn: () => api.get('/applications').then(r => r.data),
  })

  const pendingApplications = allApplications.filter(a => a.status === 'Pending_AcademicAdvisor')
  const pendingSupervision = students.filter(s => s.advisorStatus === 'Pending')

  // 3. Add Student Supervision
  const addStudentMutation = useMutation({
    mutationFn: (email) => api.post('/advisor/students/add', { studentEmail: email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['advisorstudents'])
      setStudentEmail('')
      alert('Supervision request sent successfully!')
    },
    onError: (err) => alert(err.response?.data || 'Failed to add student.'),
  })

  // 4. Accept Supervision
  const acceptSupervisionMutation = useMutation({
    mutationFn: (studentId) => api.post(`/advisor/students/${studentId}/accept`),
    onSuccess: () => queryClient.invalidateQueries(['advisorstudents']),
    onError: () => alert('Failed to accept student.'),
  })

  // 5. Review Application
  const reviewMutation = useMutation({
    mutationFn: ({ id, approved, remark }) =>
      api.post(`/applications/${id}/review`, { approved, remark }),
    onSuccess: () => {
      queryClient.invalidateQueries(['advisorapps'])
      setRejectDialogOpen(false)
      setRejectRemark('')
      setSelectedAppId(null)
      alert('Application reviewed successfully.')
    },
    onError: (err) => alert(err.response?.data || 'Review failed.'),
  })

  const toggleAppDetails = (appId) => {
    setExpandedApps(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }))
  }

  return (
    <>
      <PageHeader title="Advisor Dashboard" subtitle="Manage supervised students and verify application files" />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Metric Cards using Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomStatCard
              label="Supervised Students"
              value={students.filter(s => s.advisorStatus === 'Accepted').length}
              accentColor="#16a34a"
              icon={SchoolIcon}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomStatCard
              label="Supervision Requests"
              value={pendingSupervision.length}
              accentColor="#d97706"
              icon={PersonAddIcon}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomStatCard
              label="Pending Advisor Review"
              value={pendingApplications.length}
              accentColor="#0284c7"
              icon={HourglassEmptyIcon}
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            TabIndicatorProps={{
              style: {
                backgroundColor: '#065f46',
              }
            }}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '14px',
                color: '#64748b',
              },
              '& .Mui-selected': {
                color: '#065f46 !important',
              }
            }}
          >
            <Tab label="MY STUDENTS" />
            <Tab label={`PENDING APPLICATIONS (${pendingApplications.length})`} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box>
          {activeTab === 0 && (
            <Box sx={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Add Student Section */}
              <Card sx={{ bgcolor: '#ffffff', borderRadius: 2 }} variant="outlined">
                <CardContent sx={{ p: 3 }}>
                  <Typography fontWeight={700} fontSize={16} mb={0.5} color="#0f172a">
                    Supervise a New Student
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Link a student under your academic supervision by searching their email address.
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1.5}>
                    <TextField
                      size="small"
                      label="Student Email Address"
                      placeholder="student@um.edu.my"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      sx={{ bgcolor: '#fff', flex: 1, minWidth: '240px' }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => addStudentMutation.mutate(studentEmail)}
                      disabled={addStudentMutation.isPending || !studentEmail.trim()}
                      startIcon={<PersonAddAlt1Icon />}
                      sx={{
                        bgcolor: '#065f46',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#044e39' },
                        '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Add Student
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Students List */}
              <Box>
                <Typography variant="h6" fontWeight={700} mb={2.5} color="#0f172a">Supervised Student List</Typography>
                {studentsLoading ? (
                  <CircularProgress size={28} />
                ) : students.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>You are not supervising any students yet.</Alert>
                ) : (
                  <Box>
                    {students.map((student) => (
                      <StudentCard
                        key={student.studentId}
                        student={student}
                        onAccept={acceptSupervisionMutation.mutate}
                        acceptMutation={acceptSupervisionMutation}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ maxWidth: 860 }}>
              <Typography variant="h6" fontWeight={800} mb={2.5} color="#0f172a">Applications Awaiting Review</Typography>
              {appsLoading ? (
                <CircularProgress size={28} />
              ) : pendingApplications.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleOutlinedIcon />} sx={{ borderRadius: 2 }}>
                  All clear! There are no student mobility applications pending your review.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {pendingApplications.map((app) => {
                    const initials = app.studentName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
                    return (
                      <Card key={app.id} sx={{ borderLeft: '4px solid #d97706' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2, flexWrap: 'wrap' }}>
                            <Avatar sx={{ bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 700 }}>{initials}</Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography fontWeight={700} color="#0f172a" fontSize={15}>{app.studentName}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">{app.studentEmail}</Typography>
                              
                              <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                  <Typography variant="body2" color="text.secondary"><b>Program:</b> {app.programName}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                  <Typography variant="body2" color="text.secondary"><b>Destination:</b> {app.destinationCountry}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                  <Typography variant="body2" color="text.secondary"><b>Submitted:</b> {new Date(app.submittedAt).toLocaleDateString()}</Typography>
                                </Grid>
                              </Grid>
                            </Box>
                            <Chip label="Pending Advisor" color="warning" size="small" sx={{ fontWeight: 700 }} />
                          </Box>

                          <Divider sx={{ my: 2 }} />
                          
                          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1.5}>
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => reviewMutation.mutate({ id: app.id, approved: true, remark: '' })}
                              disabled={reviewMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() => {
                                setSelectedAppId(app.id);
                                setRejectDialogOpen(true);
                              }}
                              disabled={reviewMutation.isPending}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => toggleAppDetails(app.id)}
                              sx={{ ml: 'auto' }}
                            >
                              {expandedApps[app.id] ? 'Hide Student OCR Details' : 'Show Student OCR Details'}
                            </Button>
                          </Stack>

                          <Collapse in={Boolean(expandedApps[app.id])} sx={{ mt: 2 }}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" fontWeight={700} color="#0f172a" mb={2}>Student OCR Profile Details</Typography>
                            
                            <Grid container spacing={3}>
                              {app.studentPassportOcrData && (
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Typography variant="body2" fontWeight={700} color="#1e3a8a" mb={1}>PASSPORT OCR INFO</Typography>
                                  <PassportOcrTable ocrData={app.studentPassportOcrData} />
                                </Grid>
                              )}
                              {app.studentTranscriptOcrData && (
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Typography variant="body2" fontWeight={700} color="#1e3a8a" mb={1}>TRANSCRIPT OCR INFO</Typography>
                                  <TranscriptOcrTable ocrData={app.studentTranscriptOcrData} />
                                </Grid>
                              )}
                            </Grid>
                          </Collapse>

                          <Divider sx={{ my: 2 }} />
                          
                          <Typography variant="subtitle2" fontWeight={700} color="#0f172a" mb={1.5}>Approval History Logs</Typography>
                          {app.approvalLogs && app.approvalLogs.length > 0 ? (
                            <Box sx={{ display: 'grid', gap: 1 }}>
                              {app.approvalLogs.map((log) => {
                                const logInitials = log.actorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                return (
                                  <Paper
                                    key={log.id}
                                    variant="outlined"
                                    sx={{
                                      p: 1.5,
                                      borderLeft: '3px solid',
                                      borderColor: log.toStatus === 'Approved' ? 'success.main'
                                                 : log.toStatus === 'Rejected' ? 'error.main' : 'primary.main',
                                      bgcolor: '#f8fafc'
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'primary.light', color: '#fff' }}>{logInitials}</Avatar>
                                        <Typography variant="subtitle2" sx={{ fontSize: 12, fontWeight: 700 }}>{log.actorName}</Typography>
                                        <Chip label={log.actorRole} size="small" variant="outlined" sx={{ height: 18, fontSize: 9, fontWeight: 600 }} />
                                      </Stack>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                      </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }} mb={0.5}>
                                      {log.fromStatus} → {log.toStatus}
                                    </Typography>
                                    {log.remark && (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: 11.5 }}>
                                        "{log.remark}"
                                      </Typography>
                                    )}
                                  </Paper>
                                );
                              })}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">No approval history found.</Typography>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Reject Application Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Mobility Application</DialogTitle>
        <DialogContent dividers>
          <DialogContentText mb={2} fontSize={13}>
            Please provide a descriptive remark explaining why this mobility application is being rejected. This will be emailed to the student.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Remark"
            placeholder="Matric number mismatch, or missing valid files..."
            value={rejectRemark}
            onChange={(e) => setRejectRemark(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRejectDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => reviewMutation.mutate({ id: selectedAppId, approved: false, remark: rejectRemark })}
            disabled={reviewMutation.isPending}
          >
            {reviewMutation.isPending ? 'Rejecting...' : 'Reject Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
