import React from 'react'
import { Card, CardContent, Box, Typography, Stack } from '@mui/material'

export default function StatCard({ icon: Icon, value, label, accentColor }) {
  return (
    <Card sx={{ height: '100%', borderLeft: `4px solid ${accentColor || '#1e40af'}`, borderRadius: 2 }} elevation={1}>
      <CardContent sx={{ py: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          {Icon && (
            <Box sx={{ color: accentColor, display: 'flex', alignItems: 'center' }}>
              <Icon sx={{ fontSize: 36 }} />
            </Box>
          )}
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ fontSize: '32px', lineHeight: 1, color: '#0f172a', mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="#64748b" fontWeight={500}>
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
