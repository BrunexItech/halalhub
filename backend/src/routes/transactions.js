const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Client } = require('pg');

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

// ========================================
// GET RECENT TRANSACTIONS (Authenticated)
// ========================================
router.get('/recent', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await db.query(
      `SELECT 
        id,
        type,
        amount,
        status,
        reference,
        description,
        createdat,
        updatedat
       FROM transactions 
       WHERE user_id = $1
       ORDER BY createdat DESC
       LIMIT $2`,
      [userId, limit]
    );
    
    res.json({
      success: true,
      transactions: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load transactions'
    });
  }
});

// ========================================
// GET ALL TRANSACTIONS (Authenticated)
// ========================================
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await db.query(
      `SELECT 
        id,
        type,
        amount,
        status,
        reference,
        description,
        createdat,
        updatedat
       FROM transactions 
       WHERE user_id = $1
       ORDER BY createdat DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      transactions: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: limit,
      offset: offset
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load transactions'
    });
  }
});

// ========================================
// GET TRANSACTION BY ID (Authenticated)
// ========================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT 
        id,
        type,
        amount,
        status,
        reference,
        description,
        createdat,
        updatedat
       FROM transactions 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load transaction'
    });
  }
});

// ========================================
// GET TRANSACTIONS BY TYPE (Authenticated)
// ========================================
router.get('/type/:type', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await db.query(
      `SELECT 
        id,
        type,
        amount,
        status,
        reference,
        description,
        createdat,
        updatedat
       FROM transactions 
       WHERE user_id = $1 AND type = $2
       ORDER BY createdat DESC
       LIMIT $3`,
      [userId, type, limit]
    );
    
    res.json({
      success: true,
      transactions: result.rows,
      count: result.rows.length,
      type: type
    });
  } catch (error) {
    console.error('Error fetching transactions by type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load transactions'
    });
  }
});

// ========================================
// GET TRANSACTION SUMMARY (Authenticated)
// ========================================
router.get('/summary/stats', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_debits,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
       FROM transactions 
       WHERE user_id = $1`,
      [userId]
    );
    
    res.json({
      success: true,
      summary: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load transaction summary'
    });
  }
});

module.exports = router;