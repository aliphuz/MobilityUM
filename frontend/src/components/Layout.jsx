import { useState } from 'react'
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon,
  Avatar, Typography, Button, Divider, AppBar, Toolbar, Breadcrumbs, Link as MuiLink, Chip
} from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'
import AssignmentIcon from '@mui/icons-material/Assignment'
import SchoolIcon from '@mui/icons-material/School'
import PersonIcon from '@mui/icons-material/Person'
import DashboardIcon from '@mui/icons-material/Dashboard'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

const navItems = {
  Student: [
    { to: '/student/programs', label: 'Programs', icon: <SchoolIcon /> },
    { to: '/student/applications', label: 'My Applications', icon: <AssignmentIcon /> },
    { to: '/student/profile', label: 'My Profile', icon: <PersonIcon /> },
  ],
  AcademicAdvisor: [
    { to: '/advisor', label: 'Dashboard', icon: <DashboardIcon /> },
  ],
  TdhepAdmin: [
    { to: '/admin/analytics', label: 'Analytics', icon: <BarChartIcon /> },
    { to: '/admin/applications', label: 'Applications', icon: <AssignmentIcon /> },
    { to: '/admin/programs', label: 'Programs', icon: <SchoolIcon /> },
  ],
  MobilityUniversity: [
    { to: '/mobility', label: 'Dashboard', icon: <DashboardIcon /> },
  ],
}

const roleColors = {
  Student: '#1e40af', // Blue
  AcademicAdvisor: '#065f46', // Dark Green
  TdhepAdmin: '#4c1d95', // Purple
  MobilityUniversity: '#7c2d12', // Dark Brown/Rust
}

function getRoleTheme(role) {
  const primaryColor = roleColors[role] || '#1e40af'
  return createTheme({
    palette: {
      primary: { main: primaryColor },
      secondary: { main: '#475569' },
      success: { main: '#16a34a' },
      warning: { main: '#d97706' },
      error: { main: '#dc2626' },
      background: { default: '#f8fafc', paper: '#ffffff' },
    },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: 10 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { boxShadow: 'none' },
          outlined: { border: '1px solid #e2e8f0', borderRadius: 10 },
        },
      },
    },
  })
}

const DRAWER_WIDTH = 250

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const items = navItems[user?.role] || []
  const sidebarBg = roleColors[user?.role] || '#1e293b'

  const displayName = user?.name || user?.fullName || 'User'
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleTheme = getRoleTheme(user?.role)
  const pathnames = location.pathname.split('/').filter(x => x)

  const titleMap = {
    student: 'Student Portal',
    programs: 'Programs Listing',
    applications: 'Applications',
    profile: 'Supervised Student Profile',
    advisor: 'Advisor Dashboard',
    admin: 'Admin Console',
    analytics: 'Analytics Overview',
    mobility: 'Partner Dashboard',
  }

  const getBreadcrumbLabel = (segment) => {
    return titleMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  const pageTitle = user?.role === 'TdhepAdmin' ? 'TDHEP Admin Console'
                  : user?.role === 'AcademicAdvisor' ? 'Academic Advisor Workspace'
                  : user?.role === 'MobilityUniversity' ? 'Mobility Partner Portal'
                  : 'Student Mobility Workspace'

  return (
    <ThemeProvider theme={roleTheme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>

        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              background: sidebarBg,
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'none',
            },
          }}
        >
          {/* Logo */}
          <Box sx={{ px: 3, py: 3.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
              MobilityUM
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500, mt: 0.5 }}>
              FSKTM Mobility Portal
            </Typography>
          </Box>

          {/* Nav items */}
          <List sx={{ flex: 1, pt: 2, px: 1.5 }}>
            {items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={{ textDecoration: 'none' }}
              >
                {({ isActive }) => (
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      sx={{
                        borderRadius: '8px',
                        backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                        px: 2,
                        py: 1.2,
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: '#ffffff',
                          minWidth: 36,
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        sx={{
                          '& .MuiTypography-root': {
                            color: '#ffffff',
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 13.5,
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )}
              </NavLink>
            ))}
          </List>

          {/* User footer */}
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <Box sx={{ px: 2, py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 700 }}>
                {initials}
              </Avatar>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography sx={{ color: '#ffffff', fontSize: 13, fontWeight: 700 }} noWrap>
                  {displayName}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, mb: 0.5 }} noWrap>
                  {user?.email}
                </Typography>
                <Chip
                  label={
                    user?.role === 'TdhepAdmin' ? 'TDHEP Admin' :
                    user?.role === 'AcademicAdvisor' ? 'Academic Advisor' :
                    user?.role === 'MobilityUniversity' ? 'Partner Uni' :
                    'Student'
                  }
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: 9,
                    fontWeight: 700,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              </Box>
            </Box>
            <Button
              fullWidth
              onClick={handleLogout}
              variant="outlined"
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.3)',
                fontSize: 12.5,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                py: 0.8,
                '&:hover': {
                  borderColor: '#ffffff',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                },
              }}
            >
              Sign out
            </Button>
          </Box>
        </Drawer>

        {/* Main content */}
        <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, bgcolor: '#f8fafc' }}>
          {/* Top AppBar */}
          <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
            <Toolbar sx={{ px: 3, py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: '64px' }}>
              <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 14, color: '#94a3b8' }} />} aria-label="breadcrumb" sx={{ mb: 0.5 }}>
                <MuiLink underline="hover" color="#64748b" onClick={() => navigate('/')} sx={{ cursor: 'pointer', fontSize: 11.5, fontWeight: 500 }}>
                  Home
                </MuiLink>
                {pathnames.map((value, index) => {
                  const last = index === pathnames.length - 1
                  const to = `/${pathnames.slice(0, index + 1).join('/')}`

                  return last ? (
                    <Typography key={to} color="text.primary" sx={{ fontSize: 11.5, fontWeight: 600 }}>
                      {getBreadcrumbLabel(value)}
                    </Typography>
                  ) : (
                    <MuiLink key={to} underline="hover" color="#64748b" onClick={() => navigate(to)} sx={{ cursor: 'pointer', fontSize: 11.5, fontWeight: 500 }}>
                      {getBreadcrumbLabel(value)}
                    </MuiLink>
                  )
                })}
              </Breadcrumbs>
              <Typography variant="h6" fontWeight={800} color="#0f172a">
                {pageTitle}
              </Typography>
            </Toolbar>
          </AppBar>

          {/* Page content wrapper with consistent padding: 24px horiz, 32px vert */}
          <Box sx={{ px: 3, py: 4, flex: 1 }}>
            {children ?? <Outlet />}
          </Box>
        </Box>

      </Box>
    </ThemeProvider>
  )
}