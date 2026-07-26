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

// All cart routes require authentication
router.use(authenticate);

// ============================================================
// 1. GET CART ITEMS
// ============================================================
router.get('/', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        c.id as cart_id,
        c.product_id,
        c.quantity,
        c.createdat as added_at,
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.images,
        p.category,
        p.is_halal,
        p.vendor_id,
        u.fullname as vendor_name,
        u.business_name
      FROM cart c
      JOIN products p ON c.product_id = p.id
      JOIN users u ON p.vendor_id = u.id
      WHERE c.user_id = $1
      ORDER BY c.createdat DESC
    `, [userId]);

    const items = result.rows.map(row => ({
      id: row.product_id,
      cart_id: row.cart_id,
      name: row.name,
      price: row.price,
      original_price: row.original_price,
      quantity: row.quantity,
      images: row.images || [],
      image: row.images && row.images.length > 0 ? row.images[0] : null,
      category: row.category,
      is_halal: row.is_halal,
      vendor_id: row.vendor_id,
      vendor_name: row.vendor_name || row.business_name,
      added_at: row.added_at
    }));

    res.json({
      success: true,
      items: items,
      total_items: items.reduce((sum, item) => sum + item.quantity, 0),
      total_price: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });

  } catch (err) {
    console.error('Error fetching cart:', err.message);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// ============================================================
// 2. ADD ITEM TO CART
// ============================================================
router.post('/', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists and is active
    const productCheck = await db.query(
      'SELECT id, name, price, stock, images FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }

    const product = productCheck.rows[0];

    // Check if item already in cart
    const existing = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );

    const newQuantity = quantity || 1;

    if (existing.rows.length > 0) {
      // Update existing cart item
      const updatedQuantity = existing.rows[0].quantity + newQuantity;
      
      // Check stock
      if (product.stock !== null && updatedQuantity > product.stock) {
        return res.status(400).json({ 
          error: `Only ${product.stock} items available in stock` 
        });
      }

      await db.query(
        'UPDATE cart SET quantity = $1, updatedat = NOW() WHERE id = $2',
        [updatedQuantity, existing.rows[0].id]
      );

      res.json({
        success: true,
        message: 'Cart updated successfully',
        cart_id: existing.rows[0].id,
        quantity: updatedQuantity
      });
    } else {
      // Check stock
      if (product.stock !== null && newQuantity > product.stock) {
        return res.status(400).json({ 
          error: `Only ${product.stock} items available in stock` 
        });
      }

      // Add new item to cart
      const cartId = 'cart-' + Date.now();
      await db.query(
        'INSERT INTO cart (id, user_id, product_id, quantity, createdat, updatedat) VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [cartId, userId, product_id, newQuantity]
      );

      res.json({
        success: true,
        message: 'Item added to cart successfully',
        cart_id: cartId,
        quantity: newQuantity
      });
    }

  } catch (err) {
    console.error('Error adding to cart:', err.message);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// ============================================================
// 3. UPDATE CART ITEM QUANTITY
// ============================================================
router.put('/:productId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const productId = req.params.productId;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Check if item exists in cart
    const cartCheck = await db.query(
      'SELECT id FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (cartCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    // Check product stock
    const productCheck = await db.query(
      'SELECT stock FROM products WHERE id = $1 AND is_active = true',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productCheck.rows[0];
    if (product.stock !== null && quantity > product.stock) {
      return res.status(400).json({ 
        error: `Only ${product.stock} items available in stock` 
      });
    }

    await db.query(
      'UPDATE cart SET quantity = $1, updatedat = NOW() WHERE user_id = $2 AND product_id = $3',
      [quantity, userId, productId]
    );

    res.json({
      success: true,
      message: 'Cart updated successfully',
      quantity: quantity
    });

  } catch (err) {
    console.error('Error updating cart:', err.message);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// ============================================================
// 4. REMOVE ITEM FROM CART
// ============================================================
router.delete('/:productId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const productId = req.params.productId;

    const result = await db.query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });

  } catch (err) {
    console.error('Error removing from cart:', err.message);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// ============================================================
// 5. CLEAR CART
// ============================================================
router.delete('/', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    await db.query(
      'DELETE FROM cart WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (err) {
    console.error('Error clearing cart:', err.message);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;