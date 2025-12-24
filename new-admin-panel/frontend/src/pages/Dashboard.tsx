import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '@/lib/api'
import { FiUsers, FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi'

const Dashboard = () => {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats(),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-red-500">Failed to load dashboard data. Please try again later.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your ticket sales and events
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Tickets Card */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-50">
              <FiUsers className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalTickets || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats?.totalRevenue?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Events Card */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-50">
              <FiClock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.upcomingEvents || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Events Card */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50">
              <FiCheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Events</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.completedEvents || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <div className="mt-4 overflow-hidden bg-white shadow sm:rounded-lg">
          {stats?.recentActivity?.length ? (
            <ul className="divide-y divide-gray-200">
              {stats.recentActivity.map((activity: any) => (
                <li key={activity.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary-600 truncate">
                      {activity.message}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {activity.type}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {activity.user}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-12 text-center text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
