import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../lib/api';
import { FiUsers, FiDollarSign, FiCheckCircle } from 'react-icons/fi';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats().then((res) => res.data),
  });

  const stats = [
    {
      title: 'Total Tickets Sold',
      value: data?.totalTickets || 0,
      icon: <FiUsers className="h-6 w-6" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Revenue',
      value: `₵${Number(data?.totalRevenue || 0).toLocaleString()}`,
      icon: <FiDollarSign className="h-6 w-6" />,
      color: 'bg-green-500',
    },
    {
      title: 'Tickets Used',
      value: data?.ticketsUsed || 0,
      icon: <FiCheckCircle className="h-6 w-6" />,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

