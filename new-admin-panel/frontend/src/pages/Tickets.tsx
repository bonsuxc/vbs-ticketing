import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiFilter, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { ticketsAPI } from '@/lib/api';

type TicketStatus = 'used' | 'unused' | 'all';

interface Ticket {
  id: string;
  code: string;
  status: 'used' | 'unused';
  usedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const Tickets = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: tickets, isLoading, isError, refetch } = useQuery({
    queryKey: ['tickets', { status: statusFilter, search: searchTerm, page: currentPage }],
    queryFn: () => ticketsAPI.getAll({ 
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchTerm || undefined,
      page: currentPage,
      limit: itemsPerPage
    }),
    keepPreviousData: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handleStatusChange = (status: TicketStatus) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-600 bg-red-100 rounded-lg">
        Error loading tickets. Please try again.
        <button 
          onClick={() => refetch()}
          className="ml-4 px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col justify-between mb-6 space-y-4 md:flex-row md:items-center md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-800">Tickets</h1>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => refetch()}
            className="flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600">
            <FiDownload className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>

          <div className="flex items-center space-x-2">
            <FiFilter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleStatusChange('all')}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  statusFilter === 'all'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleStatusChange('unused')}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  statusFilter === 'unused'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unused
              </button>
              <button
                onClick={() => handleStatusChange('used')}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  statusFilter === 'used'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Used
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Ticket Code
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Created At
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets?.data?.map((ticket: Ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono text-sm font-medium text-gray-900">
                      {ticket.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                        ticket.status === 'used'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {ticket.status === 'used' ? 'Used' : 'Unused'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(ticket.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(ticket.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {tickets?.pagination?.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
            <div className="flex justify-between flex-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, tickets.pagination.totalPages) }, (_, i) => {
                  // Calculate page numbers to show (current page in the middle when possible)
                  let pageNum;
                  if (tickets.pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= tickets.pagination.totalPages - 2) {
                    pageNum = tickets.pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        currentPage === pageNum
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {tickets.pagination.totalPages > 5 && currentPage < tickets.pagination.totalPages - 2 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, tickets.pagination.totalPages))
                }
                disabled={currentPage === tickets.pagination.totalPages}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  currentPage === tickets.pagination.totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
