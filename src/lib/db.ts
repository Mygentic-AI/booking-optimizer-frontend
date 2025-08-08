import fs from 'fs/promises';
import path from 'path';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  specialty: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  clientId: string;
  staffId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  createdAt: string;
}

export interface Database {
  clients: Client[];
  staff: Staff[];
  bookings: Booking[];
}

class JsonDatabase {
  private dbPath: string;
  private data: Database | null = null;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'db.json');
  }

  private async load(): Promise<Database> {
    if (!this.data) {
      try {
        const content = await fs.readFile(this.dbPath, 'utf-8');
        this.data = JSON.parse(content);
      } catch (error) {
        // If file doesn't exist, create with empty structure
        this.data = {
          clients: [],
          staff: [],
          bookings: []
        };
        await this.save();
      }
    }
    return this.data!;
  }

  private async save(): Promise<void> {
    if (this.data) {
      await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    const data = await this.load();
    return data.clients;
  }

  async getClient(id: string): Promise<Client | undefined> {
    const data = await this.load();
    return data.clients.find(c => c.id === id);
  }

  async createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const data = await this.load();
    const newClient: Client = {
      ...client,
      id: this.generateId('client'),
      createdAt: new Date().toISOString()
    };
    data.clients.push(newClient);
    await this.save();
    return newClient;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    const data = await this.load();
    const index = data.clients.findIndex(c => c.id === id);
    if (index !== -1) {
      data.clients[index] = { ...data.clients[index], ...updates };
      await this.save();
      return data.clients[index];
    }
    return undefined;
  }

  async deleteClient(id: string): Promise<boolean> {
    const data = await this.load();
    const index = data.clients.findIndex(c => c.id === id);
    if (index !== -1) {
      data.clients.splice(index, 1);
      await this.save();
      return true;
    }
    return false;
  }

  // Staff operations
  async getStaff(): Promise<Staff[]> {
    const data = await this.load();
    return data.staff;
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    const data = await this.load();
    return data.staff.find(s => s.id === id);
  }

  async createStaff(staff: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff> {
    const data = await this.load();
    const newStaff: Staff = {
      ...staff,
      id: this.generateId('staff'),
      createdAt: new Date().toISOString()
    };
    data.staff.push(newStaff);
    await this.save();
    return newStaff;
  }

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff | undefined> {
    const data = await this.load();
    const index = data.staff.findIndex(s => s.id === id);
    if (index !== -1) {
      data.staff[index] = { ...data.staff[index], ...updates };
      await this.save();
      return data.staff[index];
    }
    return undefined;
  }

  async deleteStaff(id: string): Promise<boolean> {
    const data = await this.load();
    const index = data.staff.findIndex(s => s.id === id);
    if (index !== -1) {
      data.staff.splice(index, 1);
      await this.save();
      return true;
    }
    return false;
  }

  // Booking operations
  async getBookings(): Promise<Booking[]> {
    const data = await this.load();
    return data.bookings;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const data = await this.load();
    return data.bookings.find(b => b.id === id);
  }

  async getBookingWithDetails(id: string): Promise<{
    booking: Booking;
    client: Client;
    staff: Staff;
  } | undefined> {
    const data = await this.load();
    const booking = data.bookings.find(b => b.id === id);
    if (!booking) return undefined;

    const client = data.clients.find(c => c.id === booking.clientId);
    const staff = data.staff.find(s => s.id === booking.staffId);

    if (!client || !staff) return undefined;

    return { booking, client, staff };
  }

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const data = await this.load();
    const newBooking: Booking = {
      ...booking,
      id: this.generateId('booking'),
      createdAt: new Date().toISOString()
    };
    data.bookings.push(newBooking);
    await this.save();
    return newBooking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const data = await this.load();
    const index = data.bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      data.bookings[index] = { ...data.bookings[index], ...updates };
      await this.save();
      return data.bookings[index];
    }
    return undefined;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const data = await this.load();
    const index = data.bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      data.bookings.splice(index, 1);
      await this.save();
      return true;
    }
    return false;
  }

  // Utility methods
  async getBookingsForDate(date: string): Promise<Booking[]> {
    const data = await this.load();
    return data.bookings.filter(b => b.appointmentDate === date);
  }

  async getBookingsForClient(clientId: string): Promise<Booking[]> {
    const data = await this.load();
    return data.bookings.filter(b => b.clientId === clientId);
  }

  async getBookingsForStaff(staffId: string): Promise<Booking[]> {
    const data = await this.load();
    return data.bookings.filter(b => b.staffId === staffId);
  }
}

// Export singleton instance
export const db = new JsonDatabase();