const router = require('express').Router();
const { Client } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .jpg, .jpeg, .png and .pdf files are allowed'));
  }
});

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

// Vendor KYC Submission
router.post('/vendor-kyc', upload.fields([
  { name: 'businessCertificate', maxCount: 1 },
  { name: 'halalCertificate', maxCount: 1 },
  { name: 'kraCertificate', maxCount: 1 },
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 }
]), async (req, res) => {
  try {
    const { vendorId, businessName } = req.body;
    const db = await getClient();

    // Check if vendor exists
    const vendorCheck = await db.query('SELECT * FROM users WHERE id = $1 AND role = $2', [vendorId, 'vendor']);
    if (vendorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Get uploaded file paths
    const files = req.files || {};
    const documents = {
      businessCertificate: files.businessCertificate ? files.businessCertificate[0].path : null,
      halalCertificate: files.halalCertificate ? files.halalCertificate[0].path : null,
      kraCertificate: files.kraCertificate ? files.kraCertificate[0].path : null,
      idFront: files.idFront ? files.idFront[0].path : null,
      idBack: files.idBack ? files.idBack[0].path : null
    };

    // Save documents to database (create vendor_documents table)
    await db.query(`
      CREATE TABLE IF NOT EXISTS vendor_documents (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        business_certificate TEXT,
        halal_certificate TEXT,
        kra_certificate TEXT,
        id_front TEXT,
        id_back TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (vendor_id) REFERENCES users(id)
      )
    `);

    const docId = 'doc-' + Date.now();
    await db.query(`
      INSERT INTO vendor_documents (id, vendor_id, business_certificate, halal_certificate, kra_certificate, id_front, id_back)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [docId, vendorId, documents.businessCertificate, documents.halalCertificate, documents.kraCertificate, documents.idFront, documents.idBack]);

    // Update vendor status to 'documents_submitted'
    await db.query('UPDATE users SET vendor_status = $1 WHERE id = $2', ['documents_submitted', vendorId]);

    res.status(201).json({
      message: 'KYC documents submitted successfully!',
      docId: docId,
      status: 'documents_submitted'
    });
  } catch (err) {
    console.error('KYC submission error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get vendor KYC status
router.get('/vendor-status/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const db = await getClient();

    const result = await db.query(`
      SELECT u.vendor_status, d.business_certificate, d.halal_certificate, d.kra_certificate, d.submitted_at
      FROM users u
      LEFT JOIN vendor_documents d ON u.id = d.vendor_id
      WHERE u.id = $1
    `, [vendorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = result.rows[0];
    const hasDocuments = vendor.business_certificate || vendor.halal_certificate || vendor.kra_certificate;

    res.json({
      vendorId: vendorId,
      status: vendor.vendor_status || 'pending',
      hasDocuments: !!hasDocuments,
      submittedAt: vendor.submitted_at || null,
      documents: {
        businessCertificate: vendor.business_certificate || null,
        halalCertificate: vendor.halal_certificate || null,
        kraCertificate: vendor.kra_certificate || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin - Get all pending vendors
router.get('/pending-vendors', async (req, res) => {
  try {
    const db = await getClient();

    const result = await db.query(`
      SELECT id, fullname as business_name, phone, email, region, vendor_status, createdat
      FROM users
      WHERE role = 'vendor' AND vendor_status = 'documents_submitted'
      ORDER BY createdat DESC
    `);

    res.json({
      vendors: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin - Approve/Reject vendor
router.put('/vendor-verify/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { approved, notes } = req.body;
    const db = await getClient();

    const status = approved ? 'approved' : 'rejected';

    await db.query('UPDATE users SET vendor_status = $1 WHERE id = $2', [status, vendorId]);

    res.json({
      message: `Vendor ${status} successfully`,
      vendorId: vendorId,
      status: status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;