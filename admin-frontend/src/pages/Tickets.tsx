import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsAPI } from '../lib/api';
import dayjs from 'dayjs';
import { FiSearch, FiDownload, FiCheck, FiX } from 'react-icons/fi';

interface Ticket {
  id: string;
  name: string;
  phone: string;
  email: string;
  ticket_type: string;
  reference_code: string;
  used: boolean;
  created_at: string;
}

export function TicketsPage() {
  const [search, setSearch] = useState('');
  const [usedFilter, setUsedFilter] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', { search, used: usedFilter }],
    queryFn: () =>
      ticketsAPI.getAll({ search, used: usedFilter ?? undefined }).then((res) => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, used }: { id: string; used: boolean }) =>
      ticketsAPI.updateStatus(id, used),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const handleExport = async (type: 'names' | 'phones' | 'csv') => {
    try {
      if (type === 'csv') {
        const response = await ticketsAPI.exportCSV();
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `tickets-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const response = await ticketsAPI.exportNames();
        const data = response.data;
        const content = type === 'names' 
          ? data.map((t: Ticket) => t.name).join('\n')
          : data.map((t: Ticket) => t.phone).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}-${Date.now()}.txt`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const toggleUsed = (ticket: Ticket) => {
    if (confirm(`Mark ticket ${ticket.reference_code} as ${ticket.used ? 'unused' : 'used'}?`)) {
      updateStatusMutation.mutate({ id: ticket.id, used: !ticket.used });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport('names')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <FiDownload className="inline mr-2" />
            Export Names
          </button>
          <button
            onClick={() => handleExport('phones')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <FiDownload className="inline mr-2" />
            Export Phones
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            <FiDownload className="inline mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or reference code..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setUsedFilter(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              usedFilter === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setUsedFilter(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              usedFilter === false
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unused
          </button>
          <button
            onClick={() => setUsedFilter(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              usedFilter === true
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Used
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : !data?.tickets || data.tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No tickets found
                  </td>
                </tr>
              ) : (
                data.tickets.map((ticket: Ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ticket.reference_code}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.phone}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {ticket.ticket_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          ticket.used
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {ticket.used ? 'Used' : 'Unused'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dayjs(ticket.created_at).format('MMM D, YYYY')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleUsed(ticket)}
                        disabled={updateStatusMutation.isPending}
                        className={`p-2 rounded-lg ${
                          ticket.used
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                        title={ticket.used ? 'Mark as unused' : 'Mark as used'}
                      >
                        {ticket.used ? <FiX className="h-4 w-4" /> : <FiCheck className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

