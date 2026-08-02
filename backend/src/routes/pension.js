const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const { authenticate } = require('../middleware/auth');
const virtualAccountService = require('../services/virtual-account.service');
const bankClient = require('../services/bank-client');
const feeService = require('../services/fee.service');

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

// Pension Master Account (where contributions are held)
const PENSION_MASTER_ACCOUNT = process.env.PENSION_MASTER_ACCOUNT || 'PENSION-MASTER-001';

// ============================================================
// 1. GET PENSION STATS (Public)
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const db = await getClient();

    // Get total imams (approved)
    const imamsResult = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND imam_status = $2',
      ['imam', 'approved']
    );

    // Get total mosques
    const mosquesResult = await db.query(
      'SELECT COUNT(*) as count FROM mosques'
    );

    // Get unique communities (counties where mosques exist)
    const communitiesResult = await db.query(
      'SELECT COUNT(DISTINCT county) as count FROM mosques WHERE county IS NOT NULL'
    );

    // Get total active supporters (clients who have supported at least one imam)
    const supportersResult = await db.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM supporters WHERE status = $1',
      ['active']
    );

    // Get total pension contributions
    const contributionsResult = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM pension_contributions WHERE status = $1',
      ['completed']
    );

    res.json({
      success: true,
      stats: {
        totalImams: parseInt(imamsResult.rows[0].count) || 0,
        totalMosques: parseInt(mosquesResult.rows[0].count) || 0,
        communitiesServed: parseInt(communitiesResult.rows[0].count) || 0,
        monthlyContributors: parseInt(supportersResult.rows[0].count) || 0,
        totalContributions: parseInt(contributionsResult.rows[0].total) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching pension stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch pension stats' });
  }
});

// ============================================================
// 2. GET ALL MOSQUES (Public)
// ============================================================
router.get('/mosques', async (req, res) => {
  try {
    const db = await getClient();
    const { county, search, limit = 50 } = req.query;

    let query = `
      SELECT 
        m.id,
        m.name,
        m.location,
        m.county,
        m.latitude,
        m.longitude,
        u.fullname as imam_name,
        u.id as imam_id
      FROM mosques m
      LEFT JOIN imams i ON m.imam_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (county && county !== 'All') {
      query += ` AND m.county = $${paramIndex}`;
      params.push(county);
      paramIndex++;
    }

    if (search) {
      query += ` AND (m.name ILIKE $${paramIndex} OR u.fullname ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY m.name ASC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      mosques: result.rows.map(m => ({
        id: m.id,
        name: m.name,
        location: m.location,
        county: m.county,
        latitude: m.latitude,
        longitude: m.longitude,
        imam_name: m.imam_name || 'No Imam Assigned',
        imam_id: m.imam_id
      })),
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching mosques:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosques' });
  }
});

// ============================================================
// 3. GET MOSQUE DETAILS (Public)
// ============================================================
router.get('/mosques/:id', async (req, res) => {
  try {
    const db = await getClient();
    const mosqueId = req.params.id;

    const result = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.location,
        m.county,
        m.latitude,
        m.longitude,
        m.createdat,
        u.fullname as imam_name,
        u.id as imam_id,
        u.profile_image as imam_image,
        u.bio as imam_bio,
        i.title as imam_title,
        i.years_of_service,
        i.is_verified as imam_verified
      FROM mosques m
      LEFT JOIN imams i ON m.imam_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE m.id = $1
    `, [mosqueId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mosque not found' });
    }

    // Get imams at this mosque
    const imamsResult = await db.query(`
      SELECT 
        u.id,
        u.fullname,
        u.profile_image,
        i.id as imam_id,
        i.title,
        i.years_of_service,
        i.is_verified,
        pb.total_contributions,
        pb.total_supporters
      FROM imams i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN pension_balances pb ON i.id = pb.imam_id
      WHERE i.mosque_name = $1 AND u.imam_status = 'approved'
      ORDER BY i.years_of_service DESC
    `, [result.rows[0].name]);

    res.json({
      success: true,
      mosque: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        location: result.rows[0].location,
        county: result.rows[0].county,
        latitude: result.rows[0].latitude,
        longitude: result.rows[0].longitude,
        imam_name: result.rows[0].imam_name,
        imam_id: result.rows[0].imam_id,
        imam_image: result.rows[0].imam_image,
        imam_bio: result.rows[0].imam_bio,
        imam_title: result.rows[0].imam_title,
        years_of_service: result.rows[0].years_of_service,
        imam_verified: result.rows[0].imam_verified,
        createdat: result.rows[0].createdat
      },
      imams: imamsResult.rows.map(i => ({
        id: i.id,
        imam_id: i.imam_id,
        name: i.fullname,
        profile_image: i.profile_image,
        title: i.title,
        yearsOfService: parseInt(i.years_of_service) || 0,
        verified: i.is_verified || false,
        totalContributions: parseInt(i.total_contributions) || 0,
        totalSupporters: parseInt(i.total_supporters) || 0
      }))
    });

  } catch (err) {
    console.error('Error fetching mosque details:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosque details' });
  }
});

// ============================================================
// 4. GET IMAM PROFILE (Public)
// ============================================================
router.get('/imams/:id', async (req, res) => {
  try {
    const db = await getClient();
    const imamId = req.params.id;

    const isUser = imamId.startsWith('user-') || imamId.startsWith('client-') || imamId.startsWith('vendor-') || imamId.startsWith('imam-');
    
    let query;
    let params;

    if (isUser) {
      query = `
        SELECT 
          u.id as user_id,
          u.fullname,
          u.phone,
          u.email,
          u.profile_image,
          u.bio,
          i.id as imam_id,
          i.title,
          i.mosque_name,
          i.mosque_location,
          i.mosque_county,
          i.qualifications,
          i.years_of_service,
          i.is_verified,
          pb.total_contributions,
          pb.total_supporters,
          m.id as mosque_id
        FROM users u
        JOIN imams i ON u.id = i.user_id
        LEFT JOIN pension_balances pb ON i.id = pb.imam_id
        LEFT JOIN mosques m ON m.imam_id = i.id
        WHERE u.id = $1 AND u.role = 'imam' AND u.imam_status = 'approved'
      `;
      params = [imamId];
    } else {
      query = `
        SELECT 
          u.id as user_id,
          u.fullname,
          u.phone,
          u.email,
          u.profile_image,
          u.bio,
          i.id as imam_id,
          i.title,
          i.mosque_name,
          i.mosque_location,
          i.mosque_county,
          i.qualifications,
          i.years_of_service,
          i.is_verified,
          pb.total_contributions,
          pb.total_supporters,
          m.id as mosque_id
        FROM imams i
        JOIN users u ON i.user_id = u.id
        LEFT JOIN pension_balances pb ON i.id = pb.imam_id
        LEFT JOIN mosques m ON m.imam_id = i.id
        WHERE i.id = $1 AND u.role = 'imam' AND u.imam_status = 'approved'
      `;
      params = [imamId];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imam not found' });
    }

    const imam = result.rows[0];

    res.json({
      success: true,
      imam: {
        id: imam.user_id,
        imam_id: imam.imam_id,
        name: imam.fullname,
        phone: imam.phone,
        email: imam.email,
        profile_image: imam.profile_image,
        bio: imam.bio,
        title: imam.title || 'Imam',
        mosque_name: imam.mosque_name,
        mosque_location: imam.mosque_location,
        mosque_county: imam.mosque_county,
        mosque_id: imam.mosque_id,
        qualifications: imam.qualifications || [],
        years_of_service: parseInt(imam.years_of_service) || 0,
        verified: imam.is_verified || false,
        total_contributions: parseInt(imam.total_contributions) || 0,
        total_supporters: parseInt(imam.total_supporters) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching imam profile:', err.message);
    res.status(500).json({ error: 'Failed to fetch imam profile' });
  }
});

// ============================================================
// 5. SUPPORT IMAM (Using Virtual Accounts)
// ============================================================
router.post('/contribute', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const { imam_id, amount, frequency = 'once', payment_reference = null } = req.body;

    if (!imam_id) {
      return res.status(400).json({ error: 'Imam ID is required' });
    }

    if (!amount || parseInt(amount) < 10) {
      return res.status(400).json({ error: 'Minimum contribution is KES 10' });
    }

    const contributionAmount = parseInt(amount);

    // Check if imam exists and is approved
    const imamCheck = await db.query(`
      SELECT i.id, i.user_id FROM imams i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = $1 AND u.imam_status = 'approved'
    `, [imam_id]);

    if (imamCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Approved imam not found' });
    }

    const imam = imamCheck.rows[0];

    // Get user's virtual account
    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({ 
        error: 'Virtual account not found. Please contact support.' 
      });
    }

    // Check if user has enough balance
    if (userAccount.balance < contributionAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        balance: userAccount.balance,
        required: contributionAmount
      });
    }

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
      // 1. Transfer from user's virtual account to Pension Master account
      await virtualAccountService.processTransfer(
        userId,
        userAccount.account_number,
        PENSION_MASTER_ACCOUNT,
        contributionAmount,
        `Pension contribution for Imam (${imam_id})`
      );

      // 2. Record contribution in pension_contributions
      const contributionId = 'pcont-' + Date.now();
      await db.query(`
        INSERT INTO pension_contributions (
          id, imam_id, user_id, amount, payment_method, payment_reference, status, contribution_date
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
      `, [contributionId, imam_id, userId, contributionAmount, 'wallet', payment_reference || null]);

      // 3. Update pension_balances for the imam (pending balance)
      await db.query(`
        UPDATE pension_balances 
        SET total_contributions = total_contributions + $1,
            updatedat = NOW()
        WHERE imam_id = $2
      `, [contributionAmount, imam_id]);

      // 4. Add or update supporter
      const existingSupporter = await db.query(
        'SELECT id FROM supporters WHERE imam_id = $1 AND user_id = $2',
        [imam_id, userId]
      );

      if (existingSupporter.rows.length > 0) {
        await db.query(
          'UPDATE supporters SET amount = amount + $1, frequency = $2, updatedat = NOW() WHERE id = $3',
          [contributionAmount, frequency || 'once', existingSupporter.rows[0].id]
        );
      } else {
        const supporterId = 'supp-' + Date.now();
        await db.query(`
          INSERT INTO supporters (id, imam_id, user_id, amount, frequency, status, createdat, updatedat)
          VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
        `, [supporterId, imam_id, userId, contributionAmount, frequency || 'once']);

        await db.query(`
          UPDATE pension_balances 
          SET total_supporters = total_supporters + 1,
              updatedat = NOW()
          WHERE imam_id = $1
        `, [imam_id]);
      }

      // 5. Create notification for imam
      const notificationId = 'notif-' + Date.now();
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        notificationId,
        imam.user_id,
        'New Pension Contribution',
        `A supporter has contributed KES ${contributionAmount.toLocaleString()} to your pension fund. Pending approval.`,
        'pension',
        `/imam-dashboard`
      ]);

      await db.query('COMMIT');

      // Get updated balance
      const updatedAccount = await virtualAccountService.getUserAccount(userId);

      res.json({
        success: true,
        message: 'Contribution recorded successfully. Pending admin approval.',
        contributionId: contributionId,
        newBalance: updatedAccount?.balance || 0,
        amount: contributionAmount,
        imam_name: imamCheck.rows[0].fullname || 'Imam',
        status: 'pending'
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error recording contribution:', err.message);
    res.status(500).json({ error: 'Failed to record contribution' });
  }
});

// ============================================================
// 6. GET PENSION CONTRIBUTION HISTORY (User)
// ============================================================
router.get('/contributions', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const result = await db.query(`
      SELECT 
        pc.*,
        u.fullname as imam_name,
        u.phone as imam_phone
      FROM pension_contributions pc
      JOIN imams i ON pc.imam_id = i.id
      JOIN users u ON i.user_id = u.id
      WHERE pc.user_id = $1
      ORDER BY pc.contribution_date DESC
      LIMIT ${parseInt(limit)}
    `, [userId]);

    res.json({
      success: true,
      contributions: result.rows.map(c => ({
        id: c.id,
        imam_id: c.imam_id,
        imam_name: c.imam_name,
        amount: parseInt(c.amount),
        payment_method: c.payment_method,
        payment_reference: c.payment_reference,
        status: c.status,
        contribution_date: c.contribution_date
      }))
    });

  } catch (err) {
    console.error('Error fetching contribution history:', err.message);
    res.status(500).json({ error: 'Failed to fetch contribution history' });
  }
});

// ============================================================
// 7. ADMIN - GET PENDING CONTRIBUTIONS (Admin only)
// ============================================================
router.get('/admin/pending', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    // Check if user is admin
    const userCheck = await db.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await db.query(`
      SELECT 
        pc.id,
        pc.imam_id,
        pc.user_id,
        pc.amount,
        pc.payment_method,
        pc.payment_reference,
        pc.status,
        pc.contribution_date,
        u.fullname as user_name,
        u.phone as user_phone,
        u.email as user_email,
        imam.fullname as imam_name,
        imam.phone as imam_phone,
        pb.total_contributions,
        pb.total_supporters
      FROM pension_contributions pc
      JOIN users u ON pc.user_id = u.id
      JOIN imams i ON pc.imam_id = i.id
      JOIN users imam ON i.user_id = imam.id
      LEFT JOIN pension_balances pb ON i.id = pb.imam_id
      WHERE pc.status = 'pending'
      ORDER BY pc.contribution_date ASC
    `);

    res.json({
      success: true,
      contributions: result.rows.map(c => ({
        id: c.id,
        imam_id: c.imam_id,
        imam_name: c.imam_name,
        imam_phone: c.imam_phone,
        user_id: c.user_id,
        user_name: c.user_name,
        user_phone: c.user_phone,
        user_email: c.user_email,
        amount: parseInt(c.amount),
        payment_method: c.payment_method,
        payment_reference: c.payment_reference,
        status: c.status,
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
// 8. ADMIN - APPROVE CONTRIBUTION (Admin only)
// ============================================================
router.put('/admin/approve/:contributionId', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const contributionId = req.params.contributionId;
    const { notes } = req.body;

    // Check if user is admin
    const userCheck = await db.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get contribution details
    const contributionCheck = await db.query(`
      SELECT 
        pc.*,
        i.user_id as imam_user_id
      FROM pension_contributions pc
      JOIN imams i ON pc.imam_id = i.id
      WHERE pc.id = $1 AND pc.status = 'pending'
    `, [contributionId]);

    if (contributionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contribution not found or already processed' });
    }

    const contribution = contributionCheck.rows[0];
    const amount = parseInt(contribution.amount);

    // Get Imam's virtual account
    const imamAccount = await virtualAccountService.getUserAccount(contribution.imam_user_id);

    if (!imamAccount) {
      return res.status(404).json({ 
        error: 'Imam virtual account not found. Please contact support.' 
      });
    }

    // Check Pension Master account
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

    await db.query('BEGIN');

    try {
      // 1. Transfer from Pension Master account to Imam's virtual account
      // Direct database update since master is a system account
      await db.query(
        `UPDATE virtual_accounts 
         SET balance = balance - $1, updatedat = NOW()
         WHERE account_number = $2`,
        [amount, PENSION_MASTER_ACCOUNT]
      );

      await db.query(
        `UPDATE virtual_accounts 
         SET balance = balance + $1, updatedat = NOW()
         WHERE account_number = $2`,
        [amount, imamAccount.account_number]
      );

      // 2. Record bank transaction
      const txId = 'btxn-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      const ref = 'PEN-APPR-' + Date.now().toString(36).toUpperCase() + require('crypto').randomBytes(4).toString('hex').toUpperCase();

      await db.query(`
        INSERT INTO bank_transactions (
          id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
      `, [
        txId,
        ref,
        PENSION_MASTER_ACCOUNT,
        imamAccount.account_number,
        amount,
        0,
        'pension_approval',
        'completed',
        `Pension contribution approved - ${contributionId}`
      ]);

      // 3. Update contribution status
      await db.query(`
        UPDATE pension_contributions 
        SET status = 'approved',
            payment_reference = COALESCE($1, payment_reference),
            updatedat = NOW()
        WHERE id = $2
      `, [ref, contributionId]);

      // 4. Create notification for user (supporter)
      const userNotifId = 'notif-' + Date.now();
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        userNotifId,
        contribution.user_id,
        'Pension Contribution Approved',
        `Your pension contribution of KES ${amount.toLocaleString()} to ${contribution.imam_name || 'an Imam'} has been approved and transferred.`,
        'pension',
        `/pension/contributions`
      ]);

      // 5. Create notification for imam
      const imamNotifId = 'notif-' + Date.now();
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        imamNotifId,
        contribution.imam_user_id,
        'Pension Contribution Received',
        `A pension contribution of KES ${amount.toLocaleString()} has been approved and added to your pension fund.`,
        'pension',
        `/imam-dashboard`
      ]);

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Contribution approved and transferred successfully',
        contributionId: contributionId,
        amount: amount,
        reference: ref,
        imam_id: contribution.imam_id
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error approving contribution:', err.message);
    res.status(500).json({ error: 'Failed to approve contribution' });
  }
});

// ============================================================
// 9. ADMIN - REJECT CONTRIBUTION (Admin only)
// ============================================================
router.put('/admin/reject/:contributionId', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const contributionId = req.params.contributionId;
    const { reason } = req.body;

    // Check if user is admin
    const userCheck = await db.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get contribution details
    const contributionCheck = await db.query(`
      SELECT 
        pc.*,
        i.user_id as imam_user_id
      FROM pension_contributions pc
      JOIN imams i ON pc.imam_id = i.id
      WHERE pc.id = $1 AND pc.status = 'pending'
    `, [contributionId]);

    if (contributionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contribution not found or already processed' });
    }

    const contribution = contributionCheck.rows[0];
    const amount = parseInt(contribution.amount);

    // Get user's virtual account to refund
    const userAccount = await virtualAccountService.getUserAccount(contribution.user_id);

    if (!userAccount) {
      return res.status(404).json({ 
        error: 'User virtual account not found. Please contact support.' 
      });
    }

    // Check Pension Master account
    const masterAccount = await virtualAccountService.getAccountByNumber(PENSION_MASTER_ACCOUNT);

    if (!masterAccount) {
      return res.status(500).json({ 
        error: 'Pension master account not configured. Please contact support.' 
      });
    }

    await db.query('BEGIN');

    try {
      // 1. Refund from Pension Master account back to user's virtual account
      await db.query(
        `UPDATE virtual_accounts 
         SET balance = balance - $1, updatedat = NOW()
         WHERE account_number = $2`,
        [amount, PENSION_MASTER_ACCOUNT]
      );

      await db.query(
        `UPDATE virtual_accounts 
         SET balance = balance + $1, updatedat = NOW()
         WHERE account_number = $2`,
        [amount, userAccount.account_number]
      );

      // 2. Record bank transaction
      const txId = 'btxn-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      const ref = 'PEN-REJ-' + Date.now().toString(36).toUpperCase() + require('crypto').randomBytes(4).toString('hex').toUpperCase();

      await db.query(`
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

      // 3. Update contribution status
      await db.query(`
        UPDATE pension_contributions 
        SET status = 'rejected',
            payment_reference = COALESCE($1, payment_reference),
            updatedat = NOW()
        WHERE id = $2
      `, [ref, contributionId]);

      // 4. Create notification for user
      const userNotifId = 'notif-' + Date.now();
      await db.query(`
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

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Contribution rejected and refunded successfully',
        contributionId: contributionId,
        amount: amount,
        reference: ref
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error rejecting contribution:', err.message);
    res.status(500).json({ error: 'Failed to reject contribution' });
  }
});

// ============================================================
// 10. ADMIN - GET CONTRIBUTION STATS (Admin only)
// ============================================================
router.get('/admin/stats', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    // Check if user is admin
    const userCheck = await db.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_contributions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
        SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END) as rejected_amount
      FROM pension_contributions
    `);

    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        total: parseInt(stats.total_contributions) || 0,
        pending: parseInt(stats.pending_count) || 0,
        approved: parseInt(stats.approved_count) || 0,
        rejected: parseInt(stats.rejected_count) || 0,
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
// 11. SYNC PENSION BALANCE WITH BANK (Admin)
// ============================================================
router.post('/sync', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is admin
    const db = await getClient();
    const userCheck = await db.query(
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