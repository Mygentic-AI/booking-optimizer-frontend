import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid staff ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const staff = await db.getStaffMember(id);
        if (!staff) {
          return res.status(404).json({ error: 'Staff member not found' });
        }
        return res.status(200).json(staff);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch staff member' });
      }

    case 'PUT':
      try {
        const { name, title, specialty } = req.body;
        const staff = await db.updateStaff(id, { name, title, specialty });
        if (!staff) {
          return res.status(404).json({ error: 'Staff member not found' });
        }
        return res.status(200).json(staff);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to update staff member' });
      }

    case 'DELETE':
      try {
        const deleted = await db.deleteStaff(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Staff member not found' });
        }
        return res.status(204).end();
      } catch (error) {
        return res.status(500).json({ error: 'Failed to delete staff member' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}