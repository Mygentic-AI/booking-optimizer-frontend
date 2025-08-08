import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const clients = await db.getClients();
        return res.status(200).json(clients);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch clients' });
      }

    case 'POST':
      try {
        const { name, phone, email } = req.body;
        if (!name || !phone || !email) {
          return res.status(400).json({ error: 'Name, phone, and email are required' });
        }
        const client = await db.createClient({ name, phone, email });
        return res.status(201).json(client);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to create client' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}