import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const staff = await db.getStaff();
        return res.status(200).json(staff);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch staff' });
      }

    case 'POST':
      try {
        const { name, title, specialty } = req.body;
        if (!name || !title || !specialty) {
          return res.status(400).json({ error: 'Name, title, and specialty are required' });
        }
        const staffMember = await db.createStaff({ name, title, specialty });
        return res.status(201).json(staffMember);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to create staff member' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}