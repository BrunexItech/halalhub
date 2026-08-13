// backend/src/routes/takaful.js
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const { authenticate } = require('../middleware/auth');
const virtualAccountService = require('../services/virtual-account.service');
const takafulApiService = require('../services/takaful-api.service');

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

// Master account for Takaful funds
const TAKAFUL_POOL_ACCOUNT = process.env.TAKAFUL_POOL_ACCOUNT || 'TAKAFUL-POOL-001';
const ADMIN_FEE_PERCENT = parseFloat(process.env.TAKAFUL_ADMIN_FEE_PERCENT) || 1.5;
const MIN_ADMIN_FEE = parseFloat(process.env.TAKAFUL_MIN_ADMIN_FEE) || 20;
const MAX_ADMIN_FEE = parseFloat(process.env.TAKAFUL_MAX_ADMIN_FEE) || 500;

// Calculate admin fee
const calculateAdminFee = (amount) => {
  const fee = (amount * ADMIN_FEE_PERCENT) / 100;
  if (fee < MIN_ADMIN_FEE) return Math.round(MIN_ADMIN_FEE);
  if (fee > MAX_ADMIN_FEE) return Math.round(MAX_ADMIN_FEE);
  return Math.round(fee);
};

// ============================================================
// 1. GET PLANS (From our DB - seeded from Takaful Kenya)
// ============================================================
router.get('/plans', async (req, res) => {
  try {
    const db = await getClient();
    const result = await db.query(`
      SELECT 
        id,
        name,
        description,
        category,
        coverage_options,
        monthly_premium,
        annual_premium,
        min_coverage,
        max_coverage,
        benefits,
        is_active,
        external_product_id
      FROM takaful_plans
      WHERE is_active = true
      ORDER BY category, name ASC
    `);

    res.json({
      success: true,
      plans: result.rows
    });

  } catch (err) {
    console.error('Error fetching Takaful plans:', err.message);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// ============================================================
// 2. GET PLAN BY ID
// ============================================================
router.get('/plans/:id', async (req, res) => {
  try {
    const db = await getClient();
    const planId = req.params.id;

    const result = await db.query(`
      SELECT 
        id,
        name,
        description,
        category,
        coverage_options,
        monthly_premium,
        annual_premium,
        min_coverage,
        max_coverage,
        benefits,
        is_active,
        external_product_id
      FROM takaful_plans
      WHERE id = $1 AND is_active = true
    `, [planId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({
      success: true,
      plan: result.rows[0]
    });

  } catch (err) {
    console.error('Error fetching plan:', err.message);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// ============================================================
// 3. GET COVERAGE OPTIONS FOR A PLAN
// ============================================================
router.get('/plans/:id/coverage', async (req, res) => {
  try {
    const db = await getClient();
    const planId = req.params.id;

    const result = await db.query(`
      SELECT coverage_options
      FROM takaful_plans
      WHERE id = $1 AND is_active = true
    `, [planId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({
      success: true,
      coverage_options: result.rows[0].coverage_options || []
    });

  } catch (err) {
    console.error('Error fetching coverage options:', err.message);
    res.status(500).json({ error: 'Failed to fetch coverage options' });
  }
});

// ============================================================
// 4. GET QUOTE (Enquire) - Calls Takaful Kenya API
// ============================================================
router.post('/enquire', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      plan_id,
      coverage_option,
      sum_assured,
      client_details
    } = req.body;

    if (!plan_id || !coverage_option || !sum_assured) {
      return res.status(400).json({ error: 'Plan ID, coverage option, and sum assured are required' });
    }

    // Get plan from our DB
    const db = await getClient();
    const planResult = await db.query(
      'SELECT id, name, external_product_id FROM takaful_plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = planResult.rows[0];

    // Get user details
    const userResult = await db.query(
      'SELECT fullname, email, phone FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Prepare quote request
    const quoteData = {
      product_id: plan.external_product_id || plan.id,
      coverage_option: coverage_option,
      sum_assured: parseInt(sum_assured),
      client_details: {
        name: user.fullname,
        email: user.email,
        phone: user.phone,
        ...client_details
      }
    };

    // Call Takaful Kenya API
    const response = await takafulApiService.getQuote(quoteData);

    if (!response.success) {
      return res.status(response.statusCode || 500).json({
        error: response.error || 'Failed to get quote'
      });
    }

    // Store enquiry in DB
    const enquiryId = 'tenq-' + Date.now().toString(36) + uuidv4().slice(0, 6);
    await db.query(`
      INSERT INTO takaful_enquiries (
        id, user_id, plan_id, coverage_option, sum_assured, 
        premium_amount, external_reference, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
    `, [
      enquiryId,
      userId,
      plan_id,
      coverage_option,
      parseInt(sum_assured),
      response.data.premium || 0,
      response.data.reference || null
    ]);

    res.json({
      success: true,
      quote: {
        premium: response.data.premium,
        sum_assured: response.data.sum_assured || sum_assured,
        coverage_option: coverage_option,
        reference: response.data.reference,
        policy_details: response.data.details || {}
      },
      enquiry_id: enquiryId
    });

  } catch (err) {
    console.error('Error getting quote:', err.message);
    res.status(500).json({ error: 'Failed to get quote' });
  }
});

// ============================================================
// 5. PURCHASE POLICY - Calls Takaful Kenya API
// ============================================================
router.post('/purchase', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const {
      plan_id,
      coverage_option,
      sum_assured,
      premium,
      payment_method = 'wallet',
      client_details
    } = req.body;

    if (!plan_id || !coverage_option || !premium || !sum_assured) {
      return res.status(400).json({ error: 'Plan ID, coverage, premium, and sum assured are required' });
    }

    // Get user details
    const userResult = await db.query(
      'SELECT fullname, email, phone FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get plan
    const planResult = await db.query(
      'SELECT id, name, external_product_id FROM takaful_plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = planResult.rows[0];

    // Check user wallet balance
    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({ error: 'Virtual account not found' });
    }

    const premiumAmount = parseInt(premium);
    const adminFee = calculateAdminFee(premiumAmount);
    const totalAmount = premiumAmount + adminFee;

    if (userAccount.balance < totalAmount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        balance: userAccount.balance,
        required: totalAmount
      });
    }

    // Get Takaful pool account
    const poolAccount = await virtualAccountService.getAccountByNumber(TAKAFUL_POOL_ACCOUNT);

    if (!poolAccount) {
      return res.status(500).json({ error: 'Takaful pool account not configured' });
    }

    // Prepare purchase request for Takaful Kenya API
    const purchaseData = {
      product_id: plan.external_product_id || plan.id,
      coverage_option: coverage_option,
      sum_assured: parseInt(sum_assured),
      premium: premiumAmount,
      client_details: {
        name: user.fullname,
        email: user.email,
        phone: user.phone,
        ...client_details
      },
      payment_method: payment_method
    };

    // Call Takaful Kenya API
    const response = await takafulApiService.purchasePolicy(purchaseData);

    if (!response.success) {
      return res.status(response.statusCode || 500).json({
        error: response.error || 'Failed to purchase policy'
      });
    }

    // Begin DB transaction
    await db.query('BEGIN');

    try {
      // Transfer premium from user to Takaful pool
      await virtualAccountService.processTransfer(
        userId,
        userAccount.account_number,
        TAKAFUL_POOL_ACCOUNT,
        premiumAmount,
        `Takaful premium payment - ${plan.name}`
      );

      // Transfer admin fee from user to master account
      if (adminFee > 0) {
        await virtualAccountService.processTransfer(
          userId,
          userAccount.account_number,
          process.env.BANK_MASTER_ACCOUNT || 'HALALHUB-MASTER-001',
          adminFee,
          `Takaful admin fee - ${plan.name}`
        );
      }

      // Store policy in our database
      const policyId = 'tpol-' + Date.now().toString(36) + uuidv4().slice(0, 6);
      const startDate = new Date();
      const expiryDate = new Date(startDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      await db.query(`
        INSERT INTO takaful_policies (
          id, user_id, plan_id, coverage_option, sum_assured,
          premium, external_policy_number, status, start_date, expiry_date,
          payment_reference, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10, NOW(), NOW())
      `, [
        policyId,
        userId,
        plan_id,
        coverage_option,
        parseInt(sum_assured),
        premiumAmount,
        response.data.policy_number || response.data.reference || null,
        startDate,
        expiryDate,
        response.data.payment_reference || null
      ]);

      // Record commission (revenue share)
      const commissionRate = parseFloat(process.env.TAKAFUL_COMMISSION_PERCENT) || 5;
      const commissionAmount = Math.round((premiumAmount * commissionRate) / 100);

      if (commissionAmount > 0) {
        const commissionId = 'tcom-' + Date.now().toString(36) + uuidv4().slice(0, 6);
        await db.query(`
          INSERT INTO takaful_commissions (
            id, policy_id, amount, rate_percent, status, created_at
          ) VALUES ($1, $2, $3, $4, 'pending', NOW())
        `, [commissionId, policyId, commissionAmount, commissionRate]);
      }

      // Update pool stats
      await db.query(`
        UPDATE takaful_pool_stats 
        SET total_members = total_members + 1,
            pool_balance = pool_balance + $1,
            updated_at = NOW()
        WHERE id = (SELECT id FROM takaful_pool_stats LIMIT 1)
      `, [premiumAmount]);

      // Create notification for user
      const notifId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 6);
      await db.query(`
        INSERT INTO notifications (
          id, user_id, title, message, type, link, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        notifId,
        userId,
        'Takaful Policy Active',
        `Your ${plan.name} policy is now active. Policy #${response.data.policy_number || policyId.slice(0, 8)}.`,
        'takaful',
        `/takaful/policies/${policyId}`
      ]);

      await db.query('COMMIT');

      // Get updated balance
      const updatedAccount = await virtualAccountService.getUserAccount(userId);

      res.status(201).json({
        success: true,
        message: 'Policy purchased successfully',
        policy: {
          id: policyId,
          policy_number: response.data.policy_number || null,
          plan_name: plan.name,
          coverage_option: coverage_option,
          sum_assured: parseInt(sum_assured),
          premium: premiumAmount,
          start_date: startDate,
          expiry_date: expiryDate,
          status: 'active'
        },
        transaction: {
          premium: premiumAmount,
          admin_fee: adminFee,
          total_deducted: totalAmount,
          new_balance: updatedAccount?.balance || 0
        },
        external_reference: response.data.reference || null
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error purchasing policy:', err.message);
    res.status(500).json({ error: err.message || 'Failed to purchase policy' });
  }
});

// ============================================================
// 6. GET USER POLICIES
// ============================================================
router.get('/policies', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    let query = `
      SELECT 
        p.id,
        p.plan_id,
        p.coverage_option,
        p.sum_assured,
        p.premium,
        p.external_policy_number,
        p.status,
        p.start_date,
        p.expiry_date,
        p.payment_reference,
        p.created_at,
        pl.name as plan_name,
        pl.category as plan_category,
        pl.description as plan_description,
        c.amount as commission_amount,
        c.status as commission_status
      FROM takaful_policies p
      JOIN takaful_plans pl ON p.plan_id = pl.id
      LEFT JOIN takaful_commissions c ON p.id = c.policy_id
      WHERE p.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      policies: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching policies:', err.message);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// ============================================================
// 7. GET POLICY BY ID
// ============================================================
router.get('/policies/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const policyId = req.params.id;

    const result = await db.query(`
      SELECT 
        p.*,
        pl.name as plan_name,
        pl.category as plan_category,
        pl.description as plan_description,
        pl.benefits,
        c.amount as commission_amount,
        c.status as commission_status,
        u.fullname as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM takaful_policies p
      JOIN takaful_plans pl ON p.plan_id = pl.id
      LEFT JOIN takaful_commissions c ON p.id = c.policy_id
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.user_id = $2
    `, [policyId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Try to get latest status from external API
    const policy = result.rows[0];
    if (policy.external_policy_number) {
      try {
        const externalStatus = await takafulApiService.getPolicyStatus(policy.external_policy_number);
        if (externalStatus.success && externalStatus.data.status !== policy.status) {
          // Update our DB with external status
          await db.query(
            'UPDATE takaful_policies SET status = $1, updated_at = NOW() WHERE id = $2',
            [externalStatus.data.status, policyId]
          );
          policy.status = externalStatus.data.status;
        }
      } catch (err) {
        console.log('Could not sync policy status:', err.message);
        // Don't fail the request, just use our stored status
      }
    }

    res.json({
      success: true,
      policy: policy
    });

  } catch (err) {
    console.error('Error fetching policy:', err.message);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

// ============================================================
// 8. SUBMIT CLAIM - Calls Takaful Kenya API
// ============================================================
router.post('/claims', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      policy_id,
      claim_type,
      amount,
      description,
      documents = []
    } = req.body;

    if (!policy_id || !claim_type || !amount) {
      return res.status(400).json({ error: 'Policy ID, claim type, and amount are required' });
    }

    // Get policy
    const policyResult = await db.query(
      'SELECT external_policy_number, plan_id FROM takaful_policies WHERE id = $1 AND user_id = $2',
      [policy_id, userId]
    );

    if (policyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const policy = policyResult.rows[0];

    // Prepare claim data for external API
    const claimData = {
      policy_number: policy.external_policy_number || policy_id,
      claim_type: claim_type,
      amount: parseInt(amount),
      description: description || '',
      documents: documents,
      client_reference: userId
    };

    // Call Takaful Kenya API
    const response = await takafulApiService.submitClaim(claimData);

    if (!response.success) {
      return res.status(response.statusCode || 500).json({
        error: response.error || 'Failed to submit claim'
      });
    }

    // Store claim in DB
    const claimId = 'tclm-' + Date.now().toString(36) + uuidv4().slice(0, 6);
    await db.query(`
      INSERT INTO takaful_claims (
        id, policy_id, user_id, claim_type, amount, description,
        external_claim_reference, status, submitted_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW(), NOW(), NOW())
    `, [
      claimId,
      policy_id,
      userId,
      claim_type,
      parseInt(amount),
      description || null,
      response.data.claim_reference || response.data.reference || null
    ]);

    // Notification
    const notifId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 6);
    await db.query(`
      INSERT INTO notifications (
        id, user_id, title, message, type, link, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      notifId,
      userId,
      'Claim Submitted',
      `Your ${claim_type} claim of KES ${parseInt(amount).toLocaleString()} has been submitted and is pending review.`,
      'takaful',
      `/takaful/claims/${claimId}`
    ]);

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      claim: {
        id: claimId,
        claim_reference: response.data.claim_reference || response.data.reference || null,
        claim_type: claim_type,
        amount: parseInt(amount),
        status: 'pending',
        submitted_at: new Date()
      }
    });

  } catch (err) {
    console.error('Error submitting claim:', err.message);
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

// ============================================================
// 9. GET USER CLAIMS
// ============================================================
router.get('/claims', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    let query = `
      SELECT 
        c.id,
        c.policy_id,
        c.claim_type,
        c.amount,
        c.description,
        c.external_claim_reference,
        c.status,
        c.submitted_at,
        c.reviewed_at,
        c.admin_notes,
        c.created_at,
        p.plan_id,
        pl.name as plan_name
      FROM takaful_claims c
      JOIN takaful_policies p ON c.policy_id = p.id
      JOIN takaful_plans pl ON p.plan_id = pl.id
      WHERE c.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      claims: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching claims:', err.message);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// ============================================================
// 10. GET CLAIM BY ID
// ============================================================
router.get('/claims/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const claimId = req.params.id;

    const result = await db.query(`
      SELECT 
        c.*,
        p.plan_id,
        pl.name as plan_name,
        u.fullname as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM takaful_claims c
      JOIN takaful_policies p ON c.policy_id = p.id
      JOIN takaful_plans pl ON p.plan_id = pl.id
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1 AND c.user_id = $2
    `, [claimId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.json({
      success: true,
      claim: result.rows[0]
    });

  } catch (err) {
    console.error('Error fetching claim:', err.message);
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

// ============================================================
// 11. WEBHOOK - Receive updates from Takaful Kenya API
// ============================================================
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    const event = req.headers['x-event'];

    if (!signature || !timestamp || !event) {
      return res.status(400).json({ error: 'Missing webhook headers' });
    }

    // Verify webhook signature
    const isValid = takafulApiService.verifyWebhookSignature(
      req.body,
      signature,
      timestamp
    );

    if (!isValid) {
      console.error('[Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook
    const result = await takafulApiService.handleWebhook(event, req.body);

    // Acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook received',
      event: event
    });

  } catch (err) {
    console.error('[Webhook] Error:', err.message);
    // Always respond 200 to avoid retries
    res.status(200).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================================
// 12. SYNC PRODUCTS FROM TAKAFUL KENYA API (Admin)
// ============================================================
router.post('/admin/sync-products', authenticate, async (req, res) => {
  try {
    const db = await getClient();

    // Check if user is admin
    const userCheck = await db.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Fetch products from external API
    const response = await takafulApiService.getProducts();

    if (!response.success) {
      return res.status(response.statusCode || 500).json({
        error: response.error || 'Failed to sync products'
      });
    }

    // Process and store products
    const products = response.data.products || [];
    let synced = 0;
    let updated = 0;
    let failed = 0;

    for (const product of products) {
      try {
        const existing = await db.query(
          'SELECT id FROM takaful_plans WHERE external_product_id = $1',
          [product.id]
        );

        const planData = {
          external_product_id: product.id,
          name: product.name,
          description: product.description || '',
          category: product.category || 'General',
          coverage_options: product.coverage_options || [],
          monthly_premium: product.monthly_premium || 0,
          annual_premium: product.annual_premium || 0,
          min_coverage: product.min_coverage || 0,
          max_coverage: product.max_coverage || 0,
          benefits: product.benefits || [],
          is_active: product.is_active !== undefined ? product.is_active : true
        };

        if (existing.rows.length > 0) {
          // Update existing
          await db.query(`
            UPDATE takaful_plans SET
              name = $1,
              description = $2,
              category = $3,
              coverage_options = $4,
              monthly_premium = $5,
              annual_premium = $6,
              min_coverage = $7,
              max_coverage = $8,
              benefits = $9,
              is_active = $10,
              updated_at = NOW()
            WHERE external_product_id = $11
          `, [
            planData.name,
            planData.description,
            planData.category,
            planData.coverage_options,
            planData.monthly_premium,
            planData.annual_premium,
            planData.min_coverage,
            planData.max_coverage,
            planData.benefits,
            planData.is_active,
            planData.external_product_id
          ]);
          updated++;
        } else {
          // Insert new
          const id = 'tpln-' + Date.now().toString(36) + uuidv4().slice(0, 6);
          await db.query(`
            INSERT INTO takaful_plans (
              id, external_product_id, name, description, category,
              coverage_options, monthly_premium, annual_premium,
              min_coverage, max_coverage, benefits, is_active,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          `, [
            id,
            planData.external_product_id,
            planData.name,
            planData.description,
            planData.category,
            planData.coverage_options,
            planData.monthly_premium,
            planData.annual_premium,
            planData.min_coverage,
            planData.max_coverage,
            planData.benefits,
            planData.is_active
          ]);
          synced++;
        }
      } catch (err) {
        console.error('Error syncing product:', product.name, err.message);
        failed++;
      }
    }

    res.json({
      success: true,
      message: 'Products synced successfully',
      summary: {
        synced: synced,
        updated: updated,
        failed: failed,
        total: products.length
      }
    });

  } catch (err) {
    console.error('Error syncing products:', err.message);
    res.status(500).json({ error: 'Failed to sync products' });
  }
});

// ============================================================
// 13. GET POOL STATISTICS
// ============================================================
router.get('/pool-stats', async (req, res) => {
  try {
    const db = await getClient();

    let stats = await db.query(`
      SELECT 
        total_members,
        pool_balance,
        claims_paid,
        surplus,
        total_claims,
        updated_at
      FROM takaful_pool_stats
      LIMIT 1
    `);

    if (stats.rows.length === 0) {
      await db.query(`
        INSERT INTO takaful_pool_stats (
          id, total_members, pool_balance, claims_paid, surplus, total_claims, updated_at
        ) VALUES ('pool-stats-1', 0, 0, 0, 0, 0, NOW())
      `);

      stats = await db.query(`
        SELECT 
          total_members,
          pool_balance,
          claims_paid,
          surplus,
          total_claims,
          updated_at
        FROM takaful_pool_stats
        LIMIT 1
      `);
    }

    const stat = stats.rows[0];

    res.json({
      success: true,
      stats: {
        members: parseInt(stat.total_members) || 0,
        balance: parseInt(stat.pool_balance) || 0,
        claimsPaid: parseFloat(stat.claims_paid) || 0,
        surplus: parseInt(stat.surplus) || 0,
        totalClaims: parseInt(stat.total_claims) || 0,
        updatedAt: stat.updated_at
      }
    });

  } catch (err) {
    console.error('Error fetching pool stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch pool stats' });
  }
});

// ============================================================
// 14. GET USER POLICY SUMMARY (Dashboard)
// ============================================================
router.get('/summary', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_policies,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_policies,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_policies,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_policies,
        COALESCE(SUM(CASE WHEN status = 'active' THEN premium ELSE 0 END), 0) as total_active_premium,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_claims,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_claims
      FROM takaful_policies p
      LEFT JOIN takaful_claims c ON p.id = c.policy_id
      WHERE p.user_id = $1
    `, [userId]);

    res.json({
      success: true,
      summary: {
        total_policies: parseInt(result.rows[0].total_policies) || 0,
        active_policies: parseInt(result.rows[0].active_policies) || 0,
        expired_policies: parseInt(result.rows[0].expired_policies) || 0,
        cancelled_policies: parseInt(result.rows[0].cancelled_policies) || 0,
        total_active_premium: parseInt(result.rows[0].total_active_premium) || 0,
        pending_claims: parseInt(result.rows[0].pending_claims) || 0,
        approved_claims: parseInt(result.rows[0].approved_claims) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching summary:', err.message);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// ============================================================
// 15. ADMIN - GET COMMISSIONS
// ============================================================
router.get('/admin/commissions', authenticate, async (req, res) => {
  try {
    const db = await getClient();

    const userCheck = await db.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, limit = 100 } = req.query;

    let query = `
      SELECT 
        c.*,
        p.id as policy_id,
        p.external_policy_number,
        pl.name as plan_name,
        u.fullname as user_name,
        u.email as user_email
      FROM takaful_commissions c
      JOIN takaful_policies p ON c.policy_id = p.id
      JOIN takaful_plans pl ON p.plan_id = pl.id
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    // Get summary
    const summary = await db.query(`
      SELECT 
        COUNT(*) as total_commissions,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
      FROM takaful_commissions
    `);

    res.json({
      success: true,
      commissions: result.rows,
      total: result.rows.length,
      summary: {
        total_commissions: parseInt(summary.rows[0].total_commissions) || 0,
        total_amount: parseInt(summary.rows[0].total_amount) || 0,
        paid_amount: parseInt(summary.rows[0].paid_amount) || 0,
        pending_amount: parseInt(summary.rows[0].pending_amount) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching commissions:', err.message);
    res.status(500).json({ error: 'Failed to fetch commissions' });
  }
});

module.exports = router;