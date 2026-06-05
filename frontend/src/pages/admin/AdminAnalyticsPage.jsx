import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import api from '../../api/axios'
import {
  Box, Typography, Grid, CircularProgress, Alert, Table, TableBody, TableCell, TableHead,
  TableRow, Chip, Paper, TableContainer
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import CancelIcon from '@mui/icons-material/Cancel'

import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'

export default function AdminAnalyticsPage() {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['adminapps'],
    queryFn: () => api.get('/applications').then(r => r.data),
  })

  const counts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  const pieData = [
    { name: 'Approved', value: counts['Approved'] || 0, color: '#16a34a' },
    { name: 'Pending TDHEP', value: counts['Pending_TDHEP'] || 0, color: '#d97706' },
    { name: 'Pending Advisor', value: counts['Pending_AcademicAdvisor'] || 0, color: '#2563eb' },
    { name: 'Rejected', value: counts['Rejected'] || 0, color: '#dc2626' },
  ].filter(d => d.value > 0)

  const countryData = Object.entries(
    applications.reduce((acc, a) => {
      acc[a.destinationCountry] = (acc[a.destinationCountry] || 0) + 1
      return acc
    }, {})
  ).map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const pendingApps = applications.filter(a => a.status === 'Pending_TDHEP')

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <PageHeader title="Analytics Dashboard" subtitle="Real-time overview of mobility programme metrics" />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Metric Cards using Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Total Applications" value={applications.length} accentColor="#4c1d95" icon={AssignmentIcon} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Approved" value={counts['Approved'] || 0} accentColor="#16a34a" icon={CheckCircleIcon} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Pending TDHEP" value={counts['Pending_TDHEP'] || 0} accentColor="#d97706" icon={HourglassEmptyIcon} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Rejected" value={counts['Rejected'] || 0} accentColor="#dc2626" icon={CancelIcon} />
          </Grid>
        </Grid>

        {/* Charts Section using Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper variant="outlined" sx={{ p: 3, height: 480, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 2 }}>
                <Typography fontWeight={700} fontSize={16} color="#0f172a">
                  Applications by Status
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {timestamp}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                {pieData.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No status data available</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={110} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper variant="outlined" sx={{ p: 3, height: 480, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 2 }}>
                <Typography fontWeight={700} fontSize={16} color="#0f172a">
                  Top Destinations
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {timestamp}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                {countryData.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No country data available</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={countryData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4c1d95" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Bottleneck Monitor */}
        <Box>
          {pendingApps.length === 0 ? (
            <Alert severity="success" variant="outlined" sx={{ width: '100%', borderRadius: 2 }}>
              No bottlenecks detected — all applications are moving smoothly.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="warning" variant="outlined" sx={{ width: '100%', borderRadius: 2, fontWeight: 500 }}>
                Bottleneck Warning: There are {pendingApps.length} applications waiting for TDHEP Admin review.
              </Alert>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography fontWeight={700} fontSize={16} mb={2.5} color="#0f172a">
                  Bottleneck Monitor Queue
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead sx={{ background: '#f1f5f9' }}>
                      <TableRow>
                        {['Student', 'Program', 'Destination', 'Submitted', 'Days waiting'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingApps.map(a => {
                        const days = Math.floor((new Date() - new Date(a.submittedAt)) / 86400000)
                        return (
                          <TableRow key={a.id} sx={{ '&:hover': { background: '#f8fafc' } }}>
                            <TableCell sx={{ fontWeight: 600 }}>{a.studentName}</TableCell>
                            <TableCell>{a.programName}</TableCell>
                            <TableCell>{a.destinationCountry}</TableCell>
                            <TableCell>{new Date(a.submittedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Chip
                                label={`${days} days${days > 7 ? ' (!)' : ''}`}
                                size="small"
                                color={days > 7 ? 'error' : days > 4 ? 'warning' : 'success'}
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>
    </>
  )
}
