const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const { authenticate } = require('../middleware/auth');
const virtualAccountService = require('../services/virtual-account.service');

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

// Takaful Pool Account (from .env or default)
const TAKAFUL_POOL_ACCOUNT = process.env.TAKAFUL_POOL_ACCOUNT || 'TAKAFUL-POOL-001';
const BANK_MASTER_ACCOUNT = process.env.BANK_MASTER_ACCOUNT || 'HALALHUB-MASTER-001';

// Fee configuration
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

// All Takaful routes require authentication
router.use(authenticate);

// ============================================================
// 1. GET TAKAFUL PLANS (Public - User facing)
// ============================================================
router.get('/plans', async (req, res) => {
  try {
    const db = await getClient();

    const result = await db.query(`
      SELECT 
        id,
        name,
        description,
        type,
        coverage,
        monthly_cost,
        annual_cost,
        max_coverage,
        benefits,
        is_active
      FROM takaful_plans
      WHERE is_active = true
      ORDER BY monthly_cost ASC
    `);

    const plans = result.rows.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      type: plan.type,
      coverage: plan.coverage,
      monthlyCost: parseInt(plan.monthly_cost),
      annualCost: parseInt(plan.annual_cost),
      maxCoverage: parseInt(plan.max_coverage),
      benefits: plan.benefits || [],
      isActive: plan.is_active
    }));

    res.json({ success: true, plans: plans });

  } catch (err) {
    console.error('Error fetching Takaful plans:', err.message);
    res.status(500).json({ error: 'Failed to fetch Takaful plans' });
  }
});

// ============================================================
// 2. GET USER'S POLICY
// ============================================================
router.get('/policy', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        p.id,
        p.plan_id,
        p.status,
        p.start_date,
        p.expiry_date,
        p.monthly_contribution,
        p.total_coverage,
        p.members,
        pl.name as plan_name,
        pl.type as plan_type,
        pl.coverage as plan_coverage,
        pl.benefits
      FROM takaful_policies p
      JOIN takaful_plans pl ON p.plan_id = pl.id
      WHERE p.user_id = $1 AND p.status = 'active'
      ORDER BY p.createdat DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({ success: true, policy: null });
    }

    const policy = result.rows[0];

    // Get family members
    const familyResult = await db.query(`
      SELECT 
        id,
        name,
        relation,
        age
      FROM takaful_family_members
      WHERE policy_id = $1
      ORDER BY createdat ASC
    `, [policy.id]);

    // Get contributions
    const contributionsResult = await db.query(`
      SELECT 
        id,
        amount,
        status,
        contribution_date,
        payment_method
      FROM takaful_contributions
      WHERE policy_id = $1
      ORDER BY contribution_date DESC
      LIMIT 5
    `, [policy.id]);

    res.json({
      success: true,
      policy: {
        id: policy.id,
        planId: policy.plan_id,
        planName: policy.plan_name,
        planType: policy.plan_type,
        planCoverage: policy.plan_coverage,
        benefits: policy.benefits || [],
        status: policy.status,
        startDate: policy.start_date,
        expiryDate: policy.expiry_date,
        monthlyContribution: parseInt(policy.monthly_contribution),
        totalCoverage: parseInt(policy.total_coverage),
        members: parseInt(policy.members),
        familyMembers: familyResult.rows.map(m => ({
          id: m.id,
          name: m.name,
          relation: m.relation,
          age: parseInt(m.age)
        })),
        contributions: contributionsResult.rows.map(c => ({
          date: c.contribution_date,
          amount: parseInt(c.amount),
          status: c.status,
          paymentMethod: c.payment_method
        }))
      }
    });

  } catch (err) {
    console.error('Error fetching policy:', err.message);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

// ============================================================
// 3. ENROLL IN TAKAFUL PLAN (Using Virtual Accounts)
// ============================================================
router.post('/enroll', async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const { plan_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Check if plan exists
    const planCheck = await db.query(
      'SELECT id, name, monthly_cost, max_coverage FROM takaful_plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = planCheck.rows[0];

    // Check if user already has active policy
    const existingPolicy = await db.query(
      'SELECT id FROM takaful_policies WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (existingPolicy.rows.length > 0) {
      return res.status(400).json({ error: 'You already have an active Takaful policy' });
    }

    // Get user's virtual account
    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({ 
        error: 'Virtual account not found. Please contact support.' 
      });
    }

    const monthlyContribution = plan.monthly_cost;
    
    // Calculate admin fee
    const adminFee = calculateAdminFee(monthlyContribution);
    const poolAmount = monthlyContribution - adminFee;

    // Check if user has enough balance (monthly contribution + admin fee)
    if (userAccount.balance < monthlyContribution) {
      return res.status(400).json({ 
        error: 'Insufficient balance for first month contribution',
        balance: userAccount.balance,
        required: monthlyContribution
      });
    }

    // Check if Takaful pool account exists
    const poolAccount = await virtualAccountService.getAccountByNumber(TAKAFUL_POOL_ACCOUNT);

    if (!poolAccount) {
      console.error('[Takaful] Pool account not found:', TAKAFUL_POOL_ACCOUNT);
      return res.status(500).json({ 
        error: 'Takaful pool account not configured. Please contact support.' 
      });
    }

    const policyId = 'tpol-' + Date.now();
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    await db.query('BEGIN');

    try {
      // 1. Transfer pool amount from user to Takaful pool
      await virtualAccountService.processTransfer(
        userId,
        userAccount.account_number,
        TAKAFUL_POOL_ACCOUNT,
        poolAmount,
        `Takaful contribution - ${plan.name}`
      );

      // 2. Transfer admin fee from user to master account
      if (adminFee > 0) {
        await virtualAccountService.processTransfer(
          userId,
          userAccount.account_number,
          BANK_MASTER_ACCOUNT,
          adminFee,
          `Takaful admin fee - ${plan.name}`
        );
      }

      // Create policy
      await db.query(`
        INSERT INTO takaful_policies (
          id, user_id, plan_id, status, start_date, expiry_date,
          monthly_contribution, total_coverage, members, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [policyId, userId, plan_id, 'active', startDate, expiryDate, monthlyContribution, plan.max_coverage, 1]);

      // Record first contribution in takaful_contributions
      const contributionId = 'tcont-' + Date.now();
      await db.query(`
        INSERT INTO takaful_contributions (
          id, policy_id, amount, status, payment_method, contribution_date, createdat
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [contributionId, policyId, poolAmount, 'paid', 'wallet', startDate]);

      // Update pool stats
      await db.query(`
        UPDATE takaful_pool_stats 
        SET total_members = total_members + 1,
            pool_balance = pool_balance + $1,
            updatedat = NOW()
        WHERE id = (SELECT id FROM takaful_pool_stats LIMIT 1)
      `, [poolAmount]);

      await db.query('COMMIT');

      // Get updated balance
      const updatedAccount = await virtualAccountService.getUserAccount(userId);

      res.json({
        success: true,
        message: 'Successfully enrolled in Takaful plan',
        policyId: policyId,
        planName: plan.name,
        monthlyCost: parseInt(monthlyContribution),
        adminFee: adminFee,
        poolAmount: poolAmount,
        coverage: parseInt(plan.max_coverage),
        startDate: startDate,
        expiryDate: expiryDate,
        newBalance: updatedAccount?.balance || 0
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error enrolling in Takaful:', err.message);
    res.status(500).json({ error: 'Failed to enroll in Takaful' });
  }
});

// ============================================================
// 3.5 PAY MONTHLY CONTRIBUTION
// ============================================================
router.post('/pay-monthly', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const { policyId, amount } = req.body;

    if (!policyId || !amount) {
      return res.status(400).json({ error: 'Policy ID and amount are required' });
    }

    // Verify policy exists and belongs to user
    const policyCheck = await db.query(
      'SELECT id, plan_id, status FROM takaful_policies WHERE id = $1 AND user_id = $2 AND status = $3',
      [policyId, userId, 'active']
    );

    if (policyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Active policy not found' });
    }

    // Get user's virtual account
    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({ 
        error: 'Virtual account not found. Please contact support.' 
      });
    }

    // Check if user has enough balance
    if (userAccount.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        balance: userAccount.balance,
        required: amount
      });
    }

    // Check if Takaful pool account exists
    const poolAccount = await virtualAccountService.getAccountByNumber(TAKAFUL_POOL_ACCOUNT);

    if (!poolAccount) {
      console.error('[Takaful] Pool account not found:', TAKAFUL_POOL_ACCOUNT);
      return res.status(500).json({ 
        error: 'Takaful pool account not configured. Please contact support.' 
      });
    }

    await db.query('BEGIN');

    try {
      // Transfer contribution from user to Takaful pool
      await virtualAccountService.processTransfer(
        userId,
        userAccount.account_number,
        TAKAFUL_POOL_ACCOUNT,
        amount,
        `Takaful monthly contribution`
      );

      // Record contribution
      const contributionId = 'tcont-' + Date.now();
      await db.query(`
        INSERT INTO takaful_contributions (
          id, policy_id, amount, status, payment_method, contribution_date
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [contributionId, policyId, amount, 'paid', 'wallet', new Date()]);

      // Update pool stats
      await db.query(`
        UPDATE takaful_pool_stats 
        SET pool_balance = pool_balance + $1,
            updatedat = NOW()
        WHERE id = (SELECT id FROM takaful_pool_stats LIMIT 1)
      `, [amount]);

      await db.query('COMMIT');

      // Get updated balance
      const updatedAccount = await virtualAccountService.getUserAccount(userId);

      res.json({
        success: true,
        message: 'Monthly contribution paid successfully',
        contributionId: contributionId,
        amount: amount,
        newBalance: updatedAccount?.balance || 0
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error paying monthly contribution:', err.message);
    res.status(500).json({ error: 'Failed to process monthly contribution' });
  }
});

// ============================================================
// 4. ADD FAMILY MEMBER
// ============================================================
router.post('/family', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { name, relation, age } = req.body;

    if (!name || !relation || !age) {
      return res.status(400).json({ error: 'Name, relation, and age are required' });
    }

    if (age < 0 || age > 120) {
      return res.status(400).json({ error: 'Invalid age' });
    }

    // Get user's active policy
    const policyCheck = await db.query(
      'SELECT id FROM takaful_policies WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (policyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'No active policy found' });
    }

    const policyId = policyCheck.rows[0].id;

    const memberId = 'tfam-' + Date.now();
    await db.query(`
      INSERT INTO takaful_family_members (
        id, policy_id, name, relation, age, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [memberId, policyId, name, relation, parseInt(age)]);

    // Update members count
    await db.query(
      'UPDATE takaful_policies SET members = members + 1, updatedat = NOW() WHERE id = $1',
      [policyId]
    );

    res.json({
      success: true,
      message: 'Family member added successfully',
      memberId: memberId
    });

  } catch (err) {
    console.error('Error adding family member:', err.message);
    res.status(500).json({ error: 'Failed to add family member' });
  }
});

// ============================================================
// 5. REMOVE FAMILY MEMBER
// ============================================================
router.delete('/family/:memberId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const memberId = req.params.memberId;

    // Verify member belongs to user's policy
    const check = await db.query(`
      SELECT fm.id, fm.policy_id 
      FROM takaful_family_members fm
      JOIN takaful_policies p ON fm.policy_id = p.id
      WHERE fm.id = $1 AND p.user_id = $2
    `, [memberId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    const policyId = check.rows[0].policy_id;

    await db.query('BEGIN');

    try {
      await db.query(
        'DELETE FROM takaful_family_members WHERE id = $1',
        [memberId]
      );

      await db.query(
        'UPDATE takaful_policies SET members = members - 1, updatedat = NOW() WHERE id = $1',
        [policyId]
      );

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Family member removed successfully'
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error removing family member:', err.message);
    res.status(500).json({ error: 'Failed to remove family member' });
  }
});

// ============================================================
// 6. SUBMIT CLAIM (Using Virtual Accounts)
// ============================================================
router.post('/claims', async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const { type, amount, description } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ error: 'Claim type and amount are required' });
    }

    if (parseInt(amount) < 100) {
      return res.status(400).json({ error: 'Minimum claim amount is KES 100' });
    }

    // Get user's active policy
    const policyCheck = await db.query(
      'SELECT id, total_coverage FROM takaful_policies WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (policyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'No active policy found' });
    }

    const policy = policyCheck.rows[0];

    // Check if claim amount exceeds coverage
    if (parseInt(amount) > parseInt(policy.total_coverage)) {
      return res.status(400).json({ error: 'Claim amount exceeds policy coverage' });
    }

    // Check if Takaful pool has enough balance
    const poolAccount = await virtualAccountService.getAccountByNumber(TAKAFUL_POOL_ACCOUNT);

    if (!poolAccount) {
      return res.status(500).json({ 
        error: 'Takaful pool account not configured. Please contact support.' 
      });
    }

    if (poolAccount.balance < parseInt(amount)) {
      return res.status(400).json({ 
        error: 'Insufficient funds in Takaful pool',
        balance: poolAccount.balance,
        required: parseInt(amount)
      });
    }

    const claimId = 'tclm-' + Date.now();

    await db.query('BEGIN');

    try {
      // Insert claim
      await db.query(`
        INSERT INTO takaful_claims (
          id, policy_id, user_id, type, amount, description, status, submitted_at, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
      `, [claimId, policy.id, userId, type, parseInt(amount), description || null]);

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Claim submitted successfully',
        claimId: claimId,
        status: 'pending'
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error submitting claim:', err.message);
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

// ============================================================
// 7. GET USER'S CLAIMS
// ============================================================
router.get('/claims', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        id,
        type,
        amount,
        description,
        status,
        submitted_at,
        reviewed_at,
        admin_notes
      FROM takaful_claims
      WHERE user_id = $1
      ORDER BY submitted_at DESC
    `, [userId]);

    const claims = result.rows.map(claim => ({
      id: claim.id,
      type: claim.type,
      amount: parseInt(claim.amount),
      description: claim.description,
      status: claim.status,
      date: claim.submitted_at,
      reviewedAt: claim.reviewed_at,
      adminNotes: claim.admin_notes
    }));

    res.json({ success: true, claims: claims });

  } catch (err) {
    console.error('Error fetching claims:', err.message);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// ============================================================
// 8. GET POOL STATISTICS
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
        updatedat
      FROM takaful_pool_stats
      LIMIT 1
    `);

    // If no stats exist, create default
    if (stats.rows.length === 0) {
      await db.query(`
        INSERT INTO takaful_pool_stats (
          id, total_members, pool_balance, claims_paid, surplus, total_claims, updatedat
        ) VALUES ('pool-stats-1', 0, 0, 0, 0, 0, NOW())
      `);

      stats = await db.query(`
        SELECT 
          total_members,
          pool_balance,
          claims_paid,
          surplus,
          total_claims,
          updatedat
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
        updatedAt: stat.updatedat
      }
    });

  } catch (err) {
    console.error('Error fetching pool stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch pool stats' });
  }
});

// ============================================================
// 9. GET CLAIM DETAILS
// ============================================================
router.get('/claims/:claimId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const claimId = req.params.claimId;

    const result = await db.query(`
      SELECT 
        id,
        type,
        amount,
        description,
        status,
        submitted_at,
        reviewed_at,
        admin_notes
      FROM takaful_claims
      WHERE id = $1 AND user_id = $2
    `, [claimId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claim = result.rows[0];
    res.json({
      success: true,
      claim: {
        id: claim.id,
        type: claim.type,
        amount: parseInt(claim.amount),
        description: claim.description,
        status: claim.status,
        submittedAt: claim.submitted_at,
        reviewedAt: claim.reviewed_at,
        adminNotes: claim.admin_notes
      }
    });

  } catch (err) {
    console.error('Error fetching claim:', err.message);
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

// ============================================================
// 10. GET CONTRIBUTION HISTORY
// ============================================================
router.get('/contributions', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        c.id,
        c.amount,
        c.status,
        c.payment_method,
        c.contribution_date,
        p.plan_name
      FROM takaful_contributions c
      JOIN takaful_policies pol ON c.policy_id = pol.id
      JOIN takaful_plans p ON pol.plan_id = p.id
      WHERE pol.user_id = $1
      ORDER BY c.contribution_date DESC
      LIMIT 20
    `, [userId]);

    const contributions = result.rows.map(c => ({
      id: c.id,
      amount: parseInt(c.amount),
      status: c.status,
      paymentMethod: c.payment_method,
      date: c.contribution_date,
      planName: c.plan_name
    }));

    res.json({ success: true, contributions: contributions });

  } catch (err) {
    console.error('Error fetching contributions:', err.message);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

// ============================================================
// 11. ADMIN - GET PENDING CLAIMS (Admin only)
// ============================================================
router.get('/admin/claims/pending', authenticate, async (req, res) => {
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
        c.id,
        c.type,
        c.amount,
        c.description,
        c.status,
        c.submitted_at,
        c.reviewed_at,
        c.admin_notes,
        u.id as user_id,
        u.fullname as user_name,
        u.phone as user_phone,
        u.email as user_email,
        p.id as policy_id,
        p.plan_id,
        pl.name as plan_name,
        pl.type as plan_type,
        va.account_number as user_account_number,
        va.balance as user_balance
      FROM takaful_claims c
      JOIN users u ON c.user_id = u.id
      JOIN takaful_policies p ON c.policy_id = p.id
      JOIN takaful_plans pl ON p.plan_id = pl.id
      LEFT JOIN virtual_accounts va ON u.id = va.user_id
      WHERE c.status = 'pending'
      ORDER BY c.submitted_at ASC
    `);

    res.json({
      success: true,
      claims: result.rows.map(c => ({
        id: c.id,
        type: c.type,
        amount: parseInt(c.amount),
        description: c.description,
        status: c.status,
        submittedAt: c.submitted_at,
        reviewedAt: c.reviewed_at,
        adminNotes: c.admin_notes,
        user: {
          id: c.user_id,
          name: c.user_name,
          phone: c.user_phone,
          email: c.user_email,
          accountNumber: c.user_account_number,
          balance: parseInt(c.user_balance) || 0
        },
        policy: {
          id: c.policy_id,
          planId: c.plan_id,
          planName: c.plan_name,
          planType: c.plan_type
        }
      }))
    });

  } catch (err) {
    console.error('Error fetching pending claims:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending claims' });
  }
});

// ============================================================
// 12. ADMIN - APPROVE CLAIM (Admin only)
// ============================================================
router.put('/admin/claims/:claimId/approve', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const claimId = req.params.claimId;
    const { notes } = req.body;

    // Check if user is admin
    const userCheck = await db.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get claim details
    const claimCheck = await db.query(`
      SELECT c.*, p.user_id as policy_user_id, p.id as policy_id
      FROM takaful_claims c
      JOIN takaful_policies p ON c.policy_id = p.id
      WHERE c.id = $1 AND c.status = 'pending'
    `, [claimId]);

    if (claimCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found or already processed' });
    }

    const claim = claimCheck.rows[0];

    // Check if Takaful pool has enough balance
    const poolAccount = await virtualAccountService.getAccountByNumber(TAKAFUL_POOL_ACCOUNT);

    if (!poolAccount) {
      return res.status(500).json({ 
        error: 'Takaful pool account not configured' 
      });
    }

    if (poolAccount.balance < claim.amount) {
      return res.status(400).json({ 
        error: 'Insufficient funds in Takaful pool',
        balance: poolAccount.balance,
        required: claim.amount
      });
    }

    // Get user's virtual account
    const userAccount = await virtualAccountService.getUserAccount(claim.policy_user_id);

    if (!userAccount) {
      return res.status(404).json({ 
        error: 'User virtual account not found' 
      });
    }

    await db.query('BEGIN');

    try {
      // Transfer from Takaful pool to user's account
      // Direct database update since pool is a master account
      await db.query(
        `UPDATE virtual_accounts 
         SET balance = balance - $1, updatedat = NOW()
         WHERE account_number = $2`,
        [claim.amount, TAKAFUL_POOL_ACCOUNT]
      );

      await db.query(
        `UPDATE virtual_accounts 
         SET balance = balance + $1, updatedat = NOW()
         WHERE account_number = $2`,
        [claim.amount, userAccount.account_number]
      );

      // Record bank transaction
      const txId = 'btxn-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      const ref = 'TCLM-' + Date.now().toString(36).toUpperCase() + require('crypto').randomBytes(4).toString('hex').toUpperCase();

      await db.query(`
        INSERT INTO bank_transactions (
          id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
      `, [
        txId,
        ref,
        TAKAFUL_POOL_ACCOUNT,
        userAccount.account_number,
        claim.amount,
        0,
        'takaful_claim',
        'completed',
        `Takaful claim approved - ${claim.type}`
      ]);

      // Update claim status
      await db.query(`
        UPDATE takaful_claims 
        SET status = 'approved', 
            reviewed_at = NOW(),
            admin_notes = COALESCE($1, admin_notes),
            updatedat = NOW()
        WHERE id = $2
      `, [notes || null, claimId]);

      // Update pool stats
      await db.query(`
        UPDATE takaful_pool_stats 
        SET claims_paid = claims_paid + $1,
            pool_balance = pool_balance - $1,
            total_claims = total_claims + 1,
            updatedat = NOW()
        WHERE id = (SELECT id FROM takaful_pool_stats LIMIT 1)
      `, [claim.amount]);

      // Create notification for user
      const notificationId = 'notif-' + Date.now();
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        notificationId,
        claim.policy_user_id,
        'Takaful Claim Approved',
        `Your Takaful claim of KES ${parseInt(claim.amount).toLocaleString()} has been approved and paid to your virtual account.`,
        'takaful',
        `/takaful/claims/${claimId}`
      ]);

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Claim approved and paid successfully',
        claimId: claimId,
        amount: claim.amount,
        reference: ref
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error approving claim:', err.message);
    res.status(500).json({ error: 'Failed to approve claim' });
  }
});

// ============================================================
// 13. ADMIN - REJECT CLAIM (Admin only)
// ============================================================
router.put('/admin/claims/:claimId/reject', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const claimId = req.params.claimId;
    const { notes } = req.body;

    // Check if user is admin
    const userCheck = await db.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get claim to get user_id for notification
    const claimCheck = await db.query(
      'SELECT policy_user_id FROM takaful_claims c JOIN takaful_policies p ON c.policy_id = p.id WHERE c.id = $1 AND c.status = $2',
      [claimId, 'pending']
    );

    if (claimCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found or already processed' });
    }

    const result = await db.query(`
      UPDATE takaful_claims 
      SET status = 'rejected', 
          reviewed_at = NOW(),
          admin_notes = COALESCE($1, admin_notes),
          updatedat = NOW()
      WHERE id = $2 AND status = 'pending'
      RETURNING id
    `, [notes || 'Rejected by admin', claimId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found or already processed' });
    }

    // Create notification for user
    const notificationId = 'notif-' + Date.now();
    await db.query(`
      INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      notificationId,
      claimCheck.rows[0].policy_user_id,
      'Takaful Claim Rejected',
      `Your Takaful claim has been rejected. ${notes || 'Please contact support for more details.'}`,
      'takaful',
      `/takaful/claims/${claimId}`
    ]);

    res.json({
      success: true,
      message: 'Claim rejected',
      claimId: claimId
    });

  } catch (err) {
    console.error('Error rejecting claim:', err.message);
    res.status(500).json({ error: 'Failed to reject claim' });
  }
});

// ============================================================
// 14. ADMIN - GET ALL PLANS (Admin only - includes inactive)
// ============================================================
router.get('/admin/plans', authenticate, async (req, res) => {
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
        id,
        name,
        description,
        type,
        coverage,
        monthly_cost,
        annual_cost,
        max_coverage,
        benefits,
        is_active,
        createdat,
        updatedat
      FROM takaful_plans
      ORDER BY monthly_cost ASC
    `);

    const plans = result.rows.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      type: plan.type,
      coverage: plan.coverage,
      monthlyCost: parseInt(plan.monthly_cost),
      annualCost: parseInt(plan.annual_cost),
      maxCoverage: parseInt(plan.max_coverage),
      benefits: plan.benefits || [],
      isActive: plan.is_active,
      createdAt: plan.createdat,
      updatedAt: plan.updatedat
    }));

    res.json({
      success: true,
      plans: plans,
      total: plans.length
    });

  } catch (err) {
    console.error('Error fetching admin plans:', err.message);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// ============================================================
// 15. ADMIN - CREATE PLAN (Admin only)
// ============================================================
router.post('/admin/plans', authenticate, async (req, res) => {
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

    const {
      name,
      description,
      type,
      coverage,
      monthlyCost,
      annualCost,
      maxCoverage,
      benefits = [],
      isActive = true
    } = req.body;

    // Validation
    if (!name || !type || !monthlyCost || !annualCost || !maxCoverage) {
      return res.status(400).json({ error: 'Name, type, monthlyCost, annualCost, and maxCoverage are required' });
    }

    if (parseInt(monthlyCost) <= 0 || parseInt(annualCost) <= 0 || parseInt(maxCoverage) <= 0) {
      return res.status(400).json({ error: 'All monetary values must be greater than 0' });
    }

    // Check if plan with same name exists
    const existing = await db.query(
      'SELECT id FROM takaful_plans WHERE name = $1',
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A plan with this name already exists' });
    }

    const planId = 'tplan-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');

    await db.query(`
      INSERT INTO takaful_plans (
        id, name, description, type, coverage, monthly_cost, annual_cost, max_coverage, benefits, is_active, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    `, [
      planId,
      name,
      description || null,
      type,
      coverage || null,
      parseInt(monthlyCost),
      parseInt(annualCost),
      parseInt(maxCoverage),
      benefits || [],
      isActive
    ]);

    res.status(201).json({
      success: true,
      message: 'Takaful plan created successfully',
      planId: planId
    });

  } catch (err) {
    console.error('Error creating plan:', err.message);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// ============================================================
// 16. ADMIN - UPDATE PLAN (Admin only)
// ============================================================
router.put('/admin/plans/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const planId = req.params.id;

    // Check if user is admin
    const userCheck = await db.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if plan exists
    const planCheck = await db.query(
      'SELECT id FROM takaful_plans WHERE id = $1',
      [planId]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const {
      name,
      description,
      type,
      coverage,
      monthlyCost,
      annualCost,
      maxCoverage,
      benefits,
      isActive
    } = req.body;

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (type !== undefined) {
      updates.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (coverage !== undefined) {
      updates.push(`coverage = $${paramIndex}`);
      params.push(coverage);
      paramIndex++;
    }

    if (monthlyCost !== undefined) {
      if (parseInt(monthlyCost) <= 0) {
        return res.status(400).json({ error: 'Monthly cost must be greater than 0' });
      }
      updates.push(`monthly_cost = $${paramIndex}`);
      params.push(parseInt(monthlyCost));
      paramIndex++;
    }

    if (annualCost !== undefined) {
      if (parseInt(annualCost) <= 0) {
        return res.status(400).json({ error: 'Annual cost must be greater than 0' });
      }
      updates.push(`annual_cost = $${paramIndex}`);
      params.push(parseInt(annualCost));
      paramIndex++;
    }

    if (maxCoverage !== undefined) {
      if (parseInt(maxCoverage) <= 0) {
        return res.status(400).json({ error: 'Max coverage must be greater than 0' });
      }
      updates.push(`max_coverage = $${paramIndex}`);
      params.push(parseInt(maxCoverage));
      paramIndex++;
    }

    if (benefits !== undefined) {
      updates.push(`benefits = $${paramIndex}`);
      params.push(benefits);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updatedat = NOW()`);
    params.push(planId);

    await db.query(
      `UPDATE takaful_plans SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    res.json({
      success: true,
      message: 'Plan updated successfully'
    });

  } catch (err) {
    console.error('Error updating plan:', err.message);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// ============================================================
// 17. ADMIN - DELETE PLAN (Admin only)
// ============================================================
router.delete('/admin/plans/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const planId = req.params.id;

    // Check if user is admin
    const userCheck = await db.query(
      'SELECT isadmin FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rows[0]?.isadmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if plan exists
    const planCheck = await db.query(
      'SELECT id FROM takaful_plans WHERE id = $1',
      [planId]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Check if plan has active policies
    const policyCheck = await db.query(
      'SELECT COUNT(*) as count FROM takaful_policies WHERE plan_id = $1 AND status = $2',
      [planId, 'active']
    );

    if (parseInt(policyCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete plan with active policies. Deactivate it instead.' 
      });
    }

    await db.query(
      'DELETE FROM takaful_plans WHERE id = $1',
      [planId]
    );

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting plan:', err.message);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// ============================================================
// 18. ADMIN - GET CLAIM STATS (Admin only)
// ============================================================
router.get('/admin/claims/stats', authenticate, async (req, res) => {
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
        COUNT(*) as total_claims,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_claims,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_claims,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_claims,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount
      FROM takaful_claims
    `);

    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        total: parseInt(stats.total_claims) || 0,
        pending: parseInt(stats.pending_claims) || 0,
        approved: parseInt(stats.approved_claims) || 0,
        rejected: parseInt(stats.rejected_claims) || 0,
        pendingAmount: parseInt(stats.pending_amount) || 0,
        approvedAmount: parseInt(stats.approved_amount) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching claim stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch claim stats' });
  }
});

module.exports = router;