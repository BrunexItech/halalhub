const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const { authenticate, authorize } = require('../middleware/auth');

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

// Leader types
const LEADER_TYPES = [
  'islamic_scholar',
  'imam',
  'adhan_caller',
  'ustadh',
  'ustadha',
  'kadhi'
];

// All leader routes require authentication and leader role
router.use(authenticate);
router.use(authorize('leader', 'admin'));

// ============================================================
// 1. GET LEADER DASHBOARD STATS
// ============================================================
router.get('/dashboard-stats', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const stats = await db.query(`
      SELECT 
        l.id as leader_id,
        l.leader_type,
        l.is_verified,
        l.status,
        l.is_public,
        l.share_link,
        (SELECT COALESCE(SUM(total_contributions), 0) FROM leader_pension_balances WHERE leader_id = l.id) as total_pension,
        (SELECT COUNT(*) FROM leader_supporters WHERE leader_id = l.id AND status = 'active') as total_supporters,
        (SELECT COUNT(*) FROM leader_pension_contributions WHERE leader_id = l.id) as total_contributions,
        (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false) as unread_notifications
      FROM leaders l
      WHERE l.user_id = $1
    `, [userId]);

    if (stats.rows.length === 0) {
      return res.status(404).json({ error: 'Leader profile not found' });
    }

    res.json({ success: true, stats: stats.rows[0] });

  } catch (err) {
    console.error('Error fetching leader stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch leader stats' });
  }
});

// ============================================================
// 2. GET LEADER PROFILE (Private - for the leader themselves)
// ============================================================
router.get('/profile', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        u.id, u.fullname, u.phone, u.email, u.profile_image, u.bio,
        l.id as leader_id, l.leader_type, l.title, l.location, l.county,
        l.qualifications, l.years_of_service, l.is_verified, l.status,
        l.is_public, l.share_link,
        lp.total_contributions, lp.total_supporters
      FROM users u
      JOIN leaders l ON u.id = l.user_id
      LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leader profile not found' });
    }

    res.json({ success: true, leader: result.rows[0] });

  } catch (err) {
    console.error('Error fetching leader profile:', err.message);
    res.status(500).json({ error: 'Failed to fetch leader profile' });
  }
});

// ============================================================
// 3. CREATE OR UPDATE LEADER PROFILE
// ============================================================
router.post('/profile', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      leader_type,
      title,
      location,
      county,
      qualifications,
      years_of_service,
      bio,
      profile_image,
      is_public
    } = req.body;

    if (!leader_type || !LEADER_TYPES.includes(leader_type)) {
      return res.status(400).json({ 
        error: 'Valid leader type is required. Types: ' + LEADER_TYPES.join(', ')
      });
    }

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Check if leader profile exists
    const existing = await db.query(
      'SELECT id FROM leaders WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      // Update existing
      await db.query(`
        UPDATE leaders SET
          leader_type = COALESCE($1, leader_type),
          title = COALESCE($2, title),
          location = COALESCE($3, location),
          county = COALESCE($4, county),
          qualifications = COALESCE($5, qualifications),
          years_of_service = COALESCE($6, years_of_service),
          bio = COALESCE($7, bio),
          is_public = COALESCE($8, is_public),
          updatedat = NOW()
        WHERE user_id = $9
      `, [leader_type, title, location, county, qualifications || [], years_of_service || 0, bio, is_public || false, userId]);

      // Update user table
      if (bio) {
        await db.query(
          'UPDATE users SET bio = $1, profile_image = COALESCE($2, profile_image) WHERE id = $3',
          [bio, profile_image, userId]
        );
      }

      res.json({ success: true, message: 'Leader profile updated successfully' });

    } else {
      // Create new leader profile
      const id = 'leader-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      const shareLink = 'leader-' + Date.now().toString(36) + require('crypto').randomBytes(6).toString('hex');
      
      await db.query(`
        INSERT INTO leaders (
          id, user_id, leader_type, title, location, county,
          qualifications, years_of_service, bio, is_public, share_link,
          createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `, [id, userId, leader_type, title || null, location, county || null, qualifications || [], years_of_service || 0, bio, is_public || false, shareLink]);

      // Create pension balance entry
      await db.query(`
        INSERT INTO leader_pension_balances (leader_id, total_contributions, total_supporters)
        VALUES ($1, 0, 0)
      `, [id]);

      // Update user table
      await db.query(
        'UPDATE users SET bio = $1, profile_image = COALESCE($2, profile_image) WHERE id = $3',
        [bio, profile_image, userId]
      );

      res.json({ 
        success: true, 
        message: 'Leader profile created successfully',
        share_link: shareLink
      });
    }

  } catch (err) {
    console.error('Error saving leader profile:', err.message);
    res.status(500).json({ error: 'Failed to save leader profile' });
  }
});

// ============================================================
// 4. GENERATE SHARE LINK (Make leader public)
// ============================================================
router.post('/share', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, share_link, is_public FROM leaders WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leader profile not found' });
    }

    const leader = result.rows[0];
    let shareLink = leader.share_link;

    // If no share link exists, generate one
    if (!shareLink) {
      shareLink = 'leader-' + Date.now().toString(36) + require('crypto').randomBytes(6).toString('hex');
      await db.query(
        'UPDATE leaders SET share_link = $1, is_public = true, updatedat = NOW() WHERE id = $2',
        [shareLink, leader.id]
      );
    } else {
      // Toggle public status
      const newPublicStatus = !leader.is_public;
      await db.query(
        'UPDATE leaders SET is_public = $1, updatedat = NOW() WHERE id = $2',
        [newPublicStatus, leader.id]
      );
    }

    const updated = await db.query(
      'SELECT share_link, is_public FROM leaders WHERE id = $1',
      [leader.id]
    );

    res.json({
      success: true,
      message: updated.rows[0].is_public ? 'Your profile is now public. People can find and support you.' : 'Your profile is now private. People cannot find or support you.',
      is_public: updated.rows[0].is_public
    });

  } catch (err) {
    console.error('Error generating share link:', err.message);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// ============================================================
// 5. GET PENSION BALANCE
// ============================================================
router.get('/pension', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        l.id as leader_id,
        lp.total_contributions,
        lp.total_supporters,
        (SELECT COUNT(*) FROM leader_pension_contributions WHERE leader_id = l.id) as total_transactions,
        (SELECT COALESCE(SUM(amount), 0) FROM leader_pension_contributions WHERE leader_id = l.id AND status = 'approved') as total_amount
      FROM leaders l
      JOIN leader_pension_balances lp ON l.id = lp.leader_id
      WHERE l.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pension data not found' });
    }

    res.json({ success: true, pension: result.rows[0] });

  } catch (err) {
    console.error('Error fetching pension:', err.message);
    res.status(500).json({ error: 'Failed to fetch pension' });
  }
});

// ============================================================
// 6. GET PENSION CONTRIBUTION HISTORY (Latest 10)
// ============================================================
router.get('/pension/history', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const result = await db.query(`
      SELECT 
        pc.*,
        u.fullname as supporter_name,
        u.phone as supporter_phone
      FROM leader_pension_contributions pc
      JOIN leaders l ON pc.leader_id = l.id
      LEFT JOIN users u ON pc.user_id = u.id
      WHERE l.user_id = $1
      ORDER BY pc.contribution_date DESC
      LIMIT ${parseInt(limit)}
    `, [userId]);

    res.json({ success: true, contributions: result.rows });

  } catch (err) {
    console.error('Error fetching contribution history:', err.message);
    res.status(500).json({ error: 'Failed to fetch contribution history' });
  }
});

// ============================================================
// 7. GET SUPPORTERS LIST
// ============================================================
router.get('/supporters', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        s.*,
        u.fullname as supporter_name,
        u.phone as supporter_phone,
        u.email as supporter_email
      FROM leader_supporters s
      JOIN leaders l ON s.leader_id = l.id
      JOIN users u ON s.user_id = u.id
      WHERE l.user_id = $1 AND s.status = 'active'
      ORDER BY s.createdat DESC
    `, [userId]);

    res.json({ success: true, supporters: result.rows });

  } catch (err) {
    console.error('Error fetching supporters:', err.message);
    res.status(500).json({ error: 'Failed to fetch supporters' });
  }
});

// ============================================================
// 8. REQUEST PENSION WITHDRAWAL
// ============================================================
router.post('/pension/withdraw-request', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { amount, notes } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Minimum withdrawal request is KES 100' });
    }

    // Get leader and pension balance
    const result = await db.query(`
      SELECT l.id as leader_id, lp.total_contributions
      FROM leaders l
      JOIN leader_pension_balances lp ON l.id = lp.leader_id
      WHERE l.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leader profile not found' });
    }

    const leader = result.rows[0];
    const totalAmount = parseInt(leader.total_contributions) || 0;

    if (amount > totalAmount) {
      return res.status(400).json({ 
        error: 'Insufficient pension balance',
        balance: totalAmount,
        requested: amount
      });
    }

    // Create withdrawal request
    const requestId = 'pwr-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
    
    await db.query(`
      INSERT INTO leader_withdrawal_requests (
        id, leader_id, amount, notes, status, requested_at, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW(), NOW())
    `, [requestId, leader.leader_id, amount, notes || null]);

    res.json({
      success: true,
      message: 'Withdrawal request submitted. Awaiting admin approval.',
      request_id: requestId,
      amount: amount
    });

  } catch (err) {
    console.error('Error requesting withdrawal:', err.message);
    res.status(500).json({ error: 'Failed to request withdrawal' });
  }
});

// ============================================================
// 9. GET WITHDRAWAL REQUESTS (Leader's own requests)
// ============================================================
router.get('/pension/withdrawals', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        wr.*
      FROM leader_withdrawal_requests wr
      JOIN leaders l ON wr.leader_id = l.id
      WHERE l.user_id = $1
      ORDER BY wr.requested_at DESC
    `, [userId]);

    res.json({ success: true, withdrawals: result.rows });

  } catch (err) {
    console.error('Error fetching withdrawal requests:', err.message);
    res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
  }
});

// ============================================================
// 10. GET NOTIFICATIONS
// ============================================================
router.get('/notifications', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const result = await db.query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY createdat DESC
      LIMIT ${parseInt(limit)}
    `, [userId]);

    // Mark as read
    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ success: true, notifications: result.rows });

  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ============================================================
// 11. GET UNREAD NOTIFICATION COUNT
// ============================================================
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ success: true, unreadCount: parseInt(result.rows[0].count) });

  } catch (err) {
    console.error('Error fetching unread count:', err.message);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ============================================================
// 12. GET PUBLIC LEADER PROFILE (For clients to view)
// ============================================================
router.get('/public/:id', async (req, res) => {
  try {
    const db = await getClient();
    const identifier = req.params.id;

    // Check if it's a user ID or share link
    const isShareLink = identifier.startsWith('leader-');
    let query;
    let params;

    if (isShareLink) {
      query = `
        SELECT 
          u.id as user_id,
          u.fullname,
          u.phone,
          u.email,
          u.profile_image,
          u.bio,
          l.id as leader_id,
          l.leader_type,
          l.title,
          l.location,
          l.county,
          l.qualifications,
          l.years_of_service,
          l.is_verified,
          l.is_public,
          l.share_link,
          lp.total_contributions,
          lp.total_supporters
        FROM leaders l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
        WHERE l.share_link = $1 AND l.is_public = true
      `;
      params = [identifier];
    } else {
      query = `
        SELECT 
          u.id as user_id,
          u.fullname,
          u.phone,
          u.email,
          u.profile_image,
          u.bio,
          l.id as leader_id,
          l.leader_type,
          l.title,
          l.location,
          l.county,
          l.qualifications,
          l.years_of_service,
          l.is_verified,
          l.is_public,
          l.share_link,
          lp.total_contributions,
          lp.total_supporters
        FROM leaders l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
        WHERE u.id = $1 AND l.is_public = true
      `;
      params = [identifier];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leader not found or not public' });
    }

    const leader = result.rows[0];

    // Get recent supporters
    const supportersResult = await db.query(`
      SELECT 
        u.fullname,
        u.profile_image,
        s.amount,
        s.createdat
      FROM leader_supporters s
      JOIN users u ON s.user_id = u.id
      WHERE s.leader_id = $1 AND s.status = 'active'
      ORDER BY s.createdat DESC
      LIMIT 5
    `, [leader.leader_id]);

    res.json({
      success: true,
      leader: {
        id: leader.user_id,
        leader_id: leader.leader_id,
        name: leader.fullname,
        phone: leader.phone,
        email: leader.email,
        profile_image: leader.profile_image,
        bio: leader.bio,
        leader_type: leader.leader_type,
        title: leader.title || null,
        location: leader.location,
        county: leader.county,
        qualifications: leader.qualifications || [],
        years_of_service: parseInt(leader.years_of_service) || 0,
        verified: leader.is_verified || false,
        total_contributions: parseInt(leader.total_contributions) || 0,
        total_supporters: parseInt(leader.total_supporters) || 0,
        share_link: leader.share_link,
        recent_supporters: supportersResult.rows.map(s => ({
          name: s.fullname,
          profile_image: s.profile_image,
          amount: parseInt(s.amount),
          date: s.createdat
        }))
      }
    });

  } catch (err) {
    console.error('Error fetching public leader profile:', err.message);
    res.status(500).json({ error: 'Failed to fetch leader profile' });
  }
});

// ============================================================
// 13. SELF-CONTRIBUTE TO PENSION (INSTANT - No Admin Approval)
// ============================================================
router.post('/pension/self-contribute', async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || parseInt(amount) < 10) {
      return res.status(400).json({ error: 'Minimum contribution is KES 10' });
    }

    const contributionAmount = parseInt(amount);

    // Get leader
    const leaderResult = await db.query(
      'SELECT id FROM leaders WHERE user_id = $1',
      [userId]
    );

    if (leaderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Leader profile not found' });
    }

    const leaderId = leaderResult.rows[0].id;

    // Get user's virtual account (wallet)
    const virtualAccountService = require('../services/virtual-account.service');
    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({ 
        error: 'Virtual account not found. Please contact support.' 
      });
    }

    // Check if user has enough balance in wallet
    if (userAccount.balance < contributionAmount) {
      return res.status(400).json({ 
        error: 'Insufficient wallet balance',
        balance: userAccount.balance,
        required: contributionAmount
      });
    }

    const PENSION_MASTER_ACCOUNT = process.env.PENSION_MASTER_ACCOUNT || 'PENSION-MASTER-001';

    // Check if Pension Master account exists
    const masterAccount = await virtualAccountService.getAccountByNumber(PENSION_MASTER_ACCOUNT);

    if (!masterAccount) {
      console.error('[Pension] Master account not found:', PENSION_MASTER_ACCOUNT);
      return res.status(500).json({ 
        error: 'Pension master account not configured. Please contact support.' 
      });
    }

    await db.query('BEGIN');

    try {
      // 1. Transfer from user's wallet to Pension Master account (DEDUCT FROM WALLET)
      await virtualAccountService.processTransfer(
        userId,
        userAccount.account_number,
        PENSION_MASTER_ACCOUNT,
        contributionAmount,
        `Self-contribution for leader (${leaderId})`
      );

      // 2. Record contribution in leader_pension_contributions (INSTANT APPROVED)
      const contributionId = 'pcont-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      await db.query(`
        INSERT INTO leader_pension_contributions (
          id, leader_id, user_id, amount, payment_method, status, contribution_date, is_self_contribution
        ) VALUES ($1, $2, $3, $4, 'wallet', 'approved', NOW(), true)
      `, [contributionId, leaderId, userId, contributionAmount]);

      // 3. Update pension balances (INSTANT - ADD TO PENSION BALANCE)
      await db.query(`
        UPDATE leader_pension_balances 
        SET total_contributions = total_contributions + $1,
            updatedat = NOW()
        WHERE leader_id = $2
      `, [contributionAmount, leaderId]);

      // 4. Create notification for leader
      const notificationId = 'notif-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        notificationId,
        userId,
        'Pension Self-Contribution',
        `You have successfully contributed KES ${contributionAmount.toLocaleString()} to your pension fund.`,
        'pension',
        `/leader-pension`
      ]);

      await db.query('COMMIT');

      const updatedAccount = await virtualAccountService.getUserAccount(userId);

      res.json({
        success: true,
        message: `Self-contribution of KES ${contributionAmount.toLocaleString()} recorded successfully. Funds added to your pension balance.`,
        contribution_id: contributionId,
        new_wallet_balance: updatedAccount?.balance || 0,
        amount: contributionAmount,
        status: 'approved'
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error recording self-contribution:', err.message);
    res.status(500).json({ error: 'Failed to record self-contribution' });
  }
});

module.exports = router;