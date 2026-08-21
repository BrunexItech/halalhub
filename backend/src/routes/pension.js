const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const crypto = require('crypto');
const virtualAccountService = require('../services/virtual-account.service');
const bankClient = require('../services/bank-client');

// ============================================================
// Database Connection Pool (removed hardcoded credentials)
// ============================================================
const dbPool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  max: 20,
});

// Pension Master Account (where contributions are held)
const PENSION_MASTER_ACCOUNT = process.env.PENSION_MASTER_ACCOUNT || 'PENSION-MASTER-001';

// ============================================================
// 1. GET PENSION STATS (Public)
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const leadersResult = await dbPool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND leader_status = $2',
      ['leader', 'approved']
    );

    const leadersByType = await dbPool.query(`
      SELECT leader_type, COUNT(*) as count 
      FROM leaders 
      WHERE status = 'approved' 
      GROUP BY leader_type
    `);

    const supportersResult = await dbPool.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM leader_supporters WHERE status = $1',
      ['active']
    );

    const contributionsResult = await dbPool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM leader_pension_contributions WHERE status = $1',
      ['approved']
    );

    const pendingResult = await dbPool.query(
      'SELECT COUNT(*) as count FROM leader_pension_contributions WHERE status = $1',
      ['pending']
    );

    const typeBreakdown = {};
    leadersByType.rows.forEach(row => {
      typeBreakdown[row.leader_type] = parseInt(row.count);
    });

    res.json({
      success: true,
      stats: {
        totalLeaders: parseInt(leadersResult.rows[0].count) || 0,
        totalSupporters: parseInt(supportersResult.rows[0].count) || 0,
        totalContributions: parseInt(contributionsResult.rows[0].total) || 0,
        pendingContributions: parseInt(pendingResult.rows[0].count) || 0,
        typeBreakdown: typeBreakdown
      }
    });

  } catch (err) {
    console.error('Error fetching pension stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch pension stats' });
  }
});

// ============================================================
// 2. GET ALL PUBLIC LEADERS (For clients to support)
// ============================================================
router.get('/leaders', async (req, res) => {
  try {
    const { leader_type, search, limit = 50 } = req.query;

    let query = `
      SELECT 
        l.id,
        l.user_id,
        l.leader_type,
        l.name,
        l.title,
        l.location,
        l.region as county,
        l.qualifications,
        l.years_of_service,
        l.is_verified,
        l.is_public,
        l.share_link,
        u.fullname as name,
        u.profile_image,
        u.bio,
        lp.total_contributions,
        lp.total_supporters
      FROM leaders l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
      WHERE l.is_public = true AND l.status = 'approved'
    `;
    const params = [];
    let paramIndex = 1;

    if (leader_type && leader_type !== 'all') {
      query += ` AND l.leader_type = $${paramIndex}`;
      params.push(leader_type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (u.fullname ILIKE $${paramIndex} OR l.location ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY lp.total_supporters DESC NULLS LAST, u.fullname ASC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await dbPool.query(query, params);

    res.json({
      success: true,
      leaders: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching public leaders:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaders' });
  }
});

// ============================================================
// 3. GET LEADER BY SHARE LINK OR ID (Public)
// ============================================================
router.get('/leaders/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const isShareLink = identifier.startsWith('leader-');
    
    let query;
    let params;

    if (isShareLink) {
      query = `
        SELECT 
          l.id,
          l.user_id,
          l.leader_type,
          l.name,
          l.title,
          l.location,
          l.county,
          l.qualifications,
          l.years_of_service,
          l.is_verified,
          l.is_public,
          l.share_link,
          u.fullname as name,
          u.profile_image,
          u.bio,
          u.phone,
          u.email,
          lp.total_contributions,
          lp.total_supporters
        FROM leaders l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
        WHERE l.share_link = $1 AND l.is_public = true AND l.status = 'approved'
      `;
      params = [identifier];
    } else {
      query = `
        SELECT 
          l.id,
          l.user_id,
          l.leader_type,
          l.name,
          l.title,
          l.location,
          l.county,
          l.qualifications,
          l.years_of_service,
          l.is_verified,
          l.is_public,
          l.share_link,
          u.fullname as name,
          u.profile_image,
          u.bio,
          u.phone,
          u.email,
          lp.total_contributions,
          lp.total_supporters
        FROM leaders l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
        WHERE l.id = $1 AND l.is_public = true AND l.status = 'approved'
      `;
      params = [identifier];
    }

    const result = await dbPool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leader not found or not public' });
    }

    const leader = result.rows[0];

    const supportersResult = await dbPool.query(`
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
    `, [leader.id]);

    res.json({
      success: true,
      leader: {
        id: leader.user_id,
        leader_id: leader.id,
        name: leader.name,
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
    console.error('Error fetching leader by identifier:', err.message);
    res.status(500).json({ error: 'Failed to fetch leader' });
  }
});

// ============================================================
// 4. SUPPORT LEADER (Contribute to their pension) - PIN REQUIRED
// ============================================================
router.post('/contribute', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { leader_id, amount, frequency = 'once', payment_reference = null, pin } = req.body;

    // Validate PIN is provided
    if (!pin) {
      return res.status(400).json({
        success: false,
        error: 'PIN is required to contribute'
      });
    }

    // Verify PIN
    const userResult = await dbPool.query(
      'SELECT pinhash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const validPin = await bcrypt.compare(pin, userResult.rows[0].pinhash);
    if (!validPin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    if (!leader_id) {
      return res.status(400).json({ error: 'Leader ID is required' });
    }

    if (!amount || parseInt(amount) < 10) {
      return res.status(400).json({ error: 'Minimum contribution is KES 10' });
    }

    const contributionAmount = parseInt(amount);

    const leaderCheck = await dbPool.query(`
      SELECT l.id, l.user_id, u.fullname 
      FROM leaders l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = $1 AND l.is_public = true AND l.status = 'approved'
    `, [leader_id]);

    if (leaderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Leader not found or not accepting contributions' });
    }

    const leader = leaderCheck.rows[0];

    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({ 
        error: 'Virtual account not found. Please contact support.' 
      });
    }

    if (userAccount.balance < contributionAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        balance: userAccount.balance,
        required: contributionAmount
      });
    }

    const masterAccount = await virtualAccountService.getAccountByNumber(PENSION_MASTER_ACCOUNT);

    if (!masterAccount) {
      console.error('[Pension] Master account not found:', PENSION_MASTER_ACCOUNT);
      return res.status(500).json({ 
        error: 'Pension master account not configured. Please contact support.' 
      });
    }

    const leaderAccount = await virtualAccountService.getUserAccount(leader.user_id);

    if (!leaderAccount) {
      console.error('[Pension] Leader virtual account not found for user:', leader.user_id);
      return res.status(500).json({ 
        error: 'Leader virtual account not found. Please contact support.' 
      });
    }

    await dbPool.query('BEGIN');

    try {
      await virtualAccountService.processTransfer(
        userId,
        userAccount.account_number,
        PENSION_MASTER_ACCOUNT,
        contributionAmount,
        `Pension contribution for leader (${leader_id})`
      );

      await virtualAccountService.processTransfer(
        'system',
        PENSION_MASTER_ACCOUNT,
        leaderAccount.account_number,
        contributionAmount,
        `Pension distribution for leader (${leader_id})`
      );

      const contributionId = 'pcont-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await dbPool.query(`
        INSERT INTO leader_pension_contributions (
          id, leader_id, user_id, amount, payment_method, payment_reference, status, contribution_date, is_self_contribution
        ) VALUES ($1, $2, $3, $4, 'wallet', $5, 'approved', NOW(), false)
      `, [contributionId, leader_id, userId, contributionAmount, payment_reference || null]);

      await dbPool.query(`
        UPDATE leader_pension_balances 
        SET total_contributions = total_contributions + $1,
            updatedat = NOW()
        WHERE leader_id = $2
      `, [contributionAmount, leader_id]);

      const existingSupporter = await dbPool.query(
        'SELECT id FROM leader_supporters WHERE leader_id = $1 AND user_id = $2',
        [leader_id, userId]
      );

      if (existingSupporter.rows.length > 0) {
        await dbPool.query(
          'UPDATE leader_supporters SET amount = amount + $1, frequency = $2, updatedat = NOW() WHERE id = $3',
          [contributionAmount, frequency || 'once', existingSupporter.rows[0].id]
        );
      } else {
        const supporterId = 'supp-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
        await dbPool.query(`
          INSERT INTO leader_supporters (id, leader_id, user_id, amount, frequency, status, createdat, updatedat)
          VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
        `, [supporterId, leader_id, userId, contributionAmount, frequency || 'once']);

        await dbPool.query(`
          UPDATE leader_pension_balances 
          SET total_supporters = total_supporters + 1,
              updatedat = NOW()
        WHERE leader_id = $1
        `, [leader_id]);
      }

      const notificationId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await dbPool.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        notificationId,
        leader.user_id,
        'New Pension Contribution',
        `A supporter has contributed KES ${contributionAmount.toLocaleString()} to your pension fund. Funds have been added to your pension balance.`,
        'pension',
        `/leader-pension`
      ]);

      await dbPool.query('COMMIT');

      const updatedAccount = await virtualAccountService.getUserAccount(userId);
      const updatedLeaderAccount = await virtualAccountService.getUserAccount(leader.user_id);

      res.json({
        success: true,
        message: 'Contribution recorded successfully. Funds have been added to the leader\'s pension balance.',
        contribution_id: contributionId,
        new_balance: updatedAccount?.balance || 0,
        amount: contributionAmount,
        leader_name: leader.fullname || 'Leader',
        leader_pension_balance: updatedLeaderAccount?.balance || 0,
        status: 'approved'
      });

    } catch (err) {
      await dbPool.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error recording contribution:', err.message);
    res.status(500).json({ error: 'Failed to record contribution' });
  }
});

// ============================================================
// 5. GET PENSION CONTRIBUTION HISTORY (User)
// ============================================================
router.get('/contributions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const result = await dbPool.query(`
      SELECT 
        pc.*,
        u.fullname as leader_name,
        u.phone as leader_phone,
        l.leader_type
      FROM leader_pension_contributions pc
      JOIN leaders l ON pc.leader_id = l.id
      JOIN users u ON l.user_id = u.id
      WHERE pc.user_id = $1
      ORDER BY pc.contribution_date DESC
      LIMIT ${parseInt(limit)}
    `, [userId]);

    res.json({
      success: true,
      contributions: result.rows.map(c => ({
        id: c.id,
        leader_id: c.leader_id,
        leader_name: c.leader_name,
        leader_type: c.leader_type,
        amount: parseInt(c.amount),
        payment_method: c.payment_method,
        payment_reference: c.payment_reference,
        status: c.status,
        is_self_contribution: c.is_self_contribution || false,
        contribution_date: c.contribution_date
      }))
    });

  } catch (err) {
    console.error('Error fetching contribution history:', err.message);
    res.status(500).json({ error: 'Failed to fetch contribution history' });
  }
});

// ============================================================
// 6. ADMIN - GET PENDING CONTRIBUTIONS (Admin only - rarely used now)
// ============================================================
router.get('/admin/pending', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const userCheck = await dbPool.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await dbPool.query(`
      SELECT 
        pc.id,
        pc.leader_id,
        pc.user_id,
        pc.amount,
        pc.payment_method,
        pc.payment_reference,
        pc.status,
        pc.contribution_date,
        pc.is_self_contribution,
        u.fullname as user_name,
        u.phone as user_phone,
        u.email as user_email,
        leader.fullname as leader_name,
        leader.phone as leader_phone,
        l.leader_type,
        lp.total_contributions,
        lp.total_supporters
      FROM leader_pension_contributions pc
      JOIN users u ON pc.user_id = u.id
      JOIN leaders l ON pc.leader_id = l.id
      JOIN users leader ON l.user_id = leader.id
      LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
      WHERE pc.status = 'pending'
      ORDER BY pc.contribution_date ASC
    `);

    res.json({
      success: true,
      contributions: result.rows.map(c => ({
        id: c.id,
        leader_id: c.leader_id,
        leader_name: c.leader_name,
        leader_type: c.leader_type,
        leader_phone: c.leader_phone,
        user_id: c.user_id,
        user_name: c.user_name,
        user_phone: c.user_phone,
        user_email: c.user_email,
        amount: parseInt(c.amount),
        payment_method: c.payment_method,
        payment_reference: c.payment_reference,
        status: c.status,
        is_self_contribution: c.is_self_contribution || false,
        contribution_date: c.contribution_date,
        total_contributions: parseInt(c.total_contributions) || 0,
        total_supporters: parseInt(c.total_supporters) || 0
      }))
    });

  } catch (err) {
    console.error('Error fetching pending contributions:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending contributions' });
  }
});

// ============================================================
// 7. ADMIN - APPROVE CONTRIBUTION (Admin only - rarely used now)
// ============================================================
router.put('/admin/approve/:contributionId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const contributionId = req.params.contributionId;
    const { notes } = req.body;

    const userCheck = await dbPool.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const contributionCheck = await dbPool.query(`
      SELECT 
        pc.*,
        l.user_id as leader_user_id
      FROM leader_pension_contributions pc
      JOIN leaders l ON pc.leader_id = l.id
      WHERE pc.id = $1 AND pc.status = 'pending'
    `, [contributionId]);

    if (contributionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contribution not found or already processed' });
    }

    const contribution = contributionCheck.rows[0];
    const amount = parseInt(contribution.amount);

    const leaderAccount = await virtualAccountService.getUserAccount(contribution.leader_user_id);

    if (!leaderAccount) {
      return res.status(404).json({ 
        error: 'Leader virtual account not found. Please contact support.' 
      });
    }

    const masterAccount = await virtualAccountService.getAccountByNumber(PENSION_MASTER_ACCOUNT);

    if (!masterAccount) {
      return res.status(500).json({ 
        error: 'Pension master account not configured. Please contact support.' 
      });
    }

    if (masterAccount.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient funds in pension master account',
        balance: masterAccount.balance,
        required: amount
      });
    }

    await dbPool.query('BEGIN');

    try {
      await dbPool.query(
        `UPDATE virtual_accounts 
         SET balance = balance - $1, updatedat = NOW()
         WHERE account_number = $2`,
        [amount, PENSION_MASTER_ACCOUNT]
      );

      await dbPool.query(
        `UPDATE virtual_accounts 
         SET balance = balance + $1, updatedat = NOW()
         WHERE account_number = $2`,
        [amount, leaderAccount.account_number]
      );

      const txId = 'btxn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      const ref = 'PEN-APPR-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(4).toString('hex').toUpperCase();

      await dbPool.query(`
        INSERT INTO bank_transactions (
          id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
      `, [
        txId,
        ref,
        PENSION_MASTER_ACCOUNT,
        leaderAccount.account_number,
        amount,
        0,
        'pension_approval',
        'completed',
        `Pension contribution approved - ${contributionId}`
      ]);

      await dbPool.query(`
        UPDATE leader_pension_contributions 
        SET status = 'approved',
            payment_reference = COALESCE($1, payment_reference),
            updatedat = NOW()
        WHERE id = $2
      `, [ref, contributionId]);

      const userNotifId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await dbPool.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        userNotifId,
        contribution.user_id,
        'Pension Contribution Approved',
        `Your pension contribution of KES ${amount.toLocaleString()} to ${contribution.leader_name || 'a leader'} has been approved and transferred.`,
        'pension',
        `/pension/contributions`
      ]);

      const leaderNotifId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await dbPool.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        leaderNotifId,
        contribution.leader_user_id,
        'Pension Contribution Received',
        `A pension contribution of KES ${amount.toLocaleString()} has been approved and added to your pension fund.`,
        'pension',
        `/leader-pension`
      ]);

      await dbPool.query('COMMIT');

      res.json({
        success: true,
        message: 'Contribution approved and transferred successfully',
        contribution_id: contributionId,
        amount: amount,
        reference: ref,
        leader_id: contribution.leader_id
      });

    } catch (err) {
      await dbPool.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error approving contribution:', err.message);
    res.status(500).json({ error: 'Failed to approve contribution' });
  }
});

// ============================================================
// 8. ADMIN - REJECT CONTRIBUTION (Admin only - rarely used now)
// ============================================================
router.put('/admin/reject/:contributionId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const contributionId = req.params.contributionId;
    const { reason } = req.body;

    const userCheck = await dbPool.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const contributionCheck = await dbPool.query(`
      SELECT 
        pc.*,
        l.user_id as leader_user_id
      FROM leader_pension_contributions pc
      JOIN leaders l ON pc.leader_id = l.id
      WHERE pc.id = $1 AND pc.status = 'pending'
    `, [contributionId]);

    if (contributionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contribution not found or already processed' });
    }

    const contribution = contributionCheck.rows[0];
    const amount = parseInt(contribution.amount);

    const userAccount = await virtualAccountService.getUserAccount(contribution.user_id);

    if (!userAccount) {
      return res.status(404).json({ 
        error: 'User virtual account not found. Please contact support.' 
      });
    }

    const masterAccount = await virtualAccountService.getAccountByNumber(PENSION_MASTER_ACCOUNT);

    if (!masterAccount) {
      return res.status(500).json({ 
        error: 'Pension master account not configured. Please contact support.' 
      });
    }

    await dbPool.query('BEGIN');

    try {
      await dbPool.query(
        `UPDATE virtual_accounts 
         SET balance = balance - $1, updatedat = NOW()
         WHERE account_number = $2`,
        [amount, PENSION_MASTER_ACCOUNT]
      );

      await dbPool.query(
        `UPDATE virtual_accounts 
         SET balance = balance + $1, updatedat = NOW()
         WHERE account_number = $2`,
        [amount, userAccount.account_number]
      );

      const txId = 'btxn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      const ref = 'PEN-REJ-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(4).toString('hex').toUpperCase();

      await dbPool.query(`
        INSERT INTO bank_transactions (
          id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
      `, [
        txId,
        ref,
        PENSION_MASTER_ACCOUNT,
        userAccount.account_number,
        amount,
        0,
        'pension_refund',
        'completed',
        `Pension contribution rejected - ${contributionId}`
      ]);

      await dbPool.query(`
        UPDATE leader_pension_contributions 
        SET status = 'rejected',
            payment_reference = COALESCE($1, payment_reference),
            updatedat = NOW()
        WHERE id = $2
      `, [ref, contributionId]);

      const userNotifId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await dbPool.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        userNotifId,
        contribution.user_id,
        'Pension Contribution Rejected',
        `Your pension contribution of KES ${amount.toLocaleString()} has been rejected. ${reason || 'Please contact support for more details.'}`,
        'pension',
        `/pension/contributions`
      ]);

      await dbPool.query('COMMIT');

      res.json({
        success: true,
        message: 'Contribution rejected and refunded successfully',
        contribution_id: contributionId,
        amount: amount,
        reference: ref
      });

    } catch (err) {
      await dbPool.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error rejecting contribution:', err.message);
    res.status(500).json({ error: 'Failed to reject contribution' });
  }
});

// ============================================================
// 9. ADMIN - GET CONTRIBUTION STATS (Admin only)
// ============================================================
router.get('/admin/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const userCheck = await dbPool.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await dbPool.query(`
      SELECT 
        COUNT(*) as total_contributions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN is_self_contribution = true THEN 1 ELSE 0 END) as self_contributions,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
        SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END) as rejected_amount
      FROM leader_pension_contributions
    `);

    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        total: parseInt(stats.total_contributions) || 0,
        pending: parseInt(stats.pending_count) || 0,
        approved: parseInt(stats.approved_count) || 0,
        rejected: parseInt(stats.rejected_count) || 0,
        selfContributions: parseInt(stats.self_contributions) || 0,
        pendingAmount: parseInt(stats.pending_amount) || 0,
        approvedAmount: parseInt(stats.approved_amount) || 0,
        rejectedAmount: parseInt(stats.rejected_amount) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching admin stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// ============================================================
// 10. ADMIN - GET ALL WITHDRAWAL REQUESTS (Admin only)
// ============================================================
router.get('/admin/withdrawals', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const userCheck = await dbPool.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, limit = 100 } = req.query;

    let query = `
      SELECT 
        wr.*,
        u.fullname as leader_name,
        u.phone as leader_phone,
        u.email as leader_email,
        l.leader_type,
        lp.total_contributions
      FROM leader_withdrawal_requests wr
      JOIN leaders l ON wr.leader_id = l.id
      JOIN users u ON l.user_id = u.id
      LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      query += ` AND wr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY wr.requested_at ASC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await dbPool.query(query, params);

    res.json({
      success: true,
      withdrawals: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching withdrawal requests:', err.message);
    res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
  }
});

// ============================================================
// 11. ADMIN - APPROVE WITHDRAWAL REQUEST (Admin only)
// ============================================================
router.put('/admin/withdrawals/:id/approve', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawalId = req.params.id;
    const { notes } = req.body;

    const userCheck = await dbPool.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const withdrawalCheck = await dbPool.query(`
      SELECT 
        wr.*,
        l.user_id as leader_user_id,
        lp.total_contributions
      FROM leader_withdrawal_requests wr
      JOIN leaders l ON wr.leader_id = l.id
      LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
      WHERE wr.id = $1 AND wr.status = 'pending'
    `, [withdrawalId]);

    if (withdrawalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Withdrawal request not found or already processed' });
    }

    const withdrawal = withdrawalCheck.rows[0];
    const amount = parseInt(withdrawal.amount);
    const currentPensionBalance = parseInt(withdrawal.total_contributions) || 0;

    if (currentPensionBalance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient pension balance',
        balance: currentPensionBalance,
        required: amount
      });
    }

    const leaderAccount = await virtualAccountService.getUserAccount(withdrawal.leader_user_id);

    if (!leaderAccount) {
      return res.status(404).json({ 
        error: 'Leader virtual account not found. Please contact support.' 
      });
    }

    const masterAccount = await virtualAccountService.getAccountByNumber(PENSION_MASTER_ACCOUNT);

    if (!masterAccount) {
      return res.status(500).json({ 
        error: 'Pension master account not configured. Please contact support.' 
      });
    }

    await dbPool.query('BEGIN');

    try {
      await virtualAccountService.processTransfer(
        'system',
        PENSION_MASTER_ACCOUNT,
        leaderAccount.account_number,
        amount,
        `Pension withdrawal approved - ${withdrawalId}`
      );

      await dbPool.query(`
        UPDATE leader_pension_balances 
        SET total_contributions = total_contributions - $1,
            updatedat = NOW()
        WHERE leader_id = $2
      `, [amount, withdrawal.leader_id]);

      const txId = 'btxn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      const ref = 'PEN-WTH-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(4).toString('hex').toUpperCase();

      await dbPool.query(`
        INSERT INTO bank_transactions (
          id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
      `, [
        txId,
        ref,
        PENSION_MASTER_ACCOUNT,
        leaderAccount.account_number,
        amount,
        0,
        'pension_withdrawal',
        'completed',
        `Pension withdrawal approved - ${withdrawalId}`
      ]);

      await dbPool.query(`
        UPDATE leader_withdrawal_requests 
        SET status = 'approved',
            admin_notes = COALESCE($1, admin_notes),
            approved_at = NOW(),
            updatedat = NOW()
        WHERE id = $2
      `, [notes || null, withdrawalId]);

      const leaderNotifId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await dbPool.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        leaderNotifId,
        withdrawal.leader_user_id,
        'Pension Withdrawal Approved',
        `Your pension withdrawal request of KES ${amount.toLocaleString()} has been approved. Funds have been added to your wallet. Your remaining pension balance is KES ${(currentPensionBalance - amount).toLocaleString()}.`,
        'pension',
        `/leader-pension`
      ]);

      await dbPool.query('COMMIT');

      const updatedAccount = await virtualAccountService.getUserAccount(withdrawal.leader_user_id);
      const newPensionBalance = Math.max(0, currentPensionBalance - amount);

      res.json({
        success: true,
        message: 'Withdrawal approved. Pension balance reduced and wallet credited.',
        withdrawal_id: withdrawalId,
        amount: amount,
        reference: ref,
        wallet_balance: updatedAccount?.balance || 0,
        pension_balance: newPensionBalance
      });

    } catch (err) {
      await dbPool.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error approving withdrawal:', err.message);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

// ============================================================
// 12. ADMIN - REJECT WITHDRAWAL REQUEST (Admin only)
// ============================================================
router.put('/admin/withdrawals/:id/reject', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawalId = req.params.id;
    const { reason } = req.body;

    const userCheck = await dbPool.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const withdrawalCheck = await dbPool.query(`
      SELECT 
        wr.*,
        l.user_id as leader_user_id
      FROM leader_withdrawal_requests wr
      JOIN leaders l ON wr.leader_id = l.id
      WHERE wr.id = $1 AND wr.status = 'pending'
    `, [withdrawalId]);

    if (withdrawalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Withdrawal request not found or already processed' });
    }

    const withdrawal = withdrawalCheck.rows[0];
    const amount = parseInt(withdrawal.amount);

    await dbPool.query('BEGIN');

    try {
      await dbPool.query(`
        UPDATE leader_withdrawal_requests 
        SET status = 'rejected',
            admin_notes = COALESCE($1, admin_notes),
            rejected_at = NOW(),
            updatedat = NOW()
        WHERE id = $2
      `, [reason || null, withdrawalId]);

      const leaderNotifId = 'notif-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await dbPool.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        leaderNotifId,
        withdrawal.leader_user_id,
        'Pension Withdrawal Rejected',
        `Your pension withdrawal request of KES ${amount.toLocaleString()} has been rejected. ${reason || 'Please contact support for more details.'}`,
        'pension',
        `/leader-pension`
      ]);

      await dbPool.query('COMMIT');

      res.json({
        success: true,
        message: 'Withdrawal request rejected',
        withdrawal_id: withdrawalId
      });

    } catch (err) {
      await dbPool.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error rejecting withdrawal:', err.message);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

// ============================================================
// 13. SYNC PENSION BALANCE WITH BANK (Admin)
// ============================================================
router.post('/sync', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const userCheck = await dbPool.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await virtualAccountService.syncWithBank(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to sync with bank'
      });
    }

    res.json({
      success: true,
      message: 'Balance synced with bank successfully',
      data: {
        ourBalance: result.ourBalance,
        bankBalance: result.bankBalance,
        isSynced: result.isSynced,
        accountNumber: result.accountNumber
      }
    });

  } catch (err) {
    console.error('Error syncing pension balance:', err.message);
    res.status(500).json({ error: 'Failed to sync balance' });
  }
});

module.exports = router;