import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, Avatar, MenuItem
} from '@mui/material'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'Student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', borderRadius: 3, mx: 'auto', mb: 2 }}>
            <PersonAddOutlinedIcon />
          </Avatar>
          <Typography variant="h5" fontWeight={700} color="#0f172a">Create account</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Join the MobilityUM platform</Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={3} color="#0f172a">Register</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField fullWidth label="Full name" placeholder="Ahmad Faris bin Ali"
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                required sx={{ mb: 2 }} size="small" />
              <TextField fullWidth label="Email address" type="email" placeholder="you@um.edu.my"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                required sx={{ mb: 2 }} size="small" />
              <TextField fullWidth label="Password" type="password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                required sx={{ mb: 2 }} size="small" />
              <TextField fullWidth label="Role" select
                value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                sx={{ mb: 3 }} size="small">
                <MenuItem value="Student">Student</MenuItem>
                <MenuItem value="AcademicAdvisor">Academic Advisor</MenuItem>
                <MenuItem value="TdhepAdmin">TDHEP Admin</MenuItem>
                <MenuItem value="MobilityUniversity">Mobility University</MenuItem>
              </TextField>
              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#1d4ed8', fontWeight: 500 }}>Sign in</Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}