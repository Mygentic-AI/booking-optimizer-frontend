import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Client } from '@/lib/db';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingClient 
        ? `/api/clients/${editingClient.id}`
        : '/api/clients';
      
      const method = editingClient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchClients();
        handleCloseModal();
      } else {
        alert('Failed to save client');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchClients();
      } else {
        alert('Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingClient(null);
    setFormData({ name: '', phone: '', email: '' });
  };

  return (
    <>
      <Head>
        <title>Clients - Mygentic Clinic</title>
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
                <Link href="/calendar" className="booking-nav-link">
                  Calendar
                </Link>
                <Link href="/clients" className="booking-nav-link active">
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
              <h1 className="text-3xl font-bold text-gray-800">Clients</h1>
              <p className="text-gray-600">Manage your client database</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-booking-primary"
            >
              ➕ Add New Client
            </button>
          </div>

          {/* Clients Table */}
          <div className="booking-card">
            <div className="booking-card-header">
              <h3 className="text-lg m-0">👥 Client List</h3>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">
                  Loading clients...
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No clients found. Add your first client!
                </div>
              ) : (
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id}>
                        <td>{client.name}</td>
                        <td>{client.phone}</td>
                        <td>{client.email}</td>
                        <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(client)}
                              className="btn-booking-secondary"
                              style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="btn-booking-secondary"
                              style={{ 
                                fontSize: '0.875rem', 
                                padding: '0.25rem 0.75rem',
                                borderColor: '#dc3545',
                                color: '#dc3545'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="modal-backdrop" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                <button onClick={handleCloseModal} className="close-button">✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="booking-form-label">Name</label>
                    <input
                      type="text"
                      className="booking-form-control"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="e.g., Mr. John Smith"
                    />
                  </div>
                  <div className="form-group">
                    <label className="booking-form-label">Phone</label>
                    <input
                      type="tel"
                      className="booking-form-control"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      required
                      placeholder="e.g., +1234567890"
                    />
                  </div>
                  <div className="form-group">
                    <label className="booking-form-label">Email</label>
                    <input
                      type="email"
                      className="booking-form-control"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      required
                      placeholder="e.g., john.smith@example.com"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={handleCloseModal} className="btn-booking-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-booking-primary">
                    {editingClient ? 'Update' : 'Add'} Client
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
        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
      `}</style>
    </>
  );
}