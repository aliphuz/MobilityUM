import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import TranscriptOcrTable from '../../components/TranscriptOcrTable'
import {
  Avatar, Box, Button, Card, CardContent, Chip,
  CircularProgress, Divider, Grid, IconButton,
  Paper, Stack, TextField, Typography, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import BadgeIcon from '@mui/icons-material/Badge'
import ArticleIcon from '@mui/icons-material/Article'
import FlightIcon from '@mui/icons-material/Flight'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'

function PageHeader({ title, subtitle }) {
  return (
    <Box sx={{ background: '#fff', px: 4, py: 2.5, borderBottom: '1px solid #e2e8f0' }}>
      <Typography variant="h6" fontWeight={600} color="#0f172a">{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" mt={0.3}>{subtitle}</Typography>}
    </Box>
  )
}

export default function StudentProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then(r => r.data),
  })

  const [editMode, setEditMode] = useState(false)
  const [profilePhotoFile, setProfilePhotoFile] = useState(null)
  const [infoForm, setInfoForm] = useState({
    matricNumber: '', phoneNumber: '', faculty: '', programme: '', currentYear: '', advisorEmail: ''
  })
  const [passportForm, setPassportForm] = useState({ passportNumber: '', passportNationality: '', passportExpiry: '' })
  const [visaForm, setVisaForm] = useState({ visaType: '', visaExpiry: '' })
  const [passportFile, setPassportFile] = useState(null)
  const [visaFile, setVisaFile] = useState(null)
  const [transcriptFile, setTranscriptFile] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [passportOcrDraft, setPassportOcrDraft] = useState(null)
  const [transcriptOcrDraft, setTranscriptOcrDraft] = useState(null)

  useEffect(() => {
    if (!profile) return

    setInfoForm({
      matricNumber: profile.matricNumber || '',
      phoneNumber: profile.phoneNumber || '',
      faculty: profile.faculty || '',
      programme: profile.programme || '',
      currentYear: profile.currentYear || '',
      advisorEmail: profile.advisorEmail || ''
    })

    setPassportForm({
      passportNumber: profile.passportNumber || '',
      passportNationality: profile.passportNationality || '',
      passportExpiry: profile.passportExpiry ? profile.passportExpiry.split('T')[0] : ''
    })

    setVisaForm({
      visaType: profile.visaType || '',
      visaExpiry: profile.visaExpiry ? profile.visaExpiry.split('T')[0] : ''
    })
  }, [profile])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const updateProfileMutation = useMutation({
    mutationFn: () => api.put('/profile', {
      matricNumber: infoForm.matricNumber || null,
      phoneNumber: infoForm.phoneNumber || null,
      faculty: infoForm.faculty || null,
      programme: infoForm.programme || null,
      currentYear: infoForm.currentYear || null,
      advisorEmail: infoForm.advisorEmail || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      setEditMode(false)
      showMessage('success', 'Profile updated successfully.')
    },
    onError: (err) => showMessage('error', err.response?.data || 'Failed to save profile information.'),
  })

  const uploadProfilePhotoMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', profilePhotoFile)
      return api.post('/profile/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      setProfilePhotoFile(null)
      showMessage('success', 'Profile photo uploaded.')
    },
    onError: () => showMessage('error', 'Photo upload failed.'),
  })

  const uploadPassportMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', passportFile)
      return api.post('/profile/passport', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['profile'])
      setPassportFile(null)
      showMessage('success', 'Passport uploaded successfully. Please verify and edit the extracted OCR details.')
      
      const ext = res.data?.ocrData || {}
      setPassportOcrDraft({
        passportNumber: ext.documentNumber ?? '',
        passportNationality: ext.countryRegion ?? '',
        passportExpiry: ext.expiryDate ? ext.expiryDate.split('T')[0] : '',
        firstName: ext.firstName ?? '',
        lastName: ext.lastName ?? '',
        dateOfBirth: ext.dateOfBirth ? ext.dateOfBirth.split('T')[0] : '',
        sex: ext.sex ?? '',
      })
    },
    onError: () => showMessage('error', 'Passport upload failed.'),
  })

  const confirmPassportMutation = useMutation({
    mutationFn: (draft) => api.put('/profile/passport', {
      passportNumber: draft.passportNumber || null,
      passportNationality: draft.passportNationality || null,
      passportExpiry: draft.passportExpiry || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      setPassportOcrDraft(null)
      showMessage('success', 'Passport details saved successfully.')
    },
    onError: () => showMessage('error', 'Failed to save passport details.'),
  })

  const uploadVisaMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', visaFile)
      return api.post('/profile/visa', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      setVisaFile(null)
      showMessage('success', 'Visa uploaded successfully.')
    },
    onError: () => showMessage('error', 'Visa upload failed.'),
  })

  const updateVisaMutation = useMutation({
    mutationFn: () => api.put('/profile/visa', {
      visaType: visaForm.visaType || null,
      visaExpiry: visaForm.visaExpiry || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      showMessage('success', 'Visa details saved.')
    },
    onError: () => showMessage('error', 'Failed to save visa details.'),
  })

  const uploadTranscriptMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', transcriptFile)
      return api.post('/profile/transcript', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['profile'])
      setTranscriptFile(null)
      showMessage('success', 'Transcript uploaded successfully. Please review the extracted OCR data.')
      if (res.data?.ocrData) {
        const ext = res.data.ocrData
        setTranscriptOcrDraft({
          studentName: ext.studentName ?? '',
          matricNumber: ext.matricNumber ?? '',
          cgpa: ext.cgpa ?? '',
          semesters: ext.semesters ?? []
        })
      }
    },
    onError: () => showMessage('error', 'Transcript upload failed.'),
  })

  const confirmTranscriptMutation = useMutation({
    mutationFn: (draft) => api.put('/profile/transcript', draft),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      setTranscriptOcrDraft(null)
      showMessage('success', 'Transcript details saved successfully.')
    },
    onError: () => showMessage('error', 'Failed to save transcript details.'),
  })

  const sixMonthsFromNow = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Upload your documents once; they will be used across all mobility applications."
      />

      <Box sx={{ p: 4, maxWidth: 960 }}>
        {message.text && (
          <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>
        )}

        {!profile?.advisorEmail && (
          <Alert severity="warning" sx={{ mb: 3, fontWeight: 500 }}>
            No academic advisor assigned. Enter your advisor's email address.
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Box sx={{ position: 'relative', width: 110, height: 110 }}>
                  <Avatar
                    src={profile?.profilePhotoUrl || undefined}
                    alt={profile?.fullName || "Student Profile"}
                    sx={{ width: 110, height: 110, fontSize: 32, bgcolor: '#c7d2fe' }}
                  >
                    {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "S"} 
                  </Avatar>
                  <IconButton
                    component="label"
                    size="small"
                    sx={{ position: 'absolute', right: -6, bottom: -6, bgcolor: '#fff', boxShadow: 1 }}
                  >
                    <CameraAltIcon fontSize="small" />
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={e => setProfilePhotoFile(e.target.files?.[0] || null)}
                    />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{profile?.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                    <Chip label={user?.role || 'Student'} size="small" sx={{ mt: 1, fontWeight: 600 }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setEditMode(true)}
                    >
                      Edit profile
                    </Button>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Academic Advisor Email: {profile?.advisorEmail || 'Not provided'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Advisor status: {profile?.advisorStatus || 'Pending'}
                </Typography>
              </Grid>
            </Grid>

            {profilePhotoFile && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>{profilePhotoFile.name}</Typography>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => uploadProfilePhotoMutation.mutate()}
                  disabled={uploadProfilePhotoMutation.isPending}
                >
                  Upload photo
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BadgeIcon color="primary" />
              <Typography fontWeight={600} fontSize={14}>Student information</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Matric number"
                  value={infoForm.matricNumber}
                  disabled={!editMode}
                  onChange={e => setInfoForm(f => ({ ...f, matricNumber: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Phone number"
                  value={infoForm.phoneNumber}
                  disabled={!editMode}
                  onChange={e => setInfoForm(f => ({ ...f, phoneNumber: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Faculty"
                  value={infoForm.faculty}
                  disabled={!editMode}
                  onChange={e => setInfoForm(f => ({ ...f, faculty: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Programme"
                  value={infoForm.programme}
                  disabled={!editMode}
                  onChange={e => setInfoForm(f => ({ ...f, programme: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Current year"
                  value={infoForm.currentYear}
                  disabled={!editMode}
                  onChange={e => setInfoForm(f => ({ ...f, currentYear: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Academic Advisor Email"
                  type="email"
                  value={infoForm.advisorEmail}
                  disabled={!editMode}
                  onChange={e => setInfoForm(f => ({ ...f, advisorEmail: e.target.value }))}
                  helperText="Enter your advisor's email address so they can review your applications."
                />
              </Grid>
            </Grid>
            {editMode && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Documents</Typography>

        <Alert severity="info" sx={{ mb: 3, fontWeight: 500 }}>
          At least one document (Passport or Visa) is required to submit an application.
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <FlightIcon color="primary" />
                  <Typography fontWeight={600}>Passport</Typography>
                </Stack>
                 <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Chip
                    label={profile?.passportUploaded ? "Passport ✓" : "Passport"}
                    color={profile?.passportUploaded ? "success" : "default"}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  {profile?.passportExpiry && (
                    <Typography variant="caption" color={new Date(profile.passportExpiry) < sixMonthsFromNow ? 'warning.main' : 'text.secondary'}>
                      Expiry: {new Date(profile.passportExpiry).toLocaleDateString()}
                    </Typography>
                  )}
                </Stack>
                {profile?.passportExpiry && new Date(profile.passportExpiry) < sixMonthsFromNow && (
                  <Alert severity="warning" sx={{ mb: 2, py: 0.5, fontSize: 11 }}>
                    Passport expires in less than 6 months!
                  </Alert>
                )}
                <Box sx={{ mb: 2 }}>
                  <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} fullWidth sx={{ mb: 1 }}>
                    {profile?.passportUploaded ? 'Replace passport' : 'Upload passport'}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={e => setPassportFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {passportFile && <Typography variant="caption" color="text.secondary" display="block">{passportFile.name}</Typography>}
                </Box>
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    disabled={!passportFile || uploadPassportMutation.isPending}
                    onClick={() => uploadPassportMutation.mutate()}
                  >
                    {uploadPassportMutation.isPending ? 'Uploading...' : 'Upload & Analyze Passport'}
                  </Button>
                </Stack>
                {profile?.passportBlobUrl && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>
                    Current file: <a href={profile.passportBlobUrl} target="_blank" rel="noreferrer">View File</a>
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <FlightIcon color="primary" />
                  <Typography fontWeight={600}>Visa</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Chip
                    label={profile?.visaUploaded ? "Visa ✓" : "Visa"}
                    color={profile?.visaUploaded ? "success" : "default"}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  {profile?.visaExpiry && (
                    <Typography variant="caption" color={new Date(profile.visaExpiry) < sixMonthsFromNow ? 'warning.main' : 'text.secondary'}>
                      Expiry: {new Date(profile.visaExpiry).toLocaleDateString()}
                    </Typography>
                  )}
                </Stack>
                {profile?.visaExpiry && new Date(profile.visaExpiry) < sixMonthsFromNow && (
                  <Alert severity="warning" sx={{ mb: 2, py: 0.5, fontSize: 11 }}>
                    Visa expires in less than 6 months!
                  </Alert>
                )}
                <Box sx={{ mb: 2 }}>
                  <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} fullWidth sx={{ mb: 1 }}>
                    {profile?.visaUploaded ? 'Replace visa' : 'Upload visa'}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={e => setVisaFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {visaFile && <Typography variant="caption" color="text.secondary" display="block">{visaFile.name}</Typography>}
                </Box>
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    disabled={!visaFile || uploadVisaMutation.isPending}
                    onClick={() => uploadVisaMutation.mutate()}
                  >
                    {uploadVisaMutation.isPending ? 'Uploading...' : 'Upload Visa'}
                  </Button>
                </Stack>
                {profile?.visaBlobUrl && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>
                    Current file: <a href={profile.visaBlobUrl} target="_blank" rel="noreferrer">View File</a>
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <ArticleIcon color="primary" />
                  <Typography fontWeight={600}>Transcript</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Chip
                    label={profile?.transcriptUploaded ? "Transcript ✓" : "Transcript"}
                    color={profile?.transcriptUploaded ? "success" : "default"}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
                <Box sx={{ mb: 2 }}>
                  <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} fullWidth sx={{ mb: 1 }}>
                    {profile?.transcriptUploaded ? 'Replace transcript' : 'Upload transcript'}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={e => setTranscriptFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {transcriptFile && <Typography variant="caption" color="text.secondary" display="block">{transcriptFile.name}</Typography>}
                </Box>
                <Button
                  variant="contained"
                  disabled={!transcriptFile || uploadTranscriptMutation.isPending}
                  onClick={() => uploadTranscriptMutation.mutate()}
                  fullWidth
                >
                  {uploadTranscriptMutation.isPending ? 'Uploading & Analyzing...' : 'Upload & Analyze Transcript'}
                </Button>
                {profile?.transcriptBlobUrl && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>
                    Current file: <a href={profile.transcriptBlobUrl} target="_blank" rel="noreferrer">View File</a>
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Passport OCR Edit Form */}
        {passportOcrDraft && (
          <Card sx={{ mt: 3, p: 3, border: '1px solid #10b981', bgcolor: '#fff' }}>
            <Typography variant="h6" fontWeight={700} color="#0f172a">Passport OCR Result — Review & Edit Before Saving</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              These fields were auto-detected. Edit any incorrect values then click Save.
            </Typography>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="First Name"
                  value={passportOcrDraft.firstName}
                  onChange={(e) => setPassportOcrDraft(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Last Name"
                  value={passportOcrDraft.lastName}
                  onChange={(e) => setPassportOcrDraft(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Passport Number"
                  value={passportOcrDraft.passportNumber}
                  onChange={(e) => setPassportOcrDraft(prev => ({ ...prev, passportNumber: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date of Birth"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={passportOcrDraft.dateOfBirth}
                  onChange={(e) => setPassportOcrDraft(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Expiry Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={passportOcrDraft.passportExpiry}
                  onChange={(e) => setPassportOcrDraft(prev => ({ ...prev, passportExpiry: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Country / Nationality"
                  value={passportOcrDraft.passportNationality}
                  onChange={(e) => setPassportOcrDraft(prev => ({ ...prev, passportNationality: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Sex"
                  value={passportOcrDraft.sex}
                  onChange={(e) => setPassportOcrDraft(prev => ({ ...prev, sex: e.target.value }))}
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => confirmPassportMutation.mutate(passportOcrDraft)}
                disabled={confirmPassportMutation.isPending}
                sx={{ flex: 1 }}
              >
                {confirmPassportMutation.isPending ? 'Saving...' : 'Save Passport Details'}
              </Button>
              <Button variant="outlined" onClick={() => setPassportOcrDraft(null)}>
                Cancel
              </Button>
            </Stack>
          </Card>
        )}

        {/* Read-Only Confirmed Passport details */}
        {profile?.passportOcrConfirmed && !passportOcrDraft && (
          <Card sx={{ mt: 3, p: 3, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700} color="#0f172a">Confirmed Passport Details</Typography>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setPassportOcrDraft({
                  passportNumber: profile.passportNumber ?? '',
                  passportNationality: profile.passportNationality ?? '',
                  passportExpiry: profile.passportExpiry ? profile.passportExpiry.split('T')[0] : '',
                  firstName: profile.passportOcrData?.firstName ?? profile.fullName?.split(' ')[0] ?? '',
                  lastName: profile.passportOcrData?.lastName ?? profile.fullName?.split(' ').slice(1).join(' ') ?? '',
                  dateOfBirth: profile.passportOcrData?.dateOfBirth ? profile.passportOcrData.dateOfBirth.split('T')[0] : '',
                  sex: profile.passportOcrData?.sex ?? '',
                })}
              >
                Edit
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 200 }}>First Name</TableCell>
                    <TableCell>{profile.passportOcrData?.firstName || profile.fullName?.split(' ')[0] || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Last Name</TableCell>
                    <TableCell>{profile.passportOcrData?.lastName || profile.fullName?.split(' ').slice(1).join(' ') || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Passport Number</TableCell>
                    <TableCell>{profile.passportNumber || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date of Birth</TableCell>
                    <TableCell>{profile.passportOcrData?.dateOfBirth ? new Date(profile.passportOcrData.dateOfBirth).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Expiry Date</TableCell>
                    <TableCell>{profile.passportExpiry ? new Date(profile.passportExpiry).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Country / Nationality</TableCell>
                    <TableCell>{profile.passportNationality || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Sex</TableCell>
                    <TableCell>{profile.passportOcrData?.sex || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Transcript OCR Edit Form */}
        {transcriptOcrDraft && (
          <Card sx={{ mt: 3, p: 3, border: '1px solid #10b981', bgcolor: '#fff' }}>
            <Typography variant="h6" fontWeight={700} color="#0f172a">Transcript OCR Result — Review & Edit Before Saving</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Auto-detected academic records. Edit any incorrect values then click Save.
            </Typography>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Student Name"
                  value={transcriptOcrDraft.studentName}
                  onChange={(e) => setTranscriptOcrDraft(prev => ({ ...prev, studentName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Matric Number"
                  value={transcriptOcrDraft.matricNumber}
                  onChange={(e) => setTranscriptOcrDraft(prev => ({ ...prev, matricNumber: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="CGPA"
                  type="number"
                  inputProps={{ step: 0.01, min: 0, max: 4 }}
                  value={transcriptOcrDraft.cgpa}
                  onChange={(e) => setTranscriptOcrDraft(prev => ({ ...prev, cgpa: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
            </Grid>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Semester Records</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 600, width: 60 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Semester</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>GPA</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 80 }} align="center">Remove</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transcriptOcrDraft.semesters.map((sem, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={sem.year}
                            onChange={(e) => {
                              const newSems = [...transcriptOcrDraft.semesters];
                              newSems[index] = { ...newSems[index], year: e.target.value };
                              setTranscriptOcrDraft(prev => ({ ...prev, semesters: newSems }));
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={sem.semester}
                            onChange={(e) => {
                              const newSems = [...transcriptOcrDraft.semesters];
                              newSems[index] = { ...newSems[index], semester: e.target.value };
                              setTranscriptOcrDraft(prev => ({ ...prev, semesters: newSems }));
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ step: 0.01, min: 0, max: 4 }}
                            value={sem.gpa}
                            onChange={(e) => {
                              const newSems = [...transcriptOcrDraft.semesters];
                              newSems[index] = { ...newSems[index], gpa: parseFloat(e.target.value) || 0 };
                              setTranscriptOcrDraft(prev => ({ ...prev, semesters: newSems }));
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => {
                              const newSems = transcriptOcrDraft.semesters.filter((_, i) => i !== index);
                              setTranscriptOcrDraft(prev => ({ ...prev, semesters: newSems }));
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 1.5 }}
                onClick={() => setTranscriptOcrDraft(prev => ({
                  ...prev,
                  semesters: [...prev.semesters, { year: '', semester: '', gpa: '' }]
                }))}
              >
                Add Row
              </Button>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => confirmTranscriptMutation.mutate(transcriptOcrDraft)}
                disabled={confirmTranscriptMutation.isPending}
                sx={{ flex: 1 }}
              >
                {confirmTranscriptMutation.isPending ? 'Saving...' : 'Save Transcript Details'}
              </Button>
              <Button variant="outlined" onClick={() => setTranscriptOcrDraft(null)}>
                Cancel
              </Button>
            </Stack>
          </Card>
        )}

        {/* Read-Only Confirmed Transcript details */}
        {profile?.transcriptOcrConfirmed && !transcriptOcrDraft && (
          <Card sx={{ mt: 3, p: 3, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700} color="#0f172a">Confirmed Academic Transcript Details</Typography>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setTranscriptOcrDraft({
                  studentName: profile.transcriptOcrData?.studentName ?? '',
                  matricNumber: profile.transcriptOcrData?.matricNumber ?? '',
                  cgpa: profile.transcriptOcrData?.cgpa ?? '',
                  semesters: profile.transcriptOcrData?.semesters ?? []
                })}
              >
                Edit
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 200 }}>Student Name</TableCell>
                    <TableCell>{profile.transcriptOcrData?.studentName || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Matric Number</TableCell>
                    <TableCell>{profile.transcriptOcrData?.matricNumber || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Cumulative GPA (CGPA)</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {profile.transcriptOcrData?.cgpa || 'N/A'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="#0f172a">Semester Records</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 60 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Semester</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>GPA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profile.transcriptOcrData?.semesters?.map((sem, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{sem.year}</TableCell>
                      <TableCell>{sem.semester}</TableCell>
                      <TableCell>{sem.gpa}</TableCell>
                    </TableRow>
                  ))}
                  {(!profile.transcriptOcrData?.semesters || profile.transcriptOcrData.semesters.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">No semester records found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Box>
    </>
  )
}
