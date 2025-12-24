import { Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout = () => {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header user={user} onLogout={logout} />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
