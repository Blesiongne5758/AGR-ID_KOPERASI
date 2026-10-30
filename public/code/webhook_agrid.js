// ============================================================================
// Webhook Endpoint: AGRID Order Processing
// Integration Engineer Implementation
// ============================================================================
// POST /api/v1/webhooks/agrid-order
// - Verifikasi HMAC-SHA256 signature
// - Process order dengan database transaction
// - Update Paylater limit atau catat pembayaran angsuran
// ============================================================================

const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');

const router = express.Router();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Webhook Configuration
const AGRID_WEBHOOK_SECRET = process.env.AGRID_WEBHOOK_SECRET;
const WEBHOOK_TOLERANCE_SECONDS = 300; // 5 minutes tolerance for timestamp

// Custom Error Classes
class WebhookError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// ============================================================================
// Signature Verification
// ============================================================================
function verifyWebhookSignature(payload, signature, timestamp) {
  // Check if signature and timestamp are provided
  if (!signature || !timestamp) {
    throw new WebhookError('Missing signature or timestamp header', 401);
  }

  // Check timestamp tolerance (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp, 10);
  
  if (Math.abs(now - webhookTime) > WEBHOOK_TOLERANCE_SECONDS) {
    throw new WebhookError('Webhook timestamp expired', 401);
  }

  // Create expected signature
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', AGRID_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  // Compare signatures (timing-safe comparison)
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!isValid) {
    throw new WebhookError('Invalid webhook signature', 401);
  }

  return true;
}

// ============================================================================
// POST /api/v1/webhooks/agrid-order
// ============================================================================
router.post('/agrid-order', async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // Step 1: Extract headers
    const signature = req.headers['x-agrid-signature'];
    const timestamp = req.headers['x-agrid-timestamp'];
    const eventId = req.headers['x-agrid-event-id'];

    // Step 2: Verify signature
    verifyWebhookSignature(req.body, signature, timestamp);

    // Step 3: Extract and validate payload
    const { member_id, cooperative_id, order_amount, status, order_id } = req.body;

    if (!member_id || !cooperative_id || !order_amount || !status) {
      throw new WebhookError('Missing required fields in payload');
    }

    if (typeof order_amount !== 'number' || order_amount <= 0) {
      throw new WebhookError('Invalid order_amount');
    }

    // Step 4: Check idempotency (prevent duplicate processing)
    const idempotencyCheck = await pool.query(
      `SELECT id FROM webhook_logs 
       WHERE event_id = $1 AND status = 'COMPLETED'`,
      [eventId]
    );

    if (idempotencyCheck.rows.length > 0) {
      // Already processed, return success
      return res.status(200).json({
        success: true,
        message: 'Webhook already processed',
        data: { webhook_id: idempotencyCheck.rows[0].id },
      });
    }

    // Step 5: Log webhook receipt
    const webhookLog = await pool.query(
      `INSERT INTO webhook_logs (
        event_id, event_type, payload, signature, 
        is_verified, status, received_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id`,
      [
        eventId,
        'order.paid',
        JSON.stringify(req.body),
        signature,
        true,
        'PROCESSING',
      ]
    );

    const webhookLogId = webhookLog.rows[0].id;

    // Step 6: Process order with database transaction
    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      // Step 6.1: Find membership
      const membershipQuery = `
        SELECT 
          m.id AS membership_id,
          m.user_id,
          m.cooperative_id,
          m.status,
          u.full_name,
          c.name AS cooperative_name
        FROM memberships m
        INNER JOIN users u ON m.user_id = u.id
        INNER JOIN cooperatives c ON m.cooperative_id = c.id
        WHERE u.member_id = $1 
          AND m.cooperative_id = $2
          AND m.status = 'ACTIVE'
        FOR UPDATE
      `;

      const membershipResult = await client.query(membershipQuery, [
        member_id,
        cooperative_id,
      ]);

      if (membershipResult.rows.length === 0) {
        throw new WebhookError('Membership not found or inactive', 404);
      }

      const membership = membershipResult.rows[0];

      // Step 6.2: Process based on status
      if (status === 'PAID') {
        // Try to find active Paylater loan
        const paylaterLoanQuery = `
          SELECT 
            l.id AS loan_id,
            l.remaining_amount,
            l.total_installments,
            l.paid_installments,
            l.installment_amount
          FROM loans l
          WHERE l.membership_id = $1
            AND l.type = 'PAYLATER'
            AND l.status IN ('DISBURSED', 'OVERDUE')
            AND l.remaining_amount > 0
          ORDER BY l.applied_date DESC
          LIMIT 1
          FOR UPDATE
        `;

        const loanResult = await client.query(paylaterLoanQuery, [
          membership.membership_id,
        ]);

        if (loanResult.rows.length > 0) {
          // Option A: Reduce Paylater limit (update loan)
          const loan = loanResult.rows[0];
          const newRemaining = loan.remaining_amount - order_amount;

          if (newRemaining < 0) {
            throw new WebhookError(
              'Payment amount exceeds remaining loan balance',
              400
            );
          }

          // Update loan remaining amount
          await client.query(
            `UPDATE loans 
             SET remaining_amount = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [newRemaining, loan.loan_id]
          );

          // Check if loan is fully paid
          const newStatus = newRemaining === 0 ? 'COMPLETED' : 'DISBURSED';
          await client.query(
            `UPDATE loans 
             SET status = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [newStatus, loan.loan_id]
          );

          // Record transaction
          await client.query(
            `INSERT INTO savings_transactions (
              savings_id, transaction_type, amount,
              balance_before, balance_after, description,
              reference_number, created_at
            ) VALUES (
              (SELECT id FROM savings 
               WHERE membership_id = $1 AND type = 'SUKARELA' 
               LIMIT 1),
              'LOAN_PAYMENT',
              $2,
              $3,
              $4,
              $5,
              $6,
              NOW()
            )`,
            [
              membership.membership_id,
              order_amount,
              loan.remaining_amount,
              newRemaining,
              `Pembayaran Paylater AGRID Order ${order_id}`,
              order_id,
            ]
          );
        } else {
          // Option B: No active Paylater loan, record as regular payment
          await client.query(
            `INSERT INTO savings_transactions (
              savings_id, transaction_type, amount,
              balance_before, balance_after, description,
              reference_number, created_at
            ) VALUES (
              (SELECT id FROM savings 
               WHERE membership_id = $1 AND type = 'SUKARELA' 
               LIMIT 1),
              'DEPOSIT',
              $2,
              0,
              $2,
              $3,
              $4,
              NOW()
            )`,
            [
              membership.membership_id,
              order_amount,
              `Pembayaran AGRID Order ${order_id}`,
              order_id,
            ]
          );
        }
      } else {
        // Other statuses (PENDING, FAILED, etc.) - just log
        console.log(`Order ${order_id} status: ${status} - No action taken`);
      }

      // Step 6.3: Update webhook log status
      await client.query(
        `UPDATE webhook_logs 
         SET status = 'COMPLETED',
             processed_at = NOW(),
             cooperative_id = $1
         WHERE id = $2`,
        [cooperative_id, webhookLogId]
      );

      // Commit transaction
      await client.query('COMMIT');

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Success response
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        data: {
          webhook_id: webhookLogId,
          membership_id: membership.membership_id,
          order_id: order_id,
          amount_processed: order_amount,
          processing_time_ms: processingTime,
        },
      });
    } catch (dbError) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    // Log error
    console.error('[Webhook Error]', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      body: req.body,
    });

    // Update webhook log if exists
    if (error.isOperational) {
      try {
        await pool.query(
          `UPDATE webhook_logs 
           SET status = 'FAILED',
               error_message = $1,
               processed_at = NOW()
           WHERE event_id = $2`,
          [error.message, req.headers['x-agrid-event-id']]
        );
      } catch (logError) {
        console.error('[Log Update Error]', logError);
      }
    }

    // Pass to error handler
    next(error);
  }
});

// ============================================================================
// Error Handler Middleware
// ============================================================================
router.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'Internal webhook processing error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// Export
// ============================================================================
module.exports = router;

// ============================================================================
// Usage Example (app.js)
// ============================================================================
/*
const express = require('express');
const webhookRouter = require('./webhooks');

const app = express();

// IMPORTANT: Use raw body for signature verification
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
app.use('/api/v1/webhooks', (req, res, next) => {
  if (Buffer.isBuffer(req.body)) {
    req.body = JSON.parse(req.body.toString());
  }
  next();
});

app.use('/api/v1/webhooks', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
*/
