import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Staff } from '@/lib/db';

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    specialty: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingStaff 
        ? `/api/staff/${editingStaff.id}`
        : '/api/staff';
      
      const method = editingStaff ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchStaff();
        handleCloseModal();
      } else {
        alert('Failed to save staff member');
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('Failed to save staff member');
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      title: staffMember.title,
      specialty: staffMember.specialty
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchStaff();
      } else {
        alert('Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingStaff(null);
    setFormData({ name: '', title: '', specialty: '' });
  };

  return (
    <>
      <Head>
        <title>Staff - Mygentic Clinic</title>
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
                <Link href="/clients" className="booking-nav-link">
                  Clients
                </Link>
                <Link href="/staff" className="booking-nav-link active">
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
              <h1 className="text-3xl font-bold text-gray-800">Staff</h1>
              <p className="text-gray-600">Manage your staff members</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-booking-primary"
            >
              ➕ Add New Staff
            </button>
          </div>

          {/* Staff Table */}
          <div className="booking-card">
            <div className="booking-card-header">
              <h3 className="text-lg m-0">👨‍⚕️ Staff List</h3>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">
                  Loading staff...
                </div>
              ) : staff.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No staff members found. Add your first staff member!
                </div>
              ) : (
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Specialty</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(member => (
                      <tr key={member.id}>
                        <td>{member.name}</td>
                        <td>{member.title}</td>
                        <td>{member.specialty}</td>
                        <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(member)}
                              className="btn-booking-secondary"
                              style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
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
                <h2>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
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
                      placeholder="e.g., Dr. Emily Davis"
                    />
                  </div>
                  <div className="form-group">
                    <label className="booking-form-label">Title</label>
                    <input
                      type="text"
                      className="booking-form-control"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      required
                      placeholder="e.g., General Practitioner"
                    />
                  </div>
                  <div className="form-group">
                    <label className="booking-form-label">Specialty</label>
                    <input
                      type="text"
                      className="booking-form-control"
                      value={formData.specialty}
                      onChange={e => setFormData({...formData, specialty: e.target.value})}
                      required
                      placeholder="e.g., Family Medicine"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={handleCloseModal} className="btn-booking-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-booking-primary">
                    {editingStaff ? 'Update' : 'Add'} Staff Member
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