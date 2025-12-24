import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiCreditCard, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useAuth } from '@/context/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: IconType;
}

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: FiHome },
    { name: 'Tickets', href: '/tickets', icon: FiCreditCard },
    { name: 'Users', href: '/users', icon: FiUsers },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  return (
    <div className="hidden w-64 bg-white border-r border-gray-200 lg:flex lg:flex-col lg:fixed lg:inset-y-0">
      {/* Sidebar component, show/hide based on sidebar state. */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
          <h1 className="text-xl font-bold text-white">VBS Admin</h1>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1 bg-white">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {React.createElement(item.icon, {
                  className: `mr-3 h-6 w-6 ${
                    location.pathname === item.href
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`,
                  'aria-hidden': 'true'
                })}
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-left text-gray-700 rounded-md hover:bg-gray-100"
          >
            {React.createElement(FiLogOut, { className: 'w-5 h-5 mr-3 text-gray-500' })}
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar;
