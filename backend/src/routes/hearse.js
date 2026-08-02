const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
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
// 1. CREATE SERVICE REQUEST (Authenticated - User)
// ============================================================
router.post('/requests', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      serviceType,
      pickupLocation,
      destinationLocation,
      mosqueLocation,
      cemeteryLocation,
      shroudType,
      shroudQuantity,
      contactPerson,
      contactPhone,
      scheduledDate,
      scheduledTime,
      urgency = 'standard',
      specialRequests
    } = req.body;

    if (!serviceType || !pickupLocation || !contactPerson || !contactPhone) {
      return res.status(400).json({
        success: false,
        error: 'Service type, pickup location, contact person, and contact phone are required'
      });
    }

    const reference = 'HR-' + Date.now().toString(36).toUpperCase() +
                      crypto.randomBytes(4).toString('hex').toUpperCase();

    const requestId = 'req-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

    await db.query(
      `INSERT INTO hearse_requests (
        id, user_id, service_type, pickup_location, destination_location,
        mosque_location, cemetery_location, shroud_type, shroud_quantity,
        contact_person, contact_phone, scheduled_date, scheduled_time,
        urgency, special_requests, status, reference, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', $16, NOW(), NOW())`,
      [
        requestId,
        userId,
        serviceType,
        pickupLocation,
        destinationLocation || null,
        mosqueLocation || null,
        cemeteryLocation || null,
        shroudType || null,
        shroudQuantity || 1,
        contactPerson,
        contactPhone,
        scheduledDate || null,
        scheduledTime || null,
        urgency,
        specialRequests || null,
        reference
      ]
    );

    // Create notification for admin
    const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        notificationId,
        userId,
        'Service Request Submitted',
        `Your hearse and shroud service request (${reference}) has been submitted successfully. You will be contacted shortly.`,
        'hearse',
        `/hearse/requests/${requestId}`
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Service request submitted successfully',
      data: {
        id: requestId,
        reference: reference,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating hearse request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit request. Please try again.'
    });
  }
});

// ============================================================
// 2. GET USER REQUESTS (Authenticated - User)
// ============================================================
router.get('/requests', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    let query = `
      SELECT 
        id,
        service_type,
        pickup_location,
        destination_location,
        contact_person,
        contact_phone,
        scheduled_date,
        scheduled_time,
        urgency,
        status,
        reference,
        createdat,
        updatedat
      FROM hearse_requests
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY createdat DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      requests: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching hearse requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
});

// ============================================================
// 3. GET REQUEST BY ID (Authenticated)
// ============================================================
router.get('/requests/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        id,
        user_id,
        service_type,
        pickup_location,
        destination_location,
        mosque_location,
        cemetery_location,
        shroud_type,
        shroud_quantity,
        contact_person,
        contact_phone,
        scheduled_date,
        scheduled_time,
        urgency,
        special_requests,
        status,
        reference,
        createdat,
        updatedat
      FROM hearse_requests
      WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Get assignment if exists
    const assignmentResult = await db.query(
      `SELECT 
        ha.*,
        hp.id as provider_id,
        hp.service_area,
        hp.is_verified,
        vp.business_name as provider_name,
        vp.phone as provider_phone
      FROM hearse_request_assignments ha
      LEFT JOIN hearse_providers hp ON ha.provider_id = hp.id
      LEFT JOIN vendor_profiles vp ON hp.vendor_id = vp.id
      WHERE ha.request_id = $1`,
      [id]
    );

    res.json({
      success: true,
      request: {
        ...result.rows[0],
        assignment: assignmentResult.rows[0] || null
      }
    });

  } catch (error) {
    console.error('Error fetching hearse request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch request'
    });
  }
});

// ============================================================
// 4. GET PROVIDER REQUESTS (Authenticated - Provider)
// ============================================================
router.get('/provider/requests', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    // Get provider ID from vendor profile
    const vendorResult = await db.query(
      'SELECT id FROM vendor_profiles WHERE user_id = $1',
      [userId]
    );

    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    const vendorId = vendorResult.rows[0].id;

    const providerResult = await db.query(
      'SELECT id FROM hearse_providers WHERE vendor_id = $1',
      [vendorId]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hearse provider not found'
      });
    }

    const providerId = providerResult.rows[0].id;

    let query = `
      SELECT 
        hr.id,
        hr.service_type,
        hr.pickup_location,
        hr.destination_location,
        hr.contact_person,
        hr.contact_phone,
        hr.scheduled_date,
        hr.scheduled_time,
        hr.urgency,
        hr.status as request_status,
        hr.reference,
        hr.createdat,
        ha.status as assignment_status,
        ha.assigned_at,
        ha.accepted_at,
        ha.completed_at,
        ha.notes
      FROM hearse_request_assignments ha
      JOIN hearse_requests hr ON ha.request_id = hr.id
      WHERE ha.provider_id = $1
    `;
    const params = [providerId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND ha.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY ha.assigned_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      requests: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching provider requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider requests'
    });
  }
});

// ============================================================
// 5. ACCEPT REQUEST (Authenticated - Provider)
// ============================================================
router.put('/provider/requests/:id/accept', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;

    // Get provider ID
    const vendorResult = await db.query(
      'SELECT id FROM vendor_profiles WHERE user_id = $1',
      [userId]
    );

    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    const vendorId = vendorResult.rows[0].id;

    const providerResult = await db.query(
      'SELECT id FROM hearse_providers WHERE vendor_id = $1',
      [vendorId]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hearse provider not found'
      });
    }

    const providerId = providerResult.rows[0].id;

    // Check assignment exists and is pending
    const assignmentCheck = await db.query(
      `SELECT ha.*, hr.user_id 
       FROM hearse_request_assignments ha
       JOIN hearse_requests hr ON ha.request_id = hr.id
       WHERE ha.request_id = $1 AND ha.provider_id = $2`,
      [id, providerId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    const assignment = assignmentCheck.rows[0];

    if (assignment.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        error: `This request is already ${assignment.status}`
      });
    }

    await db.query('BEGIN');

    // Update assignment
    await db.query(
      `UPDATE hearse_request_assignments 
       SET status = 'accepted', accepted_at = NOW(), updatedat = NOW()
       WHERE request_id = $1 AND provider_id = $2`,
      [id, providerId]
    );

    // Update request status
    await db.query(
      `UPDATE hearse_requests 
       SET status = 'in_progress', updatedat = NOW()
       WHERE id = $1`,
      [id]
    );

    // Create notification for user
    const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        notificationId,
        assignment.user_id,
        'Service Request Accepted',
        `Your service request has been accepted by a provider. You will be contacted shortly.`,
        'hearse',
        `/hearse/requests/${id}`
      ]
    );

    await db.query('COMMIT');

    res.json({
      success: true,
      message: 'Request accepted successfully',
      status: 'accepted'
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error accepting request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept request'
    });
  }
});

// ============================================================
// 6. COMPLETE REQUEST (Authenticated - Provider)
// ============================================================
router.put('/provider/requests/:id/complete', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;

    // Get provider ID
    const vendorResult = await db.query(
      'SELECT id FROM vendor_profiles WHERE user_id = $1',
      [userId]
    );

    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    const vendorId = vendorResult.rows[0].id;

    const providerResult = await db.query(
      'SELECT id FROM hearse_providers WHERE vendor_id = $1',
      [vendorId]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hearse provider not found'
      });
    }

    const providerId = providerResult.rows[0].id;

    // Check assignment exists and is accepted
    const assignmentCheck = await db.query(
      `SELECT ha.*, hr.user_id 
       FROM hearse_request_assignments ha
       JOIN hearse_requests hr ON ha.request_id = hr.id
       WHERE ha.request_id = $1 AND ha.provider_id = $2`,
      [id, providerId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    const assignment = assignmentCheck.rows[0];

    if (assignment.status !== 'accepted' && assignment.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: `Cannot complete a request that is ${assignment.status}`
      });
    }

    await db.query('BEGIN');

    // Update assignment
    await db.query(
      `UPDATE hearse_request_assignments 
       SET status = 'completed', completed_at = NOW(), updatedat = NOW()
       WHERE request_id = $1 AND provider_id = $2`,
      [id, providerId]
    );

    // Update request status
    await db.query(
      `UPDATE hearse_requests 
       SET status = 'completed', updatedat = NOW()
       WHERE id = $1`,
      [id]
    );

    // Create notification for user
    const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        notificationId,
        assignment.user_id,
        'Service Request Completed',
        `Your service request has been marked as completed. Thank you for using HalalHub.`,
        'hearse',
        `/hearse/requests/${id}`
      ]
    );

    await db.query('COMMIT');

    res.json({
      success: true,
      message: 'Request marked as completed',
      status: 'completed'
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error completing request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete request'
    });
  }
});

// ============================================================
// 7. ADMIN - GET ALL REQUESTS
// ============================================================
router.get('/admin/requests', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const { status, limit = 100 } = req.query;

    let query = `
      SELECT 
        hr.id,
        hr.service_type,
        hr.pickup_location,
        hr.destination_location,
        hr.contact_person,
        hr.contact_phone,
        hr.scheduled_date,
        hr.scheduled_time,
        hr.urgency,
        hr.status,
        hr.reference,
        hr.createdat,
        u.fullname as user_name,
        u.phone as user_phone,
        u.email as user_email
      FROM hearse_requests hr
      LEFT JOIN users u ON hr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      query += ` AND hr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY hr.createdat DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      requests: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
});

// ============================================================
// 8. ADMIN - ASSIGN REQUEST TO PROVIDER
// ============================================================
router.post('/admin/assign', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { requestId, providerId, notes } = req.body;

    if (!requestId || !providerId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID and Provider ID are required'
      });
    }

    // Check request exists and is pending
    const requestCheck = await db.query(
      'SELECT id, user_id FROM hearse_requests WHERE id = $1 AND status = $2',
      [requestId, 'pending']
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found or already assigned'
      });
    }

    // Check provider exists and is verified
    const providerCheck = await db.query(
      'SELECT id FROM hearse_providers WHERE id = $1 AND is_verified = true',
      [providerId]
    );

    if (providerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found or not verified'
      });
    }

    // Check if already assigned
    const existingAssignment = await db.query(
      'SELECT id FROM hearse_request_assignments WHERE request_id = $1',
      [requestId]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This request is already assigned'
      });
    }

    const assignmentId = 'ass-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

    await db.query('BEGIN');

    await db.query(
      `INSERT INTO hearse_request_assignments (
        id, request_id, provider_id, assigned_by, status, notes, assigned_at, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, 'assigned', $5, NOW(), NOW(), NOW())`,
      [assignmentId, requestId, providerId, userId, notes || null]
    );

    // Update request status
    await db.query(
      `UPDATE hearse_requests SET status = 'assigned', updatedat = NOW() WHERE id = $1`,
      [requestId]
    );

    // Get provider details for notification
    const providerDetails = await db.query(
      `SELECT vp.business_name, vp.phone 
       FROM hearse_providers hp
       JOIN vendor_profiles vp ON hp.vendor_id = vp.id
       WHERE hp.id = $1`,
      [providerId]
    );

    // Create notification for user
    const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        notificationId,
        requestCheck.rows[0].user_id,
        'Service Request Assigned',
        `Your service request has been assigned to ${providerDetails.rows[0].business_name}. They will contact you shortly.`,
        'hearse',
        `/hearse/requests/${requestId}`
      ]
    );

    await db.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Request assigned successfully',
      data: {
        assignmentId: assignmentId,
        requestId: requestId,
        providerId: providerId
      }
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error assigning request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign request'
    });
  }
});

// ============================================================
// 9. ADMIN - GET ALL PROVIDERS
// ============================================================
router.get('/admin/providers', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const { status, limit = 100 } = req.query;

    let query = `
      SELECT 
        hp.id,
        hp.license_number,
        hp.service_area,
        hp.vehicle_type,
        hp.vehicle_registration,
        hp.is_verified,
        hp.verification_status,
        hp.hourly_rate,
        hp.distance_rate,
        hp.createdat,
        vp.id as vendor_profile_id,
        vp.business_name,
        vp.business_type,
        vp.vendor_type,
        vp.location,
        vp.phone,
        vp.email,
        vp.is_verified as vendor_verified,
        u.fullname as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM hearse_providers hp
      JOIN vendor_profiles vp ON hp.vendor_id = vp.id
      JOIN users u ON vp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      if (status === 'verified') {
        query += ` AND hp.is_verified = true AND hp.verification_status = 'approved'`;
      } else if (status === 'pending') {
        query += ` AND hp.verification_status = 'pending'`;
      } else if (status === 'rejected') {
        query += ` AND hp.verification_status = 'rejected'`;
      }
    }

    query += ` ORDER BY hp.createdat DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      providers: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch providers'
    });
  }
});

// ============================================================
// 10. ADMIN - UPDATE PROVIDER VERIFICATION
// ============================================================
router.put('/admin/providers/:id/verify', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const providerId = req.params.id;
    const { status, notes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be "approved" or "rejected"'
      });
    }

    const result = await db.query(
      `UPDATE hearse_providers 
       SET is_verified = $1, 
           verification_status = $2,
           updatedat = NOW()
       WHERE id = $3
       RETURNING id, vendor_id`,
      [status === 'approved', status, providerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Get user ID for notification
    const userResult = await db.query(
      `SELECT u.id, vp.business_name
       FROM vendor_profiles vp
       JOIN users u ON vp.user_id = u.id
       WHERE vp.id = $1`,
      [result.rows[0].vendor_id]
    );

    const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        notificationId,
        userResult.rows[0].id,
        status === 'approved' ? 'Hearse Provider Application Approved' : 'Hearse Provider Application Rejected',
        status === 'approved' 
          ? `Your hearse provider application has been approved. You can now accept service requests.`
          : `Your hearse provider application has been rejected. ${notes || 'Please contact support for more details.'}`,
        'hearse',
        `/hearse/provider/dashboard`
      ]
    );

    res.json({
      success: true,
      message: `Provider ${status} successfully`
    });

  } catch (error) {
    console.error('Error updating provider verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update provider verification'
    });
  }
});

// ============================================================
// 11. GET PROVIDER STATS (Authenticated - Provider)
// ============================================================
router.get('/provider/stats', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    // Get provider ID
    const vendorResult = await db.query(
      'SELECT id FROM vendor_profiles WHERE user_id = $1',
      [userId]
    );

    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    const vendorId = vendorResult.rows[0].id;

    const providerResult = await db.query(
      'SELECT id FROM hearse_providers WHERE vendor_id = $1',
      [vendorId]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hearse provider not found'
      });
    }

    const providerId = providerResult.rows[0].id;

    const result = await db.query(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN ha.status = 'assigned' THEN 1 END) as assigned_requests,
        COUNT(CASE WHEN ha.status = 'accepted' THEN 1 END) as accepted_requests,
        COUNT(CASE WHEN ha.status = 'completed' THEN 1 END) as completed_requests
      FROM hearse_request_assignments ha
      WHERE ha.provider_id = $1`,
      [providerId]
    );

    res.json({
      success: true,
      stats: {
        totalRequests: parseInt(result.rows[0].total_requests) || 0,
        assignedRequests: parseInt(result.rows[0].assigned_requests) || 0,
        acceptedRequests: parseInt(result.rows[0].accepted_requests) || 0,
        completedRequests: parseInt(result.rows[0].completed_requests) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider stats'
    });
  }
});

module.exports = router;