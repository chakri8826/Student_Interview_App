import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setAuthToken } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { User, LogOut, CreditCard, FileText, Briefcase, Home } from 'lucide-react'

export function Navbar() {
  const navigate = useNavigate()

  const isAuthenticated = !!localStorage.getItem('access_token')
  const userName = localStorage.getItem('name') || 'User'

  const handleLogout = () => {
    setAuthToken(null)
    localStorage.removeItem('name')
    navigate('/login', { replace: true })
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Briefcase className="h-6 w-6" />
              <span className="font-bold text-xl">Interview Platform</span>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-6">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/roles"
                  className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Roles</span>
                </Link>
                <Link
                  to="/upload"
                  className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  <FileText className="h-4 w-4" />
                  <span>Upload CV</span>
                </Link>
                <Link
                  to="/wallet"
                  className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Wallet</span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{userName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
