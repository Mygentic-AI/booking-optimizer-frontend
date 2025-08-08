import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const bookings = await db.getBookings();
        return res.status(200).json(bookings);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch bookings' });
      }

    case 'POST':
      try {
        const { clientId, staffId, appointmentDate, appointmentTime, status, notes } = req.body;
        if (!clientId || !staffId || !appointmentDate || !appointmentTime) {
          return res.status(400).json({ 
            error: 'clientId, staffId, appointmentDate, and appointmentTime are required' 
          });
        }
        
        const booking = await db.createBooking({ 
          clientId, 
          staffId, 
          appointmentDate, 
          appointmentTime, 
          status: status || 'pending',
          notes: notes || ''
        });
        
        return res.status(201).json(booking);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to create booking' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}