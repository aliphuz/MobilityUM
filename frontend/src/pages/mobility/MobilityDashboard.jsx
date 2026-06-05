import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import {
  Box, Typography, Card, CardContent, Grid, Button,
  Chip, CircularProgress, Alert, TextField, ToggleButtonGroup, ToggleButton, Paper
} from '@mui/material'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import DownloadIcon from '@mui/icons-material/Download'
import PeopleIcon from '@mui/icons-material/People'
import { DataGrid, GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid'

import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'

export default function MobilityDashboard() {
  return (
    <Layout>
      <Routes>
        <Route index element={<AcceptedStudentsPage />} />
      </Routes>
    </Layout>
  )
}

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1, borderBottom: '1px solid #e2e8f0' }}>
      <GridToolbarExport />
    </GridToolbarContainer>
  )
}

function AcceptedStudentsPage() {
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)

  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: () => api.get('/programs').then(r => r.data),
  })

  const { data: programDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['program-students', selectedProgram],
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

  const filteredStudents = programDetails?.students?.filter(s =>
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
    (s.matricNumber || '').toLowerCase().includes(search.toLowerCase())
  ) || []

  const rows = filteredStudents.map((s, index) => ({
    id: s.applicationId || index,
    ...s
  }))

  const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000

  const columns = [
    {
      field: 'rowNo',
      headerName: 'No.',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1,
    },
    { field: 'studentName', headerName: 'Full Name', width: 180, fontWeight: 600 },
    { field: 'studentEmail', headerName: 'Email', width: 200 },
    { field: 'matricNumber', headerName: 'Matric No.', width: 120 },
    { field: 'faculty', headerName: 'Faculty', width: 150 },
    { field: 'programme', headerName: 'Programme', width: 180 },
    { field: 'phoneNumber', headerName: 'Phone', width: 130 },
    { field: 'passportNumber', headerName: 'Passport No.', width: 130 },
    {
      field: 'passportExpiry',
      headerName: 'Passport Expiry',
      width: 160,
      renderCell: (params) => {
        if (!params.value) return '-'
        const date = new Date(params.value)
        const isNearExpiry = date - new Date() < sixMonths
        return (
          <Chip
            label={date.toLocaleDateString()}
            size="small"
            color={isNearExpiry ? 'error' : 'success'}
            sx={{ fontWeight: 700 }}
          />
        )
      }
    },
    {
      field: 'visaExpiry',
      headerName: 'Visa Expiry',
      width: 160,
      renderCell: (params) => {
        if (!params.value) return '-'
        const date = new Date(params.value)
        const isNearExpiry = date - new Date() < sixMonths
        return (
          <Chip
            label={date.toLocaleDateString()}
            size="small"
            color={isNearExpiry ? 'error' : 'success'}
            sx={{ fontWeight: 700 }}
          />
        )
      }
    }
  ]

  return (
    <>
      <PageHeader
        title="Accepted Students Cohort"
        subtitle="View and manage student cohorts accepted to your university's mobility programmes"
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* ToggleButtonGroup Selector */}
        <Card>
          <CardContent>
            <Typography fontWeight={700} fontSize={15} mb={2} color="#0f172a">
              Select Mobility Programme
            </Typography>
            {loadingPrograms && <CircularProgress size={20} />}
            <ToggleButtonGroup
              value={selectedProgram}
              exclusive
              onChange={(e, val) => {
                if (val !== null) setSelectedProgram(val);
              }}
              color="primary"
              size="small"
              sx={{
                flexWrap: 'wrap',
                gap: 1.5,
                border: 'none',
                '& .MuiToggleButtonGroup-grouped': {
                  border: '1px solid #e2e8f0 !important',
                  borderRadius: '8px !important',
                  margin: '0 !important',
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none'
                }
              }}
            >
              {programs.map(p => (
                <ToggleButton key={p.id} value={p.id}>
                  {p.name}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </CardContent>
        </Card>

        {selectedProgram && programDetails && (
          <>
            {/* Stat Cards using Grid */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  label="Accepted Students"
                  value={programDetails.totalAccepted}
                  accentColor="#7c2d12"
                  icon={PeopleAltIcon}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  label="Total Quota"
                  value={programDetails.program?.quota || 0}
                  accentColor="#475569"
                  icon={FormatListNumberedIcon}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  label="Slots Remaining"
                  value={Math.max(0, (programDetails.program?.quota || 0) - programDetails.totalAccepted)}
                  accentColor="#d97706"
                  icon={EventAvailableIcon}
                />
              </Grid>
            </Grid>

            {/* Students DataGrid Card */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Typography fontWeight={700} fontSize={16} color="#0f172a">
                    Student List — {programDetails.program?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleExport}
                      disabled={exporting}
                      sx={{ py: 0.8 }}
                    >
                      {exporting ? 'Exporting...' : 'Export Excel'}
                    </Button>
                    <TextField
                      size="small"
                      placeholder="Search by name, email or matric..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      sx={{ width: 280, bgcolor: '#fff' }}
                    />
                  </Box>
                </Box>

                {loadingDetails && <CircularProgress />}

                {!loadingDetails && rows.length === 0 && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>No accepted students found.</Alert>
                )}

                {!loadingDetails && rows.length > 0 && (
                  <Paper variant="outlined" sx={{ height: 500, width: '100%', overflow: 'hidden' }}>
                    <DataGrid
                      rows={rows}
                      columns={columns}
                      initialState={{
                        pagination: {
                          paginationModel: { page: 0, pageSize: 10 },
                        },
                      }}
                      pageSizeOptions={[10, 20]}
                      disableRowSelectionOnClick
                      slots={{ toolbar: CustomToolbar }}
                      sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                          bgcolor: '#f1f5f9',
                          borderBottom: '1px solid #e2e8f0',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                          fontWeight: 700,
                          color: '#334155',
                        },
                        '& .MuiDataGrid-cell': {
                          borderBottom: '1px solid #f1f5f9',
                        },
                        '& .MuiDataGrid-row:hover': {
                          bgcolor: '#f8fafc',
                        },
                      }}
                    />
                  </Paper>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedProgram && (
          <Alert severity="info" icon={<PeopleIcon />} sx={{ borderRadius: 2 }}>
            Select a mobility programme above to view the accepted student list.
          </Alert>
        )}
      </Box>
    </>
  )
}