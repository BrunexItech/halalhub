const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const crypto = require('crypto');
const virtualAccountService = require('../services/virtual-account.service');

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

// Sadaqa Pool Account
const SADAQA_POOL_ACCOUNT = process.env.SADAQA_POOL_ACCOUNT || 'SADAQA-POOL-001';

// ============================================================
// 1. GET ALL SADAQA CAMPAIGNS (Public)
// ============================================================
router.get('/campaigns', async (req, res) => {
  try {
    const { category, status = 'active', limit = 50 } = req.query;

    let query = `
      SELECT 
        id,
        name,
        description,
        organization,
        target,
        raised,
        category,
        location,
        image_url,
        donor_count,
        status,
        createdat,
        end_date,
        verified
      FROM sadaqa_campaigns
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category && category !== 'all') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ` ORDER BY featured DESC, createdat DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await dbPool.query(query, params);

    res.json({
      success: true,
      campaigns: result.rows
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});

// ============================================================
// 2. GET CAMPAIGN BY ID (Public)
// ============================================================
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbPool.query(
      `SELECT 
        id,
        name,
        description,
        organization,
        target,
        raised,
        category,
        location,
        image_url,
        donor_count,
        status,
        createdat,
        end_date,
        verified,
        updates
      FROM sadaqa_campaigns
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    const donationsResult = await dbPool.query(
      `SELECT 
        amount,
        donor_name,
        createdat
      FROM sadaqa_payments
      WHERE campaign_id = $1 AND status = 'completed'
      ORDER BY createdat DESC
      LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      campaign: {
        ...result.rows[0],
        recent_donations: donationsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign'
    });
  }
});

// ============================================================
// 3. GET CAMPAIGN CATEGORIES (Public)
// ============================================================
router.get('/categories', async (req, res) => {
  try {
    const result = await dbPool.query(
      `SELECT DISTINCT category 
       FROM sadaqa_campaigns 
       WHERE status = 'active'
       ORDER BY category ASC`
    );

    const categories = [
      { id: 'orphan', label: 'Orphan Care' },
      { id: 'masjid', label: 'Mosque Projects' },
      { id: 'water', label: 'Water & Food' },
      { id: 'education', label: 'Education' },
      { id: 'medical', label: 'Medical Support' },
      { id: 'emergency', label: 'Emergency Relief' },
      { id: 'imam', label: 'Imam Support' },
      { id: 'community', label: 'Community Development' }
    ];

    const activeCategories = result.rows.map(r => r.category);
    const filtered = categories.filter(c => activeCategories.includes(c.id));

    res.json({
      success: true,
      categories: filtered.length > 0 ? filtered : categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// ============================================================
// 4. DONATE TO SADAQA CAMPAIGN (Authenticated) - PIN REQUIRED
// ============================================================
router.post('/donate', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      campaignId,
      amount,
      isRecurring = false,
      dedication = '',
      isAnonymous = false,
      donorName,
      pin
    } = req.body;

    // Validate PIN is provided
    if (!pin) {
      return res.status(400).json({
        success: false,
        error: 'PIN is required to donate'
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

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Please select a campaign'
      });
    }

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum donation is KES 10'
      });
    }

    const campaignCheck = await dbPool.query(
      `SELECT id, name, organization, target, raised, status 
       FROM sadaqa_campaigns 
       WHERE id = $1 AND status = 'active'`,
      [campaignId]
    );

    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found or inactive'
      });
    }

    const campaign = campaignCheck.rows[0];

    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found. Please contact support.'
      });
    }

    if (userAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: KES ${userAccount.balance.toLocaleString()}`
      });
    }

    await dbPool.query('BEGIN');

    try {
      const ref = 'SDQ-' + Date.now().toString(36).toUpperCase() +
                  crypto.randomBytes(4).toString('hex').toUpperCase();

      const paymentId = 'sdq-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

      await virtualAccountService.processTransfer(
        userId,
        userAccount.account_number,
        SADAQA_POOL_ACCOUNT,
        amount,
        `Sadaqa donation - ${campaign.name}`
      );

      await dbPool.query(
        `INSERT INTO sadaqa_payments (
          id, user_id, campaign_id, amount, reference, dedication, is_anonymous,
          donor_name, status, paid_at, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', NOW(), NOW(), NOW())`,
        [
          paymentId,
          userId,
          campaignId,
          amount,
          ref,
          dedication || '',
          isAnonymous || false,
          isAnonymous ? 'Anonymous' : (donorName || null)
        ]
      );

      await dbPool.query(
        `UPDATE sadaqa_campaigns 
         SET raised = raised + $1, 
             donor_count = donor_count + 1,
             updatedat = NOW()
         WHERE id = $2`,
        [amount, campaignId]
      );

      await dbPool.query(
        `INSERT INTO community_pool (id, type, amount, source, reference, source_id, createdat)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          'pool-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex'),
          'sadaqa',
          amount,
          'user_donation',
          ref,
          paymentId
        ]
      );

      const txId = 'txn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await dbPool.query(
        `INSERT INTO transactions (id, user_id, type, amount, status, reference, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [txId, userId, 'sadaqa', -amount, 'success', ref, `Sadaqa donation to ${campaign.name}`]
      );

      const updatedAccount = await virtualAccountService.getUserAccount(userId);
      const newBalance = updatedAccount?.balance || 0;

      await dbPool.query('COMMIT');

      console.log(`[Sadaqa] ${ref} - KES ${amount} by user ${userId} to ${campaign.name} using virtual account ${userAccount.account_number}`);

      res.status(201).json({
        success: true,
        message: 'Sadaqa donation successful',
        data: {
          reference: ref,
          amount: amount,
          campaign: campaign.name,
          organization: campaign.organization,
          balance: newBalance,
          paymentId: paymentId,
          paidAt: new Date().toISOString(),
          raisedNow: campaign.raised + amount,
          target: campaign.target,
          accountNumber: userAccount.account_number
        }
      });

    } catch (err) {
      await dbPool.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    await dbPool.query('ROLLBACK');
    console.error('Sadaqa donation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Donation failed. Please try again.'
    });
  }
});

// ============================================================
// 5. GET DONATION HISTORY (Authenticated - User)
// ============================================================
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const result = await dbPool.query(
      `SELECT 
        sp.id,
        sp.amount,
        sp.reference,
        sp.dedication,
        sp.is_anonymous,
        sp.status,
        sp.paid_at,
        sp.createdat,
        sc.name as campaign_name,
        sc.organization,
        sc.category
      FROM sadaqa_payments sp
      LEFT JOIN sadaqa_campaigns sc ON sp.campaign_id = sc.id
      WHERE sp.user_id = $1
      ORDER BY sp.createdat DESC
      LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      history: result.rows
    });
  } catch (error) {
    console.error('Error fetching donation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donation history'
    });
  }
});

// ============================================================
// 6. GET DONATION SUMMARY (Authenticated - User)
// ============================================================
router.get('/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await dbPool.query(
      `SELECT 
        COUNT(*) as total_donations,
        SUM(amount) as total_amount,
        COUNT(DISTINCT campaign_id) as unique_campaigns,
        MIN(paid_at) as first_donation,
        MAX(paid_at) as last_donation
      FROM sadaqa_payments
      WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );

    const impactResult = await dbPool.query(
      `SELECT 
        COUNT(DISTINCT sc.category) as categories_supported
      FROM sadaqa_payments sp
      LEFT JOIN sadaqa_campaigns sc ON sp.campaign_id = sc.id
      WHERE sp.user_id = $1 AND sp.status = 'completed'`,
      [userId]
    );

    res.json({
      success: true,
      summary: {
        totalDonations: parseInt(result.rows[0].total_donations) || 0,
        totalAmount: parseInt(result.rows[0].total_amount) || 0,
        uniqueCampaigns: parseInt(result.rows[0].unique_campaigns) || 0,
        categoriesSupported: parseInt(impactResult.rows[0].categories_supported) || 0,
        firstDonation: result.rows[0].first_donation,
        lastDonation: result.rows[0].last_donation
      }
    });
  } catch (error) {
    console.error('Error fetching donation summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donation summary'
    });
  }
});

// ============================================================
// 7. GET IMPACT STATS (Public)
// ============================================================
router.get('/impact', async (req, res) => {
  try {
    const result = await dbPool.query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_raised,
        COUNT(*) as total_donations,
        COUNT(DISTINCT user_id) as unique_donors,
        COUNT(DISTINCT campaign_id) as campaigns_supported
      FROM sadaqa_payments
      WHERE status = 'completed'`
    );

    res.json({
      success: true,
      impact: {
        totalRaised: parseInt(result.rows[0].total_raised) || 0,
        totalDonations: parseInt(result.rows[0].total_donations) || 0,
        uniqueDonors: parseInt(result.rows[0].unique_donors) || 0,
        campaignsSupported: parseInt(result.rows[0].campaigns_supported) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching impact stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch impact stats'
    });
  }
});

// ============================================================
// 8. ADMIN - GET ALL SADAQA DONATIONS
// ============================================================
router.get('/admin/donations', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, date_from, date_to, limit = 100 } = req.query;

    let query = `
      SELECT 
        sp.*,
        u.fullname as user_name,
        u.phone as user_phone,
        u.email as user_email,
        sc.name as campaign_name,
        sc.category as campaign_category,
        sc.organization
      FROM sadaqa_payments sp
      LEFT JOIN users u ON sp.user_id = u.id
      LEFT JOIN sadaqa_campaigns sc ON sp.campaign_id = sc.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND sp.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (date_from) {
      query += ` AND sp.paid_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND sp.paid_at <= $${paramIndex}`;
      params.push(date_to + ' 23:59:59');
      paramIndex++;
    }

    query += ` ORDER BY sp.paid_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await dbPool.query(query, params);

    const statsResult = await dbPool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(amount) as total_amount
      FROM sadaqa_payments
      WHERE status = 'completed'`
    );

    res.json({
      success: true,
      donations: result.rows,
      stats: {
        total: parseInt(statsResult.rows[0].total) || 0,
        totalAmount: parseInt(statsResult.rows[0].total_amount) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donations'
    });
  }
});

// ============================================================
// 9. ADMIN - CREATE SADAQA CAMPAIGN
// ============================================================
router.post('/admin/campaigns', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      organization,
      target,
      category,
      location,
      image_url,
      end_date,
      featured = false
    } = req.body;

    if (!name || !organization || !target || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name, organization, target, and category are required'
      });
    }

    const id = 'cmp-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

    await dbPool.query(
      `INSERT INTO sadaqa_campaigns (
        id, name, description, organization, target, raised, category, location,
        image_url, donor_count, status, featured, end_date, verified, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
      [
        id,
        name,
        description || '',
        organization,
        target,
        0,
        category,
        location || '',
        image_url || '',
        0,
        'active',
        featured || false,
        end_date || null,
        true
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaignId: id
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create campaign'
    });
  }
});

// ============================================================
// 10. ADMIN - UPDATE SADAQA CAMPAIGN
// ============================================================
router.put('/admin/campaigns/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const campaignId = req.params.id;
    const {
      name,
      description,
      organization,
      target,
      category,
      location,
      image_url,
      status,
      featured,
      end_date
    } = req.body;

    const check = await dbPool.query(
      'SELECT id FROM sadaqa_campaigns WHERE id = $1',
      [campaignId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    await dbPool.query(
      `UPDATE sadaqa_campaigns SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        organization = COALESCE($3, organization),
        target = COALESCE($4, target),
        category = COALESCE($5, category),
        location = COALESCE($6, location),
        image_url = COALESCE($7, image_url),
        status = COALESCE($8, status),
        featured = COALESCE($9, featured),
        end_date = COALESCE($10, end_date),
        updatedat = NOW()
      WHERE id = $11`,
      [
        name, description, organization, target, category,
        location, image_url, status, featured, end_date, campaignId
      ]
    );

    res.json({
      success: true,
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign'
    });
  }
});

// ============================================================
// 11. ADMIN - DELETE SADAQA CAMPAIGN
// ============================================================
router.delete('/admin/campaigns/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const campaignId = req.params.id;

    const result = await dbPool.query(
      'DELETE FROM sadaqa_campaigns WHERE id = $1 RETURNING id',
      [campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete campaign'
    });
  }
});

// ============================================================
// 12. ADMIN - GET COMMUNITY POOL (Sadaqa)
// ============================================================
router.get('/admin/pool', authenticate, authorize('admin'), async (req, res) => {
  try {
    const sadaqaPool = await virtualAccountService.getAccountByNumber(SADAQA_POOL_ACCOUNT);
    const sadaqaBalance = sadaqaPool?.balance || 0;

    const disbursedResult = await dbPool.query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_disbursed
      FROM pool_disbursements
      WHERE type = 'sadaqa' AND status = 'completed'`
    );

    res.json({
      success: true,
      pool: {
        sadaqaBalance: sadaqaBalance,
        totalDisbursed: parseInt(disbursedResult.rows[0].total_disbursed) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching pool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pool'
    });
  }
});

module.exports = router;