import { FiMenu, FiBell, FiSearch } from 'react-icons/fi'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface HeaderProps {
  user: {
    name: string
    email: string
    avatar?: string
  } | null
  onLogout: () => void
}

const Header = ({ user, onLogout }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button
            type="button"
            className="p-2 -ml-1 text-gray-500 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <span className="sr-only">Open sidebar</span>
            <FiMenu className="w-6 h-6" aria-hidden="true" />
          </button>

          <div className="relative ml-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="w-full py-2 pl-10 pr-3 text-sm bg-gray-100 border-0 rounded-md focus:ring-2 focus:ring-primary-500 focus:bg-white sm:text-sm"
              placeholder="Search..."
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="p-1 text-gray-400 bg-white rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <span className="sr-only">View notifications</span>
            <FiBell className="w-6 h-6" aria-hidden="true" />
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="relative ml-3">
            <div>
              <Menu.Button className="flex items-center max-w-xs text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                <span className="sr-only">Open user menu</span>
                {user?.avatar ? (
                  <img
                    className="w-8 h-8 rounded-full"
                    src={user.avatar}
                    alt={user.name}
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 text-white bg-gray-500 rounded-full">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 w-48 py-1 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`block px-4 py-2 text-sm ${
                        active ? 'bg-gray-100' : ''
                      }`}
                    >
                      Your Profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`block px-4 py-2 text-sm ${
                        active ? 'bg-gray-100' : ''
                      }`}
                    >
                      Settings
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onLogout}
                      className={`block w-full px-4 py-2 text-sm text-left ${
                        active ? 'bg-gray-100' : ''
                      }`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}

export default Header
