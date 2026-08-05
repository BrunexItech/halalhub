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

// ============================================================
// 1. GET CART ITEMS (Authenticated)
// ============================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(
      `
      SELECT 
        c.id as cart_id,
        c.product_id,
        c.quantity,
        c.createdat,
        p.name as product_name,
        p.price,
        p.description,
        p.original_price,
        p.images,
        p.stock,
        p.is_halal,
        p.meat_type,
        p.cut_type,
        p.price_per_kg,
        p.stock_kg,
        p.vendor_id,
        u.fullname as vendor_name,
        u.business_name,
        vp.vendor_type
      FROM cart c
      JOIN products p ON c.product_id = p.id
      JOIN users u ON p.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE c.user_id = $1
      ORDER BY c.createdat DESC
      `,
      [userId]
    );

    // Format items for frontend
    const items = result.rows.map(row => ({
      id: row.cart_id,           // Cart ID for updates/deletes
      product_id: row.product_id,
      name: row.product_name,
      price: row.price,
      original_price: row.original_price,
      quantity: parseInt(row.quantity),
      images: row.images || [],
      stock: parseInt(row.stock),
      is_halal: row.is_halal,
      vendor_id: row.vendor_id,
      vendor_name: row.vendor_name || row.business_name || 'Vendor',
      vendor_type: row.vendor_type,
      meat_type: row.meat_type,
      cut_type: row.cut_type,
      price_per_kg: row.price_per_kg,
      stock_kg: row.stock_kg
    }));

    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

    res.json({
      success: true,
      items: items,
      totalItems: totalItems,
      totalAmount: totalAmount
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart items'
    });
  }
});

// ============================================================
// 2. ADD ITEM TO CART (Authenticated)
// ============================================================
router.post('/', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const productId = req.body.product_id || req.body.productId;
    const quantity = parseInt(req.body.quantity || 1);

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Check product exists and has stock
    const productCheck = await db.query(
      'SELECT id, stock, price FROM products WHERE id = $1 AND is_active = true',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or unavailable'
      });
    }

    const product = productCheck.rows[0];

    // Check if item already in cart - USING product_id column
    const existing = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    let cartId;
    let newQuantity;

    if (existing.rows.length > 0) {
      // Update quantity
      newQuantity = parseInt(existing.rows[0].quantity) + quantity;
      
      // Check stock
      if (newQuantity > parseInt(product.stock)) {
        return res.status(400).json({
          success: false,
          error: 'Not enough stock available'
        });
      }

      await db.query(
        'UPDATE cart SET quantity = $1, updatedat = NOW() WHERE id = $2',
        [newQuantity, existing.rows[0].id]
      );
      cartId = existing.rows[0].id;
    } else {
      // Add new item
      if (quantity > parseInt(product.stock)) {
        return res.status(400).json({
          success: false,
          error: 'Not enough stock available'
        });
      }

      cartId = 'cart-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      await db.query(
        `INSERT INTO cart (id, user_id, product_id, quantity, createdat, updatedat)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [cartId, userId, productId, quantity]
      );
      newQuantity = quantity;
    }

    // Get updated cart total
    const cartSummary = await db.query(
      `
      SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(c.quantity), 0) as total_quantity,
        COALESCE(SUM(p.price * c.quantity), 0) as total_amount
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      `,
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: {
        cartId: cartId,
        productId: productId,
        quantity: newQuantity,
        totalItems: parseInt(cartSummary.rows[0].total_items) || 0,
        totalQuantity: parseInt(cartSummary.rows[0].total_quantity) || 0,
        totalAmount: parseFloat(cartSummary.rows[0].total_amount) || 0
      }
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart'
    });
  }
});

// ============================================================
// 3. UPDATE CART ITEM QUANTITY (Authenticated)
// ============================================================
router.put('/:cartId', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { cartId } = req.params;
    const { quantity } = req.body;

    if (!quantity || parseInt(quantity) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    const newQuantity = parseInt(quantity);

    // Check if item exists in cart by cart ID
    const existing = await db.query(
      'SELECT id, product_id, quantity FROM cart WHERE id = $1 AND user_id = $2',
      [cartId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }

    const cartItem = existing.rows[0];

    // Check stock for the product
    const productCheck = await db.query(
      'SELECT stock FROM products WHERE id = $1',
      [cartItem.product_id]
    );

    if (productCheck.rows.length > 0) {
      const stock = parseInt(productCheck.rows[0].stock);
      if (newQuantity > stock) {
        return res.status(400).json({
          success: false,
          error: `Only ${stock} items available in stock`
        });
      }
    }

    if (newQuantity === 0) {
      // Remove item if quantity is 0
      await db.query(
        'DELETE FROM cart WHERE id = $1 AND user_id = $2',
        [cartId, userId]
      );
    } else {
      // Update quantity
      await db.query(
        'UPDATE cart SET quantity = $1, updatedat = NOW() WHERE id = $2 AND user_id = $3',
        [newQuantity, cartId, userId]
      );
    }

    // Get updated cart summary
    const cartSummary = await db.query(
      `
      SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(c.quantity), 0) as total_quantity,
        COALESCE(SUM(p.price * c.quantity), 0) as total_amount
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      `,
      [userId]
    );

    res.json({
      success: true,
      message: newQuantity === 0 ? 'Item removed from cart' : 'Cart updated',
      data: {
        cartId: cartId,
        quantity: newQuantity,
        totalItems: parseInt(cartSummary.rows[0].total_items) || 0,
        totalQuantity: parseInt(cartSummary.rows[0].total_quantity) || 0,
        totalAmount: parseFloat(cartSummary.rows[0].total_amount) || 0
      }
    });

  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart'
    });
  }
});

// ============================================================
// 4. REMOVE ITEM FROM CART (Authenticated)
// ============================================================
router.delete('/:cartId', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { cartId } = req.params;

    const result = await db.query(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id',
      [cartId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }

    // Get updated cart summary
    const cartSummary = await db.query(
      `
      SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(c.quantity), 0) as total_quantity,
        COALESCE(SUM(p.price * c.quantity), 0) as total_amount
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      `,
      [userId]
    );

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: {
        totalItems: parseInt(cartSummary.rows[0].total_items) || 0,
        totalQuantity: parseInt(cartSummary.rows[0].total_quantity) || 0,
        totalAmount: parseFloat(cartSummary.rows[0].total_amount) || 0
      }
    });

  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart'
    });
  }
});

// ============================================================
// 5. CLEAR CART (Authenticated)
// ============================================================
router.delete('/', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    await db.query(
      'DELETE FROM cart WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        totalItems: 0,
        totalQuantity: 0,
        totalAmount: 0
      }
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart'
    });
  }
});

// ============================================================
// 6. GET CART SUMMARY (Authenticated)
// ============================================================
router.get('/summary', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(
      `
      SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(c.quantity), 0) as total_quantity,
        COALESCE(SUM(p.price * c.quantity), 0) as total_amount
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      `,
      [userId]
    );

    res.json({
      success: true,
      data: {
        totalItems: parseInt(result.rows[0].total_items) || 0,
        totalQuantity: parseInt(result.rows[0].total_quantity) || 0,
        totalAmount: parseFloat(result.rows[0].total_amount) || 0
      }
    });

  } catch (error) {
    console.error('Error getting cart summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cart summary'
    });
  }
});

module.exports = router;