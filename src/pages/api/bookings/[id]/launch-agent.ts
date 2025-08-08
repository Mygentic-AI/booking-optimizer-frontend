import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { generateRandomAlphanumeric } from '@/lib/util';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid booking ID' });
  }

  try {
    // Get booking with full details
    const bookingDetails = await db.getBookingWithDetails(id);
    
    if (!bookingDetails) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const { booking, client, staff } = bookingDetails;

    // Prepare context for the agent
    const agentContext = {
      clientName: client.name,
      staffName: staff.name,
      staffTitle: staff.title,
      appointmentDate: booking.appointmentDate,
      appointmentTime: booking.appointmentTime,
      appointmentNotes: booking.notes,
      bookingId: booking.id
    };

    // Generate a room name based on booking
    const roomName = `booking-${booking.id}-${generateRandomAlphanumeric(4)}`;

    // Return the context and room info
    // The frontend will use this to connect to LiveKit with the context
    return res.status(200).json({
      roomName,
      context: agentContext,
      booking: bookingDetails
    });

  } catch (error) {
    console.error('Error launching agent:', error);
    return res.status(500).json({ error: 'Failed to launch agent' });
  }
}