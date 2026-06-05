import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, Avatar
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token)
      const role = res.data.role
      if (role === 'Student') navigate('/student/programs')
      else if (role === 'AcademicAdvisor') navigate('/advisor')
      else if (role === 'MobilityUniversity') navigate('/mobility')
      else navigate('/admin')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', borderRadius: 3, mx: 'auto', mb: 2 }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography variant="h5" fontWeight={700} color="#0f172a">MobilityUM</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            FSKTM International Student Mobility System
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={3} color="#0f172a">
              Sign in to your account
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Email address" type="email"
                placeholder="you@um.edu.my"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required sx={{ mb: 2 }} size="small"
              />
              <TextField
                fullWidth label="Password" type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required sx={{ mb: 3 }} size="small"
              />
              <Button
                fullWidth type="submit" variant="contained"
                size="large" disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#1d4ed8', fontWeight: 500 }}>Register here</Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}