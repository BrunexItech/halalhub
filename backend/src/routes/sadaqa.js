const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
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

// Sadaqa Pool Account
const SADAQA_POOL_ACCOUNT = process.env.SADAQA_POOL_ACCOUNT || 'SADAQA-POOL-001';

// ============================================================
// 1. GET ALL SADAQA CAMPAIGNS (Public)
// ============================================================
router.get('/campaigns', async (req, res) => {
  try {
    const db = await getClient();
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

    const result = await db.query(query, params);

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
    const db = await getClient();
    const { id } = req.params;

    const result = await db.query(
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

    // Get recent donations for this campaign
    const donationsResult = await db.query(
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
    const db = await getClient();

    const result = await db.query(
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

    // Filter categories that have campaigns
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
// 4. DONATE TO SADAQA CAMPAIGN (Authenticated)
// ============================================================
router.post('/donate', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const {
      campaignId,
      amount,
      isRecurring = false,
      dedication = '',
      isAnonymous = false,
      donorName
    } = req.body;

    // Validate input
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

    // Check campaign exists and is active
    const campaignCheck = await db.query(
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

    // ============================================================
    // VIRTUAL ACCOUNT FLOW - REPLACES OLD WALLET SYSTEM
    // ============================================================

    // 1. Get user's virtual account
    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found. Please contact support.'
      });
    }

    // 2. Check if user has enough balance
    if (userAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: KES ${userAccount.balance.toLocaleString()}`
      });
    }

    // Begin transaction
    await db.query('BEGIN');

    try {
      // 3. Generate reference
      const ref = 'SDQ-' + Date.now().toString(36).toUpperCase() +
                  crypto.randomBytes(4).toString('hex').toUpperCase();

      const paymentId = 'sdq-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

      // 4. DEDUCT FROM VIRTUAL ACCOUNT using virtualAccountService
      await virtualAccountService.processTransfer(
        userId,                                    // User ID
        userAccount.account_number,               // From account (user's virtual account)
        SADAQA_POOL_ACCOUNT,                      // To account (Sadaqa pool account)
        amount,                                   // Amount
        `Sadaqa donation - ${campaign.name}`      // Description
      );

      // 5. Record Sadaqa donation
      await db.query(
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

      // 6. Update campaign stats
      await db.query(
        `UPDATE sadaqa_campaigns 
         SET raised = raised + $1, 
             donor_count = donor_count + 1,
             updatedat = NOW()
         WHERE id = $2`,
        [amount, campaignId]
      );

      // 7. Credit community pool (Sadaqa fund)
      await db.query(
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

      // 8. Record in transactions table for history
      const txId = 'txn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await db.query(
        `INSERT INTO transactions (id, user_id, type, amount, status, reference, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          txId,
          userId,
          'sadaqa',
          -amount,
          'success',
          ref,
          `Sadaqa donation to ${campaign.name}`
        ]
      );

      // 9. Get new balance
      const updatedAccount = await virtualAccountService.getUserAccount(userId);
      const newBalance = updatedAccount?.balance || 0;

      await db.query('COMMIT');

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
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    await db.query('ROLLBACK');
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
    const db = await getClient();
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const result = await db.query(
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
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(
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

    // Get impact stats
    const impactResult = await db.query(
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
    const db = await getClient();

    const result = await db.query(
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
    const db = await getClient();
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

    const result = await db.query(query, params);

    // Get total stats
    const statsResult = await db.query(
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
    const db = await getClient();
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

    await db.query(
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
    const db = await getClient();
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

    const check = await db.query(
      'SELECT id FROM sadaqa_campaigns WHERE id = $1',
      [campaignId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    await db.query(
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
    const db = await getClient();
    const campaignId = req.params.id;

    const result = await db.query(
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
    const db = await getClient();

    // Get Sadaqa pool balance from virtual accounts
    const sadaqaPool = await virtualAccountService.getAccountByNumber(SADAQA_POOL_ACCOUNT);
    const sadaqaBalance = sadaqaPool?.balance || 0;

    const disbursedResult = await db.query(
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