import { NextApiRequest, NextApiResponse } from "next";
import { generateRandomAlphanumeric } from "@/lib/util";
import { TokenResult } from "../../lib/types";
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if we should use local token generation
  const useLocalToken = process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET;
  
  if (useLocalToken) {
    // Generate token locally using LiveKit SDK
    try {
      const { userEmail, fullName, userId } = req.body;
      if (!userEmail || !userId || !fullName) {
        return res.status(400).json({ error: 'Missing required user information' });
      }

      const apiKey = process.env.LIVEKIT_API_KEY!;
      const apiSecret = process.env.LIVEKIT_API_SECRET!;
      
      // Create access token
      const AccessToken = require('livekit-server-sdk').AccessToken;
      const at = new AccessToken(apiKey, apiSecret, {
        identity: fullName,
        metadata: JSON.stringify({ userEmail, fullName, userId, identity: fullName })
      });
      
      // Generate room name from email
      const roomName = `${userEmail}-${generateRandomAlphanumeric(4)}`;
      
      // Add grants
      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canUpdateOwnMetadata: true
      });
      
      const token = await at.toJwt();
      return res.status(200).json({ token });
    } catch (error) {
      console.error('Local token generation error:', error);
      return res.status(500).json({ error: 'Failed to generate token' });
    }
  }

  // Fallback to external token server
  const tokenServerUrl = process.env.TOKEN_SERVER_URL;
  if (!tokenServerUrl) {
    return res.status(500).json({ error: 'Token server URL not configured' });
  }

  try {
    // Forward the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Validate request body
    const { userEmail, fullName, userId } = req.body;
    if (!userEmail || !userId || !fullName) {
      return res.status(400).json({ error: 'Missing required user information. userEmail, fullName, and userId are required.' });
    }

    // Forward the request to the token server with just the user information
    const response = await fetch(`${tokenServerUrl}/createToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        userEmail,
        fullName,
        userId
      })
    });

    if (!response.ok) {
      // Forward the error status and message
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    // Get and validate the token response
    const rawToken = await response.text();
    console.log('Token server response:', { 
      status: response.status,
      hasToken: !!rawToken,
      requestBody: {
        userEmail,
        fullName,
        userId
      }
    });

    try {
      // Try parsing as JSON first
      let token;
      try {
        const parsed = JSON.parse(rawToken);
        token = parsed.token || parsed;
      } catch {
        // If not JSON, use as-is
        token = rawToken;
      }

      // Forward the token response
      return res.status(200).json({ token });
    } catch (error) {
      console.error('Token parsing error:', error);
      return res.status(500).json({ 
        error: 'Invalid token format from server',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Token server error:', error);
    return res.status(500).json({ 
      error: 'Failed to get token from server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}