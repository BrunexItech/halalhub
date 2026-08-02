const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Client } = require('pg');
const crypto = require('crypto');

// Database connection
let client;

async function getClient() {
  if (!client) {
    client = new Client({
      user: process.env.DB_USER || 'halalhub_user',
      password: process.env.DB_PASSWORD || '@halalhub@#',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'halalhub'
    });
    await client.connect();
  }
  return client;
}

// ============================================================
// 1. GET ALL BOOKINGS (Authenticated)
// - For clients: returns bookings they made
// - For kadhis: returns bookings assigned to them
// ============================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status;

    // First, check if the user is a kadhi
    const kadhiCheck = await db.query(
      'SELECT id FROM kadhis WHERE user_id = $1',
      [userId]
    );

    let query = `
      SELECT 
        cb.id,
        cb.user_id,
        cb.booking_date,
        cb.booking_time,
        cb.type,
        cb.topic,
        cb.notes,
        cb.status,
        cb.room_name,
        cb.user_name,
        cb.user_email,
        cb.createdat,
        cb.updatedat,
        cb.accepted_at,
        k.id as kadhi_id,
        k.user_id as kadhi_user_id,
        k.name as kadhi_name,
        k.type as kadhi_type,
        k.county as kadhi_county,
        k.rating as kadhi_rating,
        k.verified as kadhi_verified
      FROM consultation_bookings cb
      JOIN kadhis k ON cb.kadhi_id = k.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // If user is a kadhi, show bookings assigned to them
    if (kadhiCheck.rows.length > 0) {
      const kadhiId = kadhiCheck.rows[0].id;
      query += ` AND cb.kadhi_id = $${paramIndex}`;
      params.push(kadhiId);
      paramIndex++;
    } else {
      // Otherwise, show bookings made by the user
      query += ` AND cb.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (status) {
      query += ` AND cb.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY cb.booking_date DESC, cb.booking_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total FROM consultation_bookings cb
      WHERE 1=1
    `;
    const countParams = [];
    let countIndex = 1;

    if (kadhiCheck.rows.length > 0) {
      const kadhiId = kadhiCheck.rows[0].id;
      countQuery += ` AND cb.kadhi_id = $${countIndex}`;
      countParams.push(kadhiId);
      countIndex++;
    } else {
      countQuery += ` AND cb.user_id = $${countIndex}`;
      countParams.push(userId);
      countIndex++;
    }

    if (status) {
      countQuery += ` AND cb.status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      bookings: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: limit,
      offset: offset
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// ============================================================
// 2. GET BOOKING BY ID (Authenticated)
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT 
        cb.id,
        cb.user_id,
        cb.booking_date,
        cb.booking_time,
        cb.type,
        cb.topic,
        cb.notes,
        cb.status,
        cb.room_name,
        cb.user_name,
        cb.user_email,
        cb.createdat,
        cb.updatedat,
        cb.accepted_at,
        k.id as kadhi_id,
        k.user_id as kadhi_user_id,
        k.name as kadhi_name,
        k.type as kadhi_type,
        k.county as kadhi_county,
        k.fee as kadhi_fee,
        k.rating as kadhi_rating,
        k.reviews as kadhi_reviews,
        k.experience as kadhi_experience,
        k.bio as kadhi_bio,
        k.languages as kadhi_languages,
        k.verified as kadhi_verified,
        k.institution as kadhi_institution
      FROM consultation_bookings cb
      JOIN kadhis k ON cb.kadhi_id = k.id
      WHERE cb.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const booking = result.rows[0];

    // Verify user has access (either they booked it or they are the kadhi)
    const isClient = booking.user_id === userId;
    const isKadhi = booking.kadhi_user_id === userId;

    if (!isKadhi && !isClient) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this booking'
      });
    }

    res.json({
      success: true,
      booking: booking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

// ============================================================
// 3. CREATE BOOKING (Authenticated - Client only)
// ============================================================
router.post('/', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      kadhiId,
      bookingDate,
      bookingTime,
      type = 'video',
      topic,
      notes,
      userName,
      userEmail
    } = req.body;

    if (!kadhiId || !bookingDate || !bookingTime || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Kadhi, date, time, and topic are required'
      });
    }

    // Check if kadhi exists and is available
    const kadhiCheck = await db.query(
      'SELECT id, name, available FROM kadhis WHERE id = $1',
      [kadhiId]
    );

    if (kadhiCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Kadhi not found'
      });
    }

    if (!kadhiCheck.rows[0].available) {
      return res.status(400).json({
        success: false,
        error: 'This kadhi is currently not available'
      });
    }

    // ============================================================
    // DUPLICATE BOOKING CHECK
    // Check if this kadhi already has a booking at this date and time
    // ============================================================
    const duplicateCheck = await db.query(
      `SELECT id, status FROM consultation_bookings 
       WHERE kadhi_id = $1 
       AND booking_date = $2 
       AND booking_time = $3 
       AND status != 'cancelled' 
       AND status != 'completed'`,
      [kadhiId, bookingDate, bookingTime]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked. Please select a different time.'
      });
    }

    // Generate unique room name for video calls
    const roomName = `halalhub-kadhi-${kadhiId}-${Date.now().toString(36)}`;
    
    const bookingId = 'bkg-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

    await db.query(
      `INSERT INTO consultation_bookings (
        id, user_id, kadhi_id, booking_date, booking_time, type, 
        topic, notes, status, room_name, user_name, user_email,
        createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [
        bookingId,
        userId,
        kadhiId,
        bookingDate,
        bookingTime,
        type,
        topic,
        notes || null,
        'pending',
        type === 'video' ? roomName : null,
        userName || null,
        userEmail || null
      ]
    );

    // Create notification for the kadhi
    const kadhiUserId = await db.query(
      'SELECT user_id FROM kadhis WHERE id = $1',
      [kadhiId]
    );

    if (kadhiUserId.rows.length > 0) {
      const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await db.query(
        `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          notificationId,
          kadhiUserId.rows[0].user_id,
          'New Consultation Booking',
          `A new consultation has been booked with you for ${bookingDate} at ${bookingTime}. Please accept or reject.`,
          'booking',
          `/kadhi-dashboard`
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Consultation booked successfully',
      data: {
        id: bookingId,
        kadhiName: kadhiCheck.rows[0].name,
        bookingDate: bookingDate,
        bookingTime: bookingTime,
        type: type,
        roomName: type === 'video' ? roomName : null,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

// ============================================================
// 4. UPDATE BOOKING (Authenticated - Client or Kadhi)
// ============================================================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;
    const {
      bookingDate,
      bookingTime,
      type,
      topic,
      notes,
      status
    } = req.body;

    // Check if booking exists and get current status
    const checkResult = await db.query(
      'SELECT cb.*, k.user_id as kadhi_user_id FROM consultation_bookings cb JOIN kadhis k ON cb.kadhi_id = k.id WHERE cb.id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const booking = checkResult.rows[0];
    const isKadhi = booking.kadhi_user_id === userId;
    const isClient = booking.user_id === userId;

    if (!isKadhi && !isClient) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this booking'
      });
    }

    // If kadhi is updating status
    if (isKadhi && status) {
      // Only allow specific status changes
      const validStatuses = ['confirmed', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Allowed: confirmed, cancelled, completed'
        });
      }

      // If confirming, set accepted_at
      if (status === 'confirmed') {
        await db.query(
          `UPDATE consultation_bookings 
           SET status = $1, accepted_at = NOW(), updatedat = NOW() 
           WHERE id = $2`,
          [status, id]
        );
      } else {
        await db.query(
          `UPDATE consultation_bookings 
           SET status = $1, updatedat = NOW() 
           WHERE id = $2`,
          [status, id]
        );
      }

      // Create notification for client
      const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await db.query(
        `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          notificationId,
          booking.user_id,
          status === 'confirmed' ? 'Consultation Confirmed' : status === 'cancelled' ? 'Consultation Cancelled' : 'Consultation Completed',
          status === 'confirmed' 
            ? `Your consultation has been confirmed. You can now join the video call.`
            : status === 'cancelled' 
              ? `Your consultation has been cancelled. Please contact the kadhi for more information.`
              : `Your consultation has been marked as completed. Thank you for using HalalHub.`,
          'booking',
          `/kadhis`
        ]
      );

      res.json({
        success: true,
        message: `Booking ${status} successfully`
      });
      return;
    }

    // Client can only update notes and topic (not status)
    if (isClient) {
      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (bookingDate !== undefined) {
        updates.push(`booking_date = $${paramIndex++}`);
        params.push(bookingDate);
      }
      if (bookingTime !== undefined) {
        updates.push(`booking_time = $${paramIndex++}`);
        params.push(bookingTime);
      }
      if (type !== undefined) {
        updates.push(`type = $${paramIndex++}`);
        params.push(type);
      }
      if (topic !== undefined) {
        updates.push(`topic = $${paramIndex++}`);
        params.push(topic);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        params.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      updates.push(`updatedat = NOW()`);
      params.push(id);
      params.push(userId);

      await db.query(
        `UPDATE consultation_bookings SET ${updates.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
        params
      );

      res.json({
        success: true,
        message: 'Booking updated successfully'
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: 'Unable to update booking'
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking'
    });
  }
});

// ============================================================
// 5. CANCEL BOOKING (Authenticated - Client only)
// ============================================================
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;

    // Check if booking exists and belongs to user
    const checkResult = await db.query(
      'SELECT cb.*, k.user_id as kadhi_user_id FROM consultation_bookings cb JOIN kadhis k ON cb.kadhi_id = k.id WHERE cb.id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const booking = checkResult.rows[0];
    const isClient = booking.user_id === userId;

    if (!isClient) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to cancel this booking'
      });
    }

    await db.query(
      `UPDATE consultation_bookings 
       SET status = 'cancelled', updatedat = NOW() 
       WHERE id = $1`,
      [id]
    );

    // Create notification for kadhi
    const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        notificationId,
        booking.kadhi_user_id,
        'Consultation Cancelled by Client',
        `A consultation has been cancelled by the client.`,
        'booking',
        `/kadhi-dashboard`
      ]
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking'
    });
  }
});

// ============================================================
// 6. GET BOOKING BY ROOM NAME (Authenticated)
// ============================================================
router.get('/room/:roomName', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { roomName } = req.params;

    const result = await db.query(
      `
      SELECT 
        cb.id,
        cb.user_id,
        cb.booking_date,
        cb.booking_time,
        cb.type,
        cb.topic,
        cb.status,
        cb.room_name,
        cb.user_name,
        cb.user_email,
        k.id as kadhi_id,
        k.user_id as kadhi_user_id,
        k.name as kadhi_name,
        k.type as kadhi_type,
        k.county as kadhi_county
      FROM consultation_bookings cb
      JOIN kadhis k ON cb.kadhi_id = k.id
      WHERE cb.room_name = $1
      `,
      [roomName]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const booking = result.rows[0];
    const isKadhi = booking.kadhi_user_id === userId;
    const isClient = booking.user_id === userId;

    if (!isKadhi && !isClient) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this booking'
      });
    }

    res.json({
      success: true,
      booking: booking
    });

  } catch (error) {
    console.error('Error fetching booking by room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

// ============================================================
// 7. GET BOOKING STATS (Authenticated - Kadhi only)
// ============================================================
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    // Check if user is a kadhi
    const kadhiCheck = await db.query(
      'SELECT id FROM kadhis WHERE user_id = $1',
      [userId]
    );

    let result;
    if (kadhiCheck.rows.length > 0) {
      const kadhiId = kadhiCheck.rows[0].id;
      result = await db.query(
        `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM consultation_bookings
        WHERE kadhi_id = $1
        `,
        [kadhiId]
      );
    } else {
      result = await db.query(
        `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM consultation_bookings
        WHERE user_id = $1
        `,
        [userId]
      );
    }

    res.json({
      success: true,
      stats: {
        total: parseInt(result.rows[0].total_bookings) || 0,
        pending: parseInt(result.rows[0].pending) || 0,
        confirmed: parseInt(result.rows[0].confirmed) || 0,
        completed: parseInt(result.rows[0].completed) || 0,
        cancelled: parseInt(result.rows[0].cancelled) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking stats'
    });
  }
});

module.exports = router;