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
// 1. CREATE WILL (Authenticated)
// ============================================================
router.post('/', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    
    const {
      fullName,
      idNumber,
      executorName,
      executorPhone,
      executorEmail,
      assets,
      bequests,
      heirs,
      witnesses,
      specialInstructions,
      status = 'draft'
    } = req.body;

    // Validate required fields
    if (!fullName || !executorName) {
      return res.status(400).json({
        success: false,
        error: 'Full name and executor name are required'
      });
    }

    // Generate reference and ID
    const reference = 'WILL-' + Date.now().toString(36).toUpperCase() + 
                      crypto.randomBytes(4).toString('hex').toUpperCase();
    
    const willId = 'will-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

    // Insert will into database
    await db.query(
      `INSERT INTO wills (
        id, user_id, full_name, id_number, executor_name, executor_phone,
        executor_email, assets, bequests, heirs, witnesses,
        special_instructions, status, version, reference, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
      [
        willId,
        userId,
        fullName,
        idNumber || null,
        executorName,
        executorPhone || null,
        executorEmail || null,
        assets || null,
        JSON.stringify(bequests || []),
        JSON.stringify(heirs || []),
        JSON.stringify(witnesses || []),
        specialInstructions || null,
        status,
        'v1',
        reference
      ]
    );

    // Create notification for user
    const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        notificationId,
        userId,
        'Will Created',
        `Your Islamic will has been created successfully. Reference: ${reference}`,
        'will',
        `/wills/${willId}`
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Will created successfully',
      data: {
        id: willId,
        reference: reference,
        status: status,
        version: 'v1',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating will:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create will. Please try again.'
    });
  }
});

// ============================================================
// 2. GET ALL WILLS (Authenticated)
// ============================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await db.query(
      `SELECT 
        id,
        full_name,
        executor_name,
        status,
        version,
        reference,
        createdat,
        updatedat
       FROM wills
       WHERE user_id = $1
       ORDER BY createdat DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM wills WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      wills: result.rows.map(w => ({
        id: w.id,
        fullName: w.full_name,
        executorName: w.executor_name,
        status: w.status,
        version: w.version,
        reference: w.reference,
        date: w.createdat,
        updatedAt: w.updatedat
      })),
      total: parseInt(countResult.rows[0].total),
      limit: limit,
      offset: offset
    });

  } catch (error) {
    console.error('Error fetching wills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wills'
    });
  }
});

// ============================================================
// 3. GET WILL BY ID (Authenticated)
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        id,
        full_name,
        id_number,
        executor_name,
        executor_phone,
        executor_email,
        assets,
        bequests,
        heirs,
        witnesses,
        special_instructions,
        status,
        version,
        reference,
        createdat,
        updatedat
       FROM wills
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Will not found'
      });
    }

    const will = result.rows[0];

    res.json({
      success: true,
      will: {
        id: will.id,
        fullName: will.full_name,
        idNumber: will.id_number,
        executorName: will.executor_name,
        executorPhone: will.executor_phone,
        executorEmail: will.executor_email,
        assets: will.assets,
        bequests: will.bequests,
        heirs: will.heirs,
        witnesses: will.witnesses,
        specialInstructions: will.special_instructions,
        status: will.status,
        version: will.version,
        reference: will.reference,
        createdAt: will.createdat,
        updatedAt: will.updatedat
      }
    });

  } catch (error) {
    console.error('Error fetching will:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch will'
    });
  }
});

// ============================================================
// 4. UPDATE WILL (Authenticated)
// ============================================================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;
    
    const {
      fullName,
      idNumber,
      executorName,
      executorPhone,
      executorEmail,
      assets,
      bequests,
      heirs,
      witnesses,
      specialInstructions,
      status
    } = req.body;

    // Check if will exists and belongs to user
    const checkResult = await db.query(
      'SELECT id, version FROM wills WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Will not found'
      });
    }

    const currentVersion = checkResult.rows[0].version;
    const versionParts = currentVersion.match(/(\d+)/);
    const versionNum = versionParts ? parseInt(versionParts[0]) : 1;
    const newVersion = 'v' + (versionNum + 1);

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      params.push(fullName);
    }
    if (idNumber !== undefined) {
      updates.push(`id_number = $${paramIndex++}`);
      params.push(idNumber || null);
    }
    if (executorName !== undefined) {
      updates.push(`executor_name = $${paramIndex++}`);
      params.push(executorName);
    }
    if (executorPhone !== undefined) {
      updates.push(`executor_phone = $${paramIndex++}`);
      params.push(executorPhone || null);
    }
    if (executorEmail !== undefined) {
      updates.push(`executor_email = $${paramIndex++}`);
      params.push(executorEmail || null);
    }
    if (assets !== undefined) {
      updates.push(`assets = $${paramIndex++}`);
      params.push(assets || null);
    }
    if (bequests !== undefined) {
      updates.push(`bequests = $${paramIndex++}`);
      params.push(JSON.stringify(bequests || []));
    }
    if (heirs !== undefined) {
      updates.push(`heirs = $${paramIndex++}`);
      params.push(JSON.stringify(heirs || []));
    }
    if (witnesses !== undefined) {
      updates.push(`witnesses = $${paramIndex++}`);
      params.push(JSON.stringify(witnesses || []));
    }
    if (specialInstructions !== undefined) {
      updates.push(`special_instructions = $${paramIndex++}`);
      params.push(specialInstructions || null);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    updates.push(`version = $${paramIndex++}`);
    params.push(newVersion);

    updates.push(`updatedat = NOW()`);

    params.push(id);
    params.push(userId);

    await db.query(
      `UPDATE wills SET ${updates.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
      params
    );

    res.json({
      success: true,
      message: 'Will updated successfully',
      data: {
        id: id,
        version: newVersion,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating will:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update will'
    });
  }
});

// ============================================================
// 5. DELETE WILL (Authenticated)
// ============================================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM wills WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Will not found'
      });
    }

    res.json({
      success: true,
      message: 'Will deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting will:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete will'
    });
  }
});

// ============================================================
// 6. ACTIVATE WILL (Authenticated)
// ============================================================
router.put('/:id/activate', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `UPDATE wills 
       SET status = 'active', updatedat = NOW() 
       WHERE id = $1 AND user_id = $2 
       RETURNING id, reference`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Will not found'
      });
    }

    res.json({
      success: true,
      message: 'Will activated successfully',
      data: {
        id: result.rows[0].id,
        reference: result.rows[0].reference,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Error activating will:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate will'
    });
  }
});

// ============================================================
// 7. CALCULATE INHERITANCE (Public)
// ============================================================
router.post('/calculate-inheritance', async (req, res) => {
  try {
    const { estate, heirs } = req.body;

    if (!estate || estate <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid estate value is required'
      });
    }

    if (!heirs || heirs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one heir is required'
      });
    }

    // Islamic inheritance shares
    const shares = {
      'Wife': 1/8,
      'Husband': 1/4,
      'Son': 0, // Will be calculated as Asabah
      'Daughter': 0, // Will be calculated as Asabah/2
      'Mother': 1/6,
      'Father': 1/6,
      'Grandmother': 1/6,
      'Grandfather': 1/6,
      'Sister': 1/2,
      'Brother': 0 // Will be calculated as Asabah
    };

    // Calculate distribution
    const distribution = heirs.map(heir => {
      const relation = heir.relation || heir.relationship || '';
      let share = 0;
      let percentage = 0;
      let amount = 0;

      // Find matching share
      for (const [key, value] of Object.entries(shares)) {
        if (relation.toLowerCase().includes(key.toLowerCase())) {
          share = value;
          percentage = Math.round(value * 100);
          amount = Math.round(estate * value);
          break;
        }
      }

      // If no match found, use custom share if provided
      if (share === 0 && heir.share) {
        if (typeof heir.share === 'number') {
          share = heir.share;
          percentage = Math.round(share * 100);
          amount = Math.round(estate * share);
        } else if (heir.share.includes('/')) {
          const parts = heir.share.split('/');
          const numerator = parseFloat(parts[0]);
          const denominator = parseFloat(parts[1]);
          if (!isNaN(numerator) && !isNaN(denominator) && denominator > 0) {
            share = numerator / denominator;
            percentage = Math.round(share * 100);
            amount = Math.round(estate * share);
          }
        }
      }

      // Asabah calculation for sons
      const isSon = relation.toLowerCase().includes('son');
      const isDaughter = relation.toLowerCase().includes('daughter');
      
      if (isSon) {
        // Sons get Asabah (remaining after fixed shares)
        // In a simplified model, we'll use 1/2 for first son
        share = 1/2;
        percentage = 50;
        amount = Math.round(estate * 0.5);
      } else if (isDaughter) {
        // Daughters get half of son's share
        share = 1/4;
        percentage = 25;
        amount = Math.round(estate * 0.25);
      }

      return {
        name: heir.name || 'Unnamed',
        relation: relation || heir.relationship || 'Unknown',
        share: typeof share === 'number' ? share.toFixed(3) : heir.share || 'N/A',
        percentage: percentage,
        amount: amount,
        estate_share: share
      };
    });

    // Calculate total distributed
    const totalDistributed = distribution.reduce((sum, h) => sum + h.amount, 0);
    const remaining = estate - totalDistributed;

    res.json({
      success: true,
      data: {
        estate: estate,
        totalDistributed: totalDistributed,
        remaining: remaining,
        distribution: distribution,
        calculationDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error calculating inheritance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate inheritance'
    });
  }
});

// ============================================================
// 8. GET WILL STATS (Authenticated)
// ============================================================
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        COUNT(*) as total_wills,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_wills,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_wills,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_wills,
        MAX(createdat) as latest_will
       FROM wills
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      stats: {
        totalWills: parseInt(result.rows[0].total_wills) || 0,
        activeWills: parseInt(result.rows[0].active_wills) || 0,
        draftWills: parseInt(result.rows[0].draft_wills) || 0,
        completedWills: parseInt(result.rows[0].completed_wills) || 0,
        latestWill: result.rows[0].latest_will || null
      }
    });

  } catch (error) {
    console.error('Error fetching will stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch will stats'
    });
  }
});

module.exports = router;