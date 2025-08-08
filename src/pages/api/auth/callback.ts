import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    
    // For PKCE flow, we need to pass both code and code_verifier
    const { code, error, error_description } = req.query;

    // If there's an error in the auth callback
    if (error) {
      console.error('Auth callback error:', error, error_description);
      return res.redirect(`${origin}/?error=${error}&message=${error_description}`);
    }

    // If no code is present, redirect with error
    if (!code) {
      console.error('No code present in callback');
      return res.redirect(`${origin}/?error=no_code&message=No authorization code present`);
    }

    // Redirect to app page with the code
    // The actual code exchange will happen client-side where we have access to the code verifier
    return res.redirect(`${origin}/app?code=${code}`);
  } catch (error) {
    console.error('Unexpected error in callback:', error);
    const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    return res.redirect(`${origin}/?error=unexpected&message=${encodeURIComponent(String(error))}`);
  }
} 