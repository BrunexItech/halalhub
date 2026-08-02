const router = require('express').Router();
const { AccessToken } = require('livekit-server-sdk');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GENERATE LIVEKIT TOKEN
// ============================================================
router.post('/token', authenticate, async (req, res) => {
  try {
    const { roomName, userName } = req.body;
    const userId = req.user.id;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required'
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName || 'User',
      metadata: JSON.stringify({ userId, bookingId: roomName })
    });

    // Grant permissions to join the room
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.json({
      success: true,
      token,
      url: livekitUrl,
      roomName
    });

  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate video token'
    });
  }
});

module.exports = router;