import dayjs from 'dayjs';

export const mockDashboardData = {
  totalRevenue: 12500,
  totalTickets: 248,
  paidTickets: 198,
  pendingPayments: 50,
  todaysPayments: 1250,
  todaysTickets: 12,
  upcomingEvents: 3,
  recentSales: [
    {
      id: 1,
      eventName: 'VBS 2025',
      customerName: 'John Doe',
      amount: 100,
      status: 'Paid',
      createdAt: dayjs().subtract(1, 'hour').toISOString(),
      ticketCount: 2
    },
    {
      id: 2,
      eventName: 'Youth Camp',
      customerName: 'Jane Smith',
      amount: 50,
      status: 'Paid',
      createdAt: dayjs().subtract(3, 'hour').toISOString(),
      ticketCount: 1
    },
    {
      id: 3,
      eventName: 'VBS 2025',
      customerName: 'Mike Johnson',
      amount: 150,
      status: 'Pending',
      createdAt: dayjs().subtract(5, 'hour').toISOString(),
      ticketCount: 3
    },
    {
      id: 4,
      eventName: 'Sunday Service',
      customerName: 'Sarah Williams',
      amount: 25,
      status: 'Paid',
      createdAt: dayjs().subtract(1, 'day').toISOString(),
      ticketCount: 1
    },
    {
      id: 5,
      eventName: 'VBS 2025',
      customerName: 'David Brown',
      amount: 75,
      status: 'Paid',
      createdAt: dayjs().subtract(2, 'day').toISOString(),
      ticketCount: 1
    },
  ],
  // Generate 30 days of sales data
  salesTrend: Array.from({ length: 30 }, (_, i) => ({
    date: dayjs().subtract(29 - i, 'day').format('MMM D'),
    amount: Math.floor(Math.random() * 1000) + 200,
    tickets: Math.floor(Math.random() * 10) + 1,
  })),
};

export const mockTickets = [
  {
    id: 1,
    ticketNumber: 'TKT-2025-001',
    customerName: 'John Doe',
    event: 'VBS 2025',
    type: 'Adult',
    price: 50,
    status: 'Paid',
    paymentMethod: 'Mobile Money',
    createdAt: '2025-12-15T10:30:00Z',
  },
  // Add more mock tickets as needed
];

export const mockPayments = [
  {
    id: 1,
    reference: 'PAY-001',
    amount: 100,
    status: 'Completed',
    method: 'Mobile Money',
    customerName: 'John Doe',
    ticketCount: 2,
    date: '2025-12-15T10:30:00Z',
  },
  // Add more mock payments as needed
];
