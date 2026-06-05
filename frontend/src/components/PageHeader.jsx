import React from 'react'
import { Box, Typography, Divider } from '@mui/material'

export default function PageHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" fontWeight={700} color="#0f172a">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="#64748b" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
      <Divider sx={{ mt: 2 }} />
    </Box>
  )
}