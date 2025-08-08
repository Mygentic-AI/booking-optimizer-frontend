import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Booking, Client, Staff } from '@/lib/db';

export default function Calendar() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    staffId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'pending'
        })
      });

      if (response.ok) {
        await fetchData();
        handleCloseModal();
      } else {
        alert('Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      clientId: '',
      staffId: '',
      appointmentDate: '',
      appointmentTime: '',
      notes: ''
    });
  };

  const handleNewBooking = (date?: Date) => {
    const targetDate = date || new Date();
    setFormData({
      ...formData,
      appointmentDate: targetDate.toISOString().split('T')[0]
    });
    setShowAddModal(true);
  };

  const handleDayClick = (date: Date) => {
    const dayBookings = getDayBookings(date);
    setSelectedDayBookings(dayBookings);
    setSelectedDate(date);
    setShowDayModal(true);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.name || 'Unknown';
  };

  // Simple calendar grid generation
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getDayBookings = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.appointmentDate === dateStr);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedDate.getMonth();
  };

  return (
    <>
      <Head>
        <title>Calendar - Mygentic Clinic</title>
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
                <Link href="/dashboard" className="booking-nav-link">
                  Dashboard
                </Link>
                <Link href="/calendar" className="booking-nav-link active">
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
              <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
              <p className="text-gray-600">View and manage appointments</p>
            </div>
            <button 
              onClick={() => handleNewBooking()}
              className="btn-booking-primary"
            >
              ➕ New Booking
            </button>
          </div>

          {/* Calendar */}
          <div className="booking-card">
            <div className="booking-card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg m-0">
                  📅 {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigateMonth(-1)}
                    className="btn-booking-secondary"
                    style={{ padding: '0.25rem 0.75rem' }}
                  >
                    ←
                  </button>
                  <button 
                    onClick={() => setSelectedDate(new Date())}
                    className="btn-booking-secondary"
                    style={{ padding: '0.25rem 0.75rem' }}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => navigateMonth(1)}
                    className="btn-booking-secondary"
                    style={{ padding: '0.25rem 0.75rem' }}
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">
                  Loading calendar...
                </div>
              ) : (
                <div className="calendar-grid">
                  {/* Day headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-header">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {generateCalendarDays().map((date, index) => {
                    const dayBookings = getDayBookings(date);
                    const hasBookings = dayBookings.length > 0;
                    
                    return (
                      <div
                        key={index}
                        className={`calendar-day ${isCurrentMonth(date) ? '' : 'other-month'} ${isToday(date) ? 'today' : ''}`}
                        onClick={() => handleDayClick(date)}
                      >
                        <div className="day-number">{date.getDate()}</div>
                        {hasBookings && (
                          <div className="day-bookings">
                            {dayBookings
                              .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                              .slice(0, 3)
                              .map((booking, i) => (
                                <div key={i} className="booking-item">
                                  <div className="booking-line1">
                                    <span className="booking-time">{booking.appointmentTime}</span>
                                    <span className="booking-client">{getClientName(booking.clientId)}</span>
                                  </div>
                                  <div className="booking-line2">
                                    <span className="booking-staff">{getStaffName(booking.staffId)}</span>
                                  </div>
                                </div>
                              ))}
                            {dayBookings.length > 3 && (
                              <div className="booking-more">+{dayBookings.length - 3} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Day View Modal */}
        {showDayModal && (
          <div className="modal-backdrop" onClick={() => setShowDayModal(false)}>
            <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Day View - {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                <button onClick={() => setShowDayModal(false)} className="close-button">✕</button>
              </div>
              <div className="modal-body">
                <div className="day-grid">
                  <div className="time-column">
                    {/* Generate time slots from 7 AM to 9 PM */}
                    {Array.from({ length: 29 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 7;
                      const minute = i % 2 === 0 ? '00' : '30';
                      const displayHour = hour > 12 ? hour - 12 : hour;
                      const amPm = hour >= 12 ? 'PM' : 'AM';
                      return (
                        <div key={i} className="time-slot">
                          {displayHour}:{minute} {amPm}
                        </div>
                      );
                    })}
                  </div>
                  <div className="appointments-column">
                    {Array.from({ length: 29 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 7;
                      const minute = i % 2 === 0 ? '00' : '30';
                      const timeString = `${hour > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
                      
                      // Find appointments for this time slot
                      const slotAppointments = selectedDayBookings.filter(booking => {
                        const bookingTime = booking.appointmentTime.toUpperCase();
                        return bookingTime === timeString.toUpperCase();
                      });
                      
                      return (
                        <div key={i} className="appointment-slot">
                          {slotAppointments.length > 0 ? (
                            slotAppointments.map(booking => (
                              <div key={booking.id} className="day-view-appointment">
                                <div className="appointment-content">
                                  <strong>{getClientName(booking.clientId)}</strong>
                                  <span className="with-staff"> with {getStaffName(booking.staffId)}</span>
                                </div>
                                <span className={`badge-${booking.status}`}>{booking.status}</span>
                              </div>
                            ))
                          ) : (
                            <div 
                              className="empty-slot"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  appointmentDate: selectedDate.toISOString().split('T')[0],
                                  appointmentTime: timeString
                                });
                                setShowDayModal(false);
                                setShowAddModal(true);
                              }}
                            >
                              <span className="add-icon">+</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Booking Modal */}
        {showAddModal && (
          <div className="modal-backdrop" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>New Booking</h2>
                <button onClick={handleCloseModal} className="close-button">✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="booking-form-label">Client</label>
                    <select
                      className="booking-form-control"
                      value={formData.clientId}
                      onChange={e => setFormData({...formData, clientId: e.target.value})}
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="booking-form-label">Staff</label>
                    <select
                      className="booking-form-control"
                      value={formData.staffId}
                      onChange={e => setFormData({...formData, staffId: e.target.value})}
                      required
                    >
                      <option value="">Select a staff member</option>
                      {staff.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} - {member.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="booking-form-label">Date</label>
                    <input
                      type="date"
                      className="booking-form-control"
                      value={formData.appointmentDate}
                      onChange={e => setFormData({...formData, appointmentDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="booking-form-label">Time</label>
                    <input
                      type="text"
                      className="booking-form-control"
                      value={formData.appointmentTime}
                      onChange={e => setFormData({...formData, appointmentTime: e.target.value})}
                      required
                      placeholder="e.g., 10:00 AM"
                    />
                  </div>
                  <div className="form-group">
                    <label className="booking-form-label">Notes</label>
                    <textarea
                      className="booking-form-control"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      placeholder="Optional notes about the appointment"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={handleCloseModal} className="btn-booking-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-booking-primary">
                    Create Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .mt-8 {
          margin-top: 2rem;
        }
        .mb-8 {
          margin-bottom: 2rem;
        }
        .p-4 {
          padding: 1rem;
        }
        .py-8 {
          padding-top: 2rem;
          padding-bottom: 2rem;
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
        .mt-4 {
          margin-top: 1rem;
        }
        .w-full {
          width: 100%;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background-color: #e5e7eb;
          border: 1px solid #e5e7eb;
        }
        .calendar-header {
          background-color: #f3f4f6;
          padding: 0.5rem;
          text-align: center;
          font-weight: 600;
          color: #374151;
        }
        .calendar-day {
          background-color: white;
          min-height: 120px;
          padding: 0.5rem;
          cursor: pointer;
          position: relative;
          transition: background-color 0.2s;
          overflow: hidden;
        }
        .calendar-day:hover {
          background-color: #f9fafb;
        }
        .calendar-day.other-month {
          background-color: #f9fafb;
          color: #9ca3af;
        }
        .calendar-day.today {
          background-color: #fff5f5;
        }
        .day-number {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .day-bookings {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.75rem;
        }
        .booking-item {
          background: var(--light-primary);
          border-left: 3px solid var(--booking-primary);
          padding: 0.375rem 0.5rem;
          border-radius: 2px;
          margin-bottom: 0.25rem;
        }
        .booking-line1 {
          display: flex;
          gap: 0.375rem;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .booking-line2 {
          font-size: 0.7rem;
          color: #6b7280;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          padding-left: 0.125rem;
        }
        .booking-time {
          font-weight: 600;
          color: var(--booking-primary);
          flex-shrink: 0;
        }
        .booking-client {
          color: #374151;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .booking-staff {
          color: #6b7280;
        }
        .booking-more {
          font-size: 0.75rem;
          color: #6b7280;
          font-style: italic;
          margin-top: 0.25rem;
        }
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-wide {
          max-width: 800px;
        }
        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #1f2937;
        }
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .appointments-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .appointment-detail {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          align-items: center;
        }
        .appointment-detail:hover {
          background: #f3f4f6;
          border-color: var(--booking-primary);
        }
        .appointment-time {
          font-weight: bold;
          font-size: 1.125rem;
          color: var(--booking-primary);
        }
        .appointment-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .appointment-notes {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        .appointment-status {
          text-align: right;
        }
        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        .day-grid {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 0;
          max-height: 600px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .time-column {
          background: #f9fafb;
          border-right: 1px solid #e5e7eb;
        }
        .time-slot {
          min-height: 60px;
          padding: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 1rem;
        }
        .appointments-column {
          background: white;
        }
        .appointment-slot {
          min-height: 60px;
          border-bottom: 1px solid #e5e7eb;
          padding: 0.375rem;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .empty-slot {
          width: 100%;
          min-height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          border-radius: 4px;
        }
        .empty-slot:hover {
          background: #f3f4f6;
        }
        .empty-slot:hover .add-icon {
          opacity: 1;
        }
        .add-icon {
          font-size: 1.5rem;
          color: #d1d5db;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .day-view-appointment {
          background: var(--light-primary);
          border-left: 3px solid var(--booking-primary);
          border-radius: 4px;
          padding: 0.5rem 0.75rem;
          height: 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          box-sizing: border-box;
        }
        .day-view-appointment:hover {
          background: #fed7d7;
          transform: translateX(2px);
        }
        .appointment-content {
          display: flex;
          align-items: center;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .appointment-content strong {
          font-size: 0.875rem;
          color: #1f2937;
          margin-right: 0.25rem;
        }
        .with-staff {
          font-size: 0.875rem;
          color: #6b7280;
        }
      `}</style>
    </>
  );
}