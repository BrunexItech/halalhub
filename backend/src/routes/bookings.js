const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Client } = require('pg');
const crypto = require('crypto');
const virtualAccountService = require('../services/virtual-account.service');

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
// - For leaders: returns bookings assigned to them
// ============================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status;

    // First, check if the user is a leader
    const leaderCheck = await db.query(
      'SELECT id FROM leaders WHERE user_id = $1',
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
        cb.payment_status,
        cb.payment_reference,
        cb.amount,
        l.id as leader_id,
        l.user_id as leader_user_id,
        l.leader_type,
        u.fullname as leader_name,
        u.profile_image,
        l.title as leader_title,
        l.location as leader_location,
        l.county as leader_county,
        l.consultation_fee,
        l.is_verified as leader_verified,
        l.institution as leader_institution,
        l.qualifications as leader_qualifications,
        l.years_of_service as leader_experience,
        l.bio as leader_bio,
        l.consultation_types
      FROM consultation_bookings cb
      JOIN leaders l ON cb.leader_id = l.id
      JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // If user is a leader, show bookings assigned to them
    if (leaderCheck.rows.length > 0) {
      const leaderId = leaderCheck.rows[0].id;
      query += ` AND cb.leader_id = $${paramIndex}`;
      params.push(leaderId);
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

    if (leaderCheck.rows.length > 0) {
      const leaderId = leaderCheck.rows[0].id;
      countQuery += ` AND cb.leader_id = $${countIndex}`;
      countParams.push(leaderId);
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
        cb.payment_status,
        cb.payment_reference,
        cb.amount,
        l.id as leader_id,
        l.user_id as leader_user_id,
        l.leader_type,
        u.fullname as leader_name,
        u.profile_image,
        l.title as leader_title,
        l.location as leader_location,
        l.county as leader_county,
        l.consultation_fee,
        l.is_verified as leader_verified,
        l.institution as leader_institution,
        l.qualifications as leader_qualifications,
        l.years_of_service as leader_experience,
        l.bio as leader_bio,
        l.consultation_types
      FROM consultation_bookings cb
      JOIN leaders l ON cb.leader_id = l.id
      JOIN users u ON l.user_id = u.id
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

    // Verify user has access (either they booked it or they are the leader)
    const isClient = booking.user_id === userId;
    const isLeader = booking.leader_user_id === userId;

    if (!isLeader && !isClient) {
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
      leaderId,
      bookingDate,
      bookingTime,
      type = 'video',
      topic,
      notes,
      userName,
      userEmail
    } = req.body;

    if (!leaderId || !bookingDate || !bookingTime || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Leader, date, time, and topic are required'
      });
    }

    // Check if leader exists and is available for consultation
    const leaderCheck = await db.query(
      `SELECT l.id, l.user_id, l.leader_type, l.consultation_fee, l.available_for_consultation, 
              u.fullname as leader_name
       FROM leaders l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = $1 AND l.status = 'approved'`,
      [leaderId]
    );

    if (leaderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Leader not found'
      });
    }

    if (!leaderCheck.rows[0].available_for_consultation) {
      return res.status(400).json({
        success: false,
        error: 'This leader is currently not available for consultations'
      });
    }

    // Check if this leader already has a booking at this date and time
    const duplicateCheck = await db.query(
      `SELECT id, status FROM consultation_bookings 
       WHERE leader_id = $1 
       AND booking_date = $2 
       AND booking_time = $3 
       AND status != 'cancelled' 
       AND status != 'completed'`,
      [leaderId, bookingDate, bookingTime]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked. Please select a different time.'
      });
    }

    // Generate unique room name for video calls
    const roomName = `halalhub-consultation-${leaderId}-${Date.now().toString(36)}`;
    const consultationFee = parseInt(leaderCheck.rows[0].consultation_fee) || 0;

    // ============================================================
    // CHECK USER BALANCE BEFORE CREATING BOOKING
    // ============================================================
    const clientAccount = await virtualAccountService.getUserAccount(userId);
    
    if (!clientAccount) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found. Please contact support.'
      });
    }

    console.log(`[Booking] Client balance: ${clientAccount.balance}, Fee: ${consultationFee}`);

    if (clientAccount.balance < consultationFee) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You have KES ${clientAccount.balance.toLocaleString()} but need KES ${consultationFee.toLocaleString()}. Please top up your wallet.`,
        balance: clientAccount.balance,
        required: consultationFee
      });
    }
    // ============================================================

    const bookingId = 'bkg-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

    await db.query(
      `INSERT INTO consultation_bookings (
        id, user_id, leader_id, booking_date, booking_time, type, 
        topic, notes, status, room_name, user_name, user_email, amount,
        payment_status, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', NOW(), NOW())`,
      [
        bookingId,
        userId,
        leaderId,
        bookingDate,
        bookingTime,
        type,
        topic,
        notes || null,
        'pending',
        type === 'video' ? roomName : null,
        userName || null,
        userEmail || null,
        consultationFee
      ]
    );

    // Create notification for the leader
    const leaderUserId = leaderCheck.rows[0].user_id;
    const leaderName = leaderCheck.rows[0].leader_name || 'Leader';

    if (leaderUserId) {
      const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await db.query(
        `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          notificationId,
          leaderUserId,
          'New Consultation Booking',
          `A new consultation has been booked with you for ${bookingDate} at ${bookingTime}. Please accept or reject.`,
          'booking',
          `/leader-dashboard`
        ]
      );
    }

    // Create notification for client
    const clientNotifId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        clientNotifId,
        userId,
        'Consultation Booked',
        `Your consultation with ${leaderName} has been booked for ${bookingDate} at ${bookingTime}. Waiting for leader to confirm.`,
        'booking',
        `/consultations/${bookingId}`
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Consultation booked successfully',
      data: {
        id: bookingId,
        leaderName: leaderName,
        leaderType: leaderCheck.rows[0].leader_type,
        bookingDate: bookingDate,
        bookingTime: bookingTime,
        type: type,
        roomName: type === 'video' ? roomName : null,
        status: 'pending',
        amount: consultationFee,
        payment_status: 'pending'
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
// 4. UPDATE BOOKING (Authenticated - Client or Leader)
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
      `SELECT cb.*, l.user_id as leader_user_id 
       FROM consultation_bookings cb 
       JOIN leaders l ON cb.leader_id = l.id 
       WHERE cb.id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const booking = checkResult.rows[0];
    const isLeader = booking.leader_user_id === userId;
    const isClient = booking.user_id === userId;

    if (!isLeader && !isClient) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this booking'
      });
    }

    // If leader is updating status
    if (isLeader && status) {
      // Only allow specific status changes
      const validStatuses = ['confirmed', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Allowed: confirmed, cancelled, completed'
        });
      }

      // If confirming, process payment
      if (status === 'confirmed') {
        // Check if payment is required and not yet paid
        if (booking.amount > 0 && booking.payment_status !== 'paid') {
          // Process payment from client's wallet
          try {
            // ============================================================
            // CHECK CLIENT BALANCE BEFORE DEDUCTING
            // ============================================================
            const clientAccount = await virtualAccountService.getUserAccount(booking.user_id);
            
            if (!clientAccount) {
              return res.status(404).json({
                success: false,
                error: 'Client virtual account not found. Please contact support.'
              });
            }

            console.log(`[Booking Confirm] Client balance: ${clientAccount.balance}, Required: ${booking.amount}`);

            if (clientAccount.balance < booking.amount) {
              return res.status(400).json({
                success: false,
                error: `Client has insufficient balance. Available: KES ${clientAccount.balance.toLocaleString()}, Required: KES ${booking.amount.toLocaleString()}. Please ask the client to top up their wallet.`
              });
            }
            // ============================================================

            // Get leader's virtual account
            const leaderAccount = await virtualAccountService.getUserAccount(booking.leader_user_id);
            
            if (!leaderAccount) {
              return res.status(404).json({
                success: false,
                error: 'Leader virtual account not found. Please contact support.'
              });
            }

            // Transfer payment from client to leader
            const transferResult = await virtualAccountService.processTransfer(
              booking.user_id,
              clientAccount.account_number,
              leaderAccount.account_number,
              booking.amount,
              `Consultation booking payment - ${id}`
            );

            console.log(`[Booking Confirm] Transfer completed: ${transferResult.data?.reference}`);

            // Update payment status
            const paymentRef = 'PAY-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(4).toString('hex').toUpperCase();
            await db.query(
              `UPDATE consultation_bookings 
               SET payment_status = 'paid', 
                   payment_reference = $1,
                   updatedat = NOW()
               WHERE id = $2`,
              [paymentRef, id]
            );

          } catch (paymentError) {
            console.error('Payment error:', paymentError);
            return res.status(500).json({
              success: false,
              error: `Payment processing failed: ${paymentError.message || 'Please try again.'}`
            });
          }
        }

        // Update booking status
        await db.query(
          `UPDATE consultation_bookings 
           SET status = $1, accepted_at = NOW(), updatedat = NOW() 
           WHERE id = $2`,
          [status, id]
        );

        // Create notification for client
        const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
        await db.query(
          `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            notificationId,
            booking.user_id,
            'Consultation Confirmed',
            `Your consultation has been confirmed. Payment of KES ${booking.amount.toLocaleString()} has been processed. You can now join the call.`,
            'booking',
            `/consultations/${id}`
          ]
        );

        res.json({
          success: true,
          message: 'Booking confirmed successfully',
          data: {
            status: 'confirmed',
            payment_status: 'paid'
          }
        });
        return;
      }

      // For completed status
      if (status === 'completed') {
        await db.query(
          `UPDATE consultation_bookings 
           SET status = $1, updatedat = NOW() 
           WHERE id = $2`,
          [status, id]
        );

        // Create notification for client
        const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
        await db.query(
          `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            notificationId,
            booking.user_id,
            'Consultation Completed',
            `Your consultation has been marked as completed. Thank you for using HalalHub.`,
            'booking',
            `/consultations/${id}`
          ]
        );

        res.json({
          success: true,
          message: 'Booking completed successfully'
        });
        return;
      }

      // For cancelled status
      if (status === 'cancelled') {
        // If cancelled, refund the client if they paid
        if (booking.payment_status === 'paid') {
          try {
            const clientAccount = await virtualAccountService.getUserAccount(booking.user_id);
            const leaderAccount = await virtualAccountService.getUserAccount(booking.leader_user_id);

            if (clientAccount && leaderAccount) {
              // Refund from leader back to client
              await virtualAccountService.processTransfer(
                booking.leader_user_id,
                leaderAccount.account_number,
                clientAccount.account_number,
                booking.amount,
                `Refund for cancelled consultation - ${id}`
              );

              await db.query(
                `UPDATE consultation_bookings 
                 SET payment_status = 'refunded', updatedat = NOW()
                 WHERE id = $1`,
                [id]
              );
            }
          } catch (refundError) {
            console.error('Refund error:', refundError);
            // Continue even if refund fails, admin can handle manually
          }
        }

        await db.query(
          `UPDATE consultation_bookings 
           SET status = $1, updatedat = NOW() 
           WHERE id = $2`,
          [status, id]
        );

        // Create notification for client
        const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
        await db.query(
          `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            notificationId,
            booking.user_id,
            'Consultation Cancelled',
            `Your consultation has been cancelled. ${booking.payment_status === 'paid' ? 'A refund has been issued.' : ''}`,
            'booking',
            `/consultations/${id}`
          ]
        );

        res.json({
          success: true,
          message: 'Booking cancelled successfully'
        });
        return;
      }
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
      `SELECT cb.*, l.user_id as leader_user_id 
       FROM consultation_bookings cb 
       JOIN leaders l ON cb.leader_id = l.id 
       WHERE cb.id = $1`,
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

    // If booking was paid, process refund
    if (booking.payment_status === 'paid') {
      try {
        const clientAccount = await virtualAccountService.getUserAccount(booking.user_id);
        const leaderAccount = await virtualAccountService.getUserAccount(booking.leader_user_id);

        if (clientAccount && leaderAccount) {
          await virtualAccountService.processTransfer(
            booking.leader_user_id,
            leaderAccount.account_number,
            clientAccount.account_number,
            booking.amount,
            `Refund for cancelled consultation - ${id}`
          );

          await db.query(
            `UPDATE consultation_bookings 
             SET payment_status = 'refunded', updatedat = NOW()
             WHERE id = $1`,
            [id]
          );
        }
      } catch (refundError) {
        console.error('Refund error:', refundError);
        // Continue even if refund fails, admin can handle manually
      }
    }

    await db.query(
      `UPDATE consultation_bookings 
       SET status = 'cancelled', updatedat = NOW() 
       WHERE id = $1`,
      [id]
    );

    // Create notification for leader
    const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        notificationId,
        booking.leader_user_id,
        'Consultation Cancelled by Client',
        `A consultation has been cancelled by the client.`,
        'booking',
        `/leader-dashboard`
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
        cb.payment_status,
        cb.payment_reference,
        l.id as leader_id,
        l.user_id as leader_user_id,
        l.leader_type,
        u.fullname as leader_name,
        l.title as leader_title,
        l.location as leader_location,
        l.county as leader_county
      FROM consultation_bookings cb
      JOIN leaders l ON cb.leader_id = l.id
      JOIN users u ON l.user_id = u.id
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
    const isLeader = booking.leader_user_id === userId;
    const isClient = booking.user_id === userId;

    if (!isLeader && !isClient) {
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
// 7. GET BOOKING STATS (Authenticated - Leader only)
// ============================================================
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    // Check if user is a leader
    const leaderCheck = await db.query(
      'SELECT id, leader_type FROM leaders WHERE user_id = $1',
      [userId]
    );

    let result;
    if (leaderCheck.rows.length > 0) {
      const leaderId = leaderCheck.rows[0].id;
      result = await db.query(
        `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as payment_pending,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_earned
        FROM consultation_bookings
        WHERE leader_id = $1
        `,
        [leaderId]
      );
    } else {
      // For clients, show their booking stats
      result = await db.query(
        `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as payment_pending,
          0 as total_earned
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
        cancelled: parseInt(result.rows[0].cancelled) || 0,
        paid: parseInt(result.rows[0].paid) || 0,
        paymentPending: parseInt(result.rows[0].payment_pending) || 0,
        totalEarned: parseInt(result.rows[0].total_earned) || 0
      },
      isLeader: leaderCheck.rows.length > 0,
      leaderType: leaderCheck.rows[0]?.leader_type || null
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