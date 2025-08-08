import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Booking, Client, Staff } from '@/lib/db';

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [tomorrowCount, setTomorrowCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, clientsRes, staffRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/clients'),
        fetch('/api/staff')
      ]);

      const bookingsData = await bookingsRes.json();
      const clientsData = await clientsRes.json();
      const staffData = await staffRes.json();

      setBookings(bookingsData);
      setClients(clientsData);
      setStaff(staffData);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      setTodayCount(bookingsData.filter((b: Booking) => b.appointmentDate === today).length);
      setTomorrowCount(bookingsData.filter((b: Booking) => b.appointmentDate === tomorrow).length);
      setPendingCount(bookingsData.filter((b: Booking) => b.status === 'pending').length);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.name || 'Unknown';
  };

  const handleCallClick = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/launch-agent`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to launch agent');
      
      const data = await response.json();
      
      // Store booking context in sessionStorage
      sessionStorage.setItem('bookingContext', JSON.stringify(data.context));
      sessionStorage.setItem('bookingRoomName', data.roomName);
      
      // Navigate to the main page which has LiveKit integration
      router.push('/');
    } catch (error) {
      console.error('Error launching agent:', error);
      alert('Failed to launch agent');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'badge-confirmed';
      case 'pending': return 'badge-pending';
      case 'cancelled': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  };

  const todayBookings = bookings.filter(b => {
    const today = new Date().toISOString().split('T')[0];
    return b.appointmentDate === today;
  });

  return (
    <>
      <Head>
        <title>Dashboard - Mygentic Clinic</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="booking-nav">
          <div className="booking-container">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="booking-nav-brand flex items-center gap-2">
                <span>🤖</span> Mygentic Clinic
              </Link>
              <div className="flex gap-4">
                <Link href="/dashboard" className="booking-nav-link active">
                  Dashboard
                </Link>
                <Link href="/calendar" className="booking-nav-link">
                  Calendar
                </Link>
                <Link href="/clients" className="booking-nav-link">
                  Clients
                </Link>
                <Link href="/staff" className="booking-nav-link">
                  Staff
                </Link>
                <Link href="/" className="booking-nav-link">
                  Doctor Visit
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="booking-container mt-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600">Smart Appointment Management with AI Voice Calling</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="booking-grid booking-grid-cols-4 mb-8">
            <div className="stat-card">
              <div className="stat-number">{todayCount}</div>
              <div className="stat-label">Today's Appointments</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{tomorrowCount}</div>
              <div className="stat-label">Tomorrow's Appointments</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{pendingCount}</div>
              <div className="stat-label">Pending Confirmations</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0</div>
              <div className="stat-label">Active Calls</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Appointments Table */}
            <div className="lg:col-span-2">
              <div className="booking-card">
                <div className="booking-card-header">
                  <h3 className="text-lg m-0">📅 Today's Appointments</h3>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="text-center text-gray-500 py-8">
                      Loading appointments...
                    </div>
                  ) : todayBookings.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No appointments scheduled for today
                    </div>
                  ) : (
                    <table className="booking-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Client</th>
                          <th>Staff</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayBookings.map(booking => (
                          <tr key={booking.id}>
                            <td>{booking.appointmentTime}</td>
                            <td>{getClientName(booking.clientId)}</td>
                            <td>{getStaffName(booking.staffId)}</td>
                            <td>
                              <span className={getStatusBadgeClass(booking.status)}>
                                {booking.status}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleCallClick(booking.id)}
                                className="btn-booking-primary"
                                style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                              >
                                📞 Call
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Recent Calls */}
              <div className="booking-card">
                <div className="booking-card-header">
                  <h3 className="text-lg m-0">📞 Recent Calls</h3>
                </div>
                <div className="p-4">
                  <div className="text-center text-gray-500 py-4">
                    <p>No recent calls</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="booking-card">
                <div className="booking-card-header">
                  <h3 className="text-lg m-0">⚡ Quick Actions</h3>
                </div>
                <div className="p-4 space-y-2">
                  <Link href="/calendar" className="btn-booking-primary w-full text-center">
                    ➕ Book New Appointment
                  </Link>
                  <button className="btn-booking-secondary w-full">
                    🚶 Add Walk-in Request
                  </button>
                  <button className="btn-booking-secondary w-full">
                    📊 View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .space-y-2 > * + * {
          margin-top: 0.5rem;
        }
        .space-y-4 > * + * {
          margin-top: 1rem;
        }
        .mt-8 {
          margin-top: 2rem;
        }
        .mb-8 {
          margin-bottom: 2rem;
        }
        .p-4 {
          padding: 1rem;
        }
        .py-4 {
          padding-top: 1rem;
          padding-bottom: 1rem;
        }
        .py-8 {
          padding-top: 2rem;
          padding-bottom: 2rem;
        }
        .w-full {
          width: 100%;
        }
        .text-center {
          text-align: center;
        }
        .text-lg {
          font-size: 1.125rem;
        }
        .text-3xl {
          font-size: 1.875rem;
        }
        .font-bold {
          font-weight: bold;
        }
        .text-gray-500 {
          color: #6b7280;
        }
        .text-gray-600 {
          color: #4b5563;
        }
        .text-gray-800 {
          color: #1f2937;
        }
        .m-0 {
          margin: 0;
        }
        .flex {
          display: flex;
        }
        .items-center {
          align-items: center;
        }
        .justify-between {
          justify-content: space-between;
        }
        .gap-2 {
          gap: 0.5rem;
        }
        .gap-4 {
          gap: 1rem;
        }
        .gap-6 {
          gap: 1.5rem;
        }
        .grid {
          display: grid;
        }
        .grid-cols-1 {
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        @media (min-width: 1024px) {
          .lg\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .lg\\:col-span-2 {
            grid-column: span 2 / span 2;
          }
        }
      `}</style>
    </>
  );
}