const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const { authenticate } = require('../middleware/auth');

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

// All Takaful routes require authentication
router.use(authenticate);

// ============================================================
// 1. GET TAKAFUL PLANS
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
// 3. ENROLL IN TAKAFUL PLAN
// ============================================================
router.post('/enroll', async (req, res) => {
  try {
    const db = await getClient();
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

    // Check user balance
    const userCheck = await db.query(
      'SELECT walletbalance FROM users WHERE id = $1',
      [userId]
    );

    const balance = parseInt(userCheck.rows[0].walletbalance) || 0;

    if (balance < plan.monthly_cost) {
      return res.status(400).json({ error: 'Insufficient balance for first month contribution' });
    }

    const policyId = 'tpol-' + Date.now();
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    // Start transaction
    await db.query('BEGIN');

    try {
      // Deduct first month contribution from wallet
      await db.query(
        'UPDATE users SET walletbalance = walletbalance - $1, updatedat = NOW() WHERE id = $2',
        [plan.monthly_cost, userId]
      );

      // Create policy
      await db.query(`
        INSERT INTO takaful_policies (
          id, user_id, plan_id, status, start_date, expiry_date,
          monthly_contribution, total_coverage, members, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [policyId, userId, plan_id, 'active', startDate, expiryDate, plan.monthly_cost, plan.max_coverage, 1]);

      // Record first contribution
      const contributionId = 'tcont-' + Date.now();
      await db.query(`
        INSERT INTO takaful_contributions (
          id, policy_id, amount, status, payment_method, contribution_date, createdat
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [contributionId, policyId, plan.monthly_cost, 'paid', 'wallet', startDate]);

      // Update pool stats
      await db.query(`
        UPDATE takaful_pool_stats 
        SET total_members = total_members + 1,
            pool_balance = pool_balance + $1,
            updatedat = NOW()
        WHERE id = (SELECT id FROM takaful_pool_stats LIMIT 1)
      `, [plan.monthly_cost]);

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Successfully enrolled in Takaful plan',
        policyId: policyId,
        planName: plan.name,
        monthlyCost: parseInt(plan.monthly_cost),
        coverage: parseInt(plan.max_coverage),
        startDate: startDate,
        expiryDate: expiryDate
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error enrolling in Takaful:', err.message);
    res.status(500).json({ error: 'Failed to enroll in Takaful' });
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
// 6. SUBMIT CLAIM
// ============================================================
router.post('/claims', async (req, res) => {
  try {
    const db = await getClient();
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

    const claimId = 'tclm-' + Date.now();
    await db.query(`
      INSERT INTO takaful_claims (
        id, policy_id, user_id, type, amount, description, status, submitted_at, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
    `, [claimId, policy.id, userId, type, parseInt(amount), description || null]);

    res.json({
      success: true,
      message: 'Claim submitted successfully',
      claimId: claimId,
      status: 'pending'
    });

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

module.exports = router;