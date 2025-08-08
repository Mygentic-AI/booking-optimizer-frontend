import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid client ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const client = await db.getClient(id);
        if (!client) {
          return res.status(404).json({ error: 'Client not found' });
        }
        return res.status(200).json(client);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch client' });
      }

    case 'PUT':
      try {
        const { name, phone, email } = req.body;
        const client = await db.updateClient(id, { name, phone, email });
        if (!client) {
          return res.status(404).json({ error: 'Client not found' });
        }
        return res.status(200).json(client);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to update client' });
      }

    case 'DELETE':
      try {
        const deleted = await db.deleteClient(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Client not found' });
        }
        return res.status(204).end();
      } catch (error) {
        return res.status(500).json({ error: 'Failed to delete client' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}