// backend/src/services/takaful-api.service.js
const axios = require('axios');
const crypto = require('crypto');

class TakafulApiService {
  constructor() {
    this.baseURL = process.env.TAKAFUL_KENYA_API_URL || 'https://api.takafulkenya.co.ke/v1';
    this.apiKey = process.env.TAKAFUL_KENYA_API_KEY;
    this.apiSecret = process.env.TAKAFUL_KENYA_API_SECRET;
    this.webhookSecret = process.env.TAKAFUL_KENYA_WEBHOOK_SECRET;
    this.timeout = 30000;
  }

  /**
   * Generate HMAC signature for API requests
   */
  generateSignature(payload, timestamp) {
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    return crypto.createHmac('sha256', this.apiSecret).update(message).digest('hex');
  }

  /**
   * Get headers for API requests
   */
  getHeaders(payload = {}) {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(payload, timestamp);

    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'Accept': 'application/json'
    };
  }

  /**
   * Handle API errors consistently
   */
  handleError(error, context = '') {
    if (error.response) {
      // The request was made and the server responded with a status code outside 2xx
      console.error(`[Takaful API] ${context} - Response Error:`, {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      return {
        success: false,
        error: error.response.data?.message || error.response.data?.error || 'External API error',
        statusCode: error.response.status,
        details: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response received
      console.error(`[Takaful API] ${context} - No Response:`, error.request);
      return {
        success: false,
        error: 'No response from Takaful Kenya API. Please try again later.',
        statusCode: 504
      };
    } else {
      // Something happened in setting up the request
      console.error(`[Takaful API] ${context} - Request Error:`, error.message);
      return {
        success: false,
        error: error.message || 'Request failed',
        statusCode: 500
      };
    }
  }

  /**
   * Make authenticated API request
   */
  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const payload = data || {};

    try {
      const response = await axios({
        method,
        url,
        data: payload,
        headers: this.getHeaders(payload),
        timeout: this.timeout
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      return this.handleError(error, `${method} ${endpoint}`);
    }
  }

  // ============================================================
  // PRODUCT & QUOTE ENDPOINTS
  // ============================================================

  /**
   * Get all products from Takaful Kenya
   */
  async getProducts() {
    return this.request('GET', '/products');
  }

  /**
   * Get specific product by ID
   */
  async getProduct(productId) {
    return this.request('GET', `/products/${productId}`);
  }

  /**
   * Get product coverage options
   */
  async getCoverageOptions(productId) {
    return this.request('GET', `/products/${productId}/coverage`);
  }

  /**
   * Get a premium quote
   * @param {Object} data - Quote request data
   * @param {string} data.product_id - Product ID
   * @param {string} data.coverage_option - Coverage option selected
   * @param {number} data.sum_assured - Sum assured amount
   * @param {Object} data.client_details - Client information
   */
  async getQuote(data) {
    return this.request('POST', '/quotes', data);
  }

  // ============================================================
  // POLICY ENDPOINTS
  // ============================================================

  /**
   * Purchase a policy
   * @param {Object} data - Policy purchase data
   * @param {string} data.product_id - Product ID
   * @param {string} data.coverage_option - Coverage option
   * @param {number} data.premium - Premium amount
   * @param {Object} data.client_details - Client information
   * @param {Object} data.payment_details - Payment information
   */
  async purchasePolicy(data) {
    return this.request('POST', '/policies', data);
  }

  /**
   * Get policy by policy number
   */
  async getPolicy(policyNumber) {
    return this.request('GET', `/policies/${policyNumber}`);
  }

  /**
   * Get policies for a client
   */
  async getClientPolicies(clientReference) {
    return this.request('GET', `/policies?client_ref=${clientReference}`);
  }

  /**
   * Renew a policy
   */
  async renewPolicy(policyNumber, data) {
    return this.request('PUT', `/policies/${policyNumber}/renew`, data);
  }

  /**
   * Cancel a policy
   */
  async cancelPolicy(policyNumber, data) {
    return this.request('POST', `/policies/${policyNumber}/cancel`, data);
  }

  /**
   * Get policy status
   */
  async getPolicyStatus(policyNumber) {
    return this.request('GET', `/policies/${policyNumber}/status`);
  }

  // ============================================================
  // CLAIM ENDPOINTS
  // ============================================================

  /**
   * Submit a claim
   * @param {Object} data - Claim data
   * @param {string} data.policy_number - Policy number
   * @param {string} data.claim_type - Type of claim
   * @param {number} data.amount - Claim amount
   * @param {string} data.description - Claim description
   * @param {Array} data.documents - Supporting documents
   */
  async submitClaim(data) {
    return this.request('POST', '/claims', data);
  }

  /**
   * Get claim status
   */
  async getClaimStatus(claimReference) {
    return this.request('GET', `/claims/${claimReference}`);
  }

  /**
   * Get client claims
   */
  async getClientClaims(clientReference) {
    return this.request('GET', `/claims?client_ref=${clientReference}`);
  }

  // ============================================================
  // PAYMENT ENDPOINTS
  // ============================================================

  /**
   * Initiate payment
   */
  async initiatePayment(data) {
    return this.request('POST', '/payments/initiate', data);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentReference) {
    return this.request('GET', `/payments/${paymentReference}`);
  }

  // ============================================================
  // WEBHOOK HANDLER
  // ============================================================

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature, timestamp) {
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(`${timestamp}.${JSON.stringify(payload)}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  /**
   * Process incoming webhook
   */
  async handleWebhook(event, payload) {
    switch (event) {
      case 'policy.created':
        return this.handlePolicyCreated(payload);
      case 'policy.renewed':
        return this.handlePolicyRenewed(payload);
      case 'policy.cancelled':
        return this.handlePolicyCancelled(payload);
      case 'claim.approved':
        return this.handleClaimApproved(payload);
      case 'claim.rejected':
        return this.handleClaimRejected(payload);
      case 'claim.settled':
        return this.handleClaimSettled(payload);
      case 'payment.completed':
        return this.handlePaymentCompleted(payload);
      case 'payment.failed':
        return this.handlePaymentFailed(payload);
      default:
        console.log(`[Takaful API] Unhandled webhook event: ${event}`);
        return { success: true, message: 'Event received but not processed' };
    }
  }

  // ============================================================
  // WEBHOOK EVENT HANDLERS (Override in your app)
  // ============================================================

  async handlePolicyCreated(payload) {
    // Override this in your app to store policy in your DB
    console.log('[Takaful API] Policy Created:', payload);
    return { success: true, event: 'policy.created' };
  }

  async handlePolicyRenewed(payload) {
    console.log('[Takaful API] Policy Renewed:', payload);
    return { success: true, event: 'policy.renewed' };
  }

  async handlePolicyCancelled(payload) {
    console.log('[Takaful API] Policy Cancelled:', payload);
    return { success: true, event: 'policy.cancelled' };
  }

  async handleClaimApproved(payload) {
    console.log('[Takaful API] Claim Approved:', payload);
    return { success: true, event: 'claim.approved' };
  }

  async handleClaimRejected(payload) {
    console.log('[Takaful API] Claim Rejected:', payload);
    return { success: true, event: 'claim.rejected' };
  }

  async handleClaimSettled(payload) {
    console.log('[Takaful API] Claim Settled:', payload);
    return { success: true, event: 'claim.settled' };
  }

  async handlePaymentCompleted(payload) {
    console.log('[Takaful API] Payment Completed:', payload);
    return { success: true, event: 'payment.completed' };
  }

  async handlePaymentFailed(payload) {
    console.log('[Takaful API] Payment Failed:', payload);
    return { success: true, event: 'payment.failed' };
  }
}

// Export singleton instance
module.exports = new TakafulApiService();