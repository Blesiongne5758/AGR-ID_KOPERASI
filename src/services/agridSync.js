/**
 * AGR-ID Sync Job - Sinkronisasi Data Koperasi ke AGR-ID
 * 
 * Job ini membaca data koperasi dan anggota dari database lokal,
 * membentuk payload sesuai spesifikasi AGR-ID, lalu mengirimkannya
 * ke endpoint POST /api/v1/cooperatives/sync
 * 
 * Fitur:
 * - Snapshot mode (full sync) atau partial update
 * - Authentication dengan Bearer token
 * - Retry mechanism dengan exponential backoff
 * - Comprehensive logging
 * - Error handling
 */

const axios = require('axios');
const db = require('../config/database');

// Configuration
const AGRID_BASE_URL = process.env.AGRID_BASE_URL || 'https://agr.id';
const AGRID_SYNC_ENDPOINT = `${AGRID_BASE_URL}/api/v1/cooperatives/sync`;
const AGRID_API_TOKEN = process.env.AGRID_API_TOKEN; // From secret manager

// Validate configuration
if (!AGRID_API_TOKEN) {
  throw new Error('AGRID_API_TOKEN is required. Set it in environment variables or secret manager.');
}

/**
 * Fetch all active cooperatives with their members
 * @returns {Promise<Array>} Array of cooperatives with members
 */
async function fetchCooperativesWithMembers() {
  const query = `
    SELECT 
      c.id,
      c.coop_code as code,
      c.name,
      c.is_active as active,
      json_agg(
        json_build_object(
          'id', u.id::text,
          'number', u.member_id,
          'name', u.full_name,
          'email', u.email,
          'active', m.status = 'ACTIVE'
        ) ORDER BY u.member_id
      ) FILTER (WHERE u.id IS NOT NULL) as members
    FROM cooperatives c
    LEFT JOIN memberships m ON c.id = m.cooperative_id
    LEFT JOIN users u ON m.user_id = u.id
    WHERE c.is_active = true
    GROUP BY c.id, c.coop_code, c.name, c.is_active
  `;

  const result = await db.query(query);
  
  // Transform to match AGR-ID payload structure
  return result.rows.map(row => ({
    id: row.id,
    code: row.code,
    name: row.name,
    active: row.active,
    members: row.members || [],
  }));
}

/**
 * Fetch specific cooperative with members
 * @param {string} cooperativeId - UUID of cooperative
 * @returns {Promise<Object>} Cooperative with members
 */
async function fetchCooperativeWithMembers(cooperativeId) {
  const query = `
    SELECT 
      c.id,
      c.coop_code as code,
      c.name,
      c.is_active as active,
      json_agg(
        json_build_object(
          'id', u.id::text,
          'number', u.member_id,
          'name', u.full_name,
          'email', u.email,
          'active', m.status = 'ACTIVE'
        ) ORDER BY u.member_id
      ) FILTER (WHERE u.id IS NOT NULL) as members
    FROM cooperatives c
    LEFT JOIN memberships m ON c.id = m.cooperative_id
    LEFT JOIN users u ON m.user_id = u.id
    WHERE c.id = $1
    GROUP BY c.id, c.coop_code, c.name, c.is_active
  `;

  const result = await db.query(query, [cooperativeId]);
  
  if (result.rows.length === 0) {
    throw new Error(`Cooperative not found: ${cooperativeId}`);
  }

  const row = result.rows[0];
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    active: row.active,
    members: row.members || [],
  };
}

/**
 * Build sync payload
 * @param {Array} cooperatives - Array of cooperatives with members
 * @param {boolean} snapshot - Whether this is a full snapshot
 * @returns {Object} Payload for AGR-ID
 */
function buildSyncPayload(cooperatives, snapshot = true) {
  return {
    snapshot,
    cooperatives: cooperatives.map(coop => ({
      id: coop.id,
      code: coop.code,
      name: coop.name,
      active: coop.active,
      members: coop.members.map(member => ({
        id: member.id,
        number: member.number,
        name: member.name,
        email: member.email,
        active: member.active,
      })),
    })),
  };
}

/**
 * Send sync request to AGR-ID with retry mechanism
 * @param {Object} payload - Sync payload
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<Object>} Response from AGR-ID
 */
async function sendSyncRequest(payload, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AGR-ID Sync] Attempt ${attempt}/${maxRetries}`);
      
      const response = await axios.post(AGRID_SYNC_ENDPOINT, payload, {
        headers: {
          'Authorization': `Bearer ${AGRID_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      });

      console.log(`[AGR-ID Sync] Success on attempt ${attempt}`);
      return response.data;
      
    } catch (error) {
      lastError = error;
      
      if (error.response) {
        // AGR-ID responded with error status
        console.error(`[AGR-ID Sync] HTTP Error ${error.response.status}:`, error.response.data);
        
        // Don't retry on 4xx errors (client errors)
        if (error.response.status >= 400 && error.response.status < 500) {
          throw new Error(`AGR-ID sync failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
      } else if (error.request) {
        // Request made but no response received
        console.error(`[AGR-ID Sync] Network Error:`, error.message);
      } else {
        // Something else happened
        console.error(`[AGR-ID Sync] Error:`, error.message);
      }

      // Exponential backoff: 2s, 4s, 8s
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[AGR-ID Sync] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`AGR-ID sync failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Log sync result to database
 * @param {Object} payload - Sync payload
 * @param {Object} response - Response from AGR-ID
 * @param {string} status - 'SUCCESS' or 'FAILED'
 * @param {string} error - Error message if failed
 */
async function logSyncResult(payload, response, status, error = null) {
  const query = `
    INSERT INTO agrid_sync_logs (
      id,
      sync_type,
      cooperatives_count,
      members_count,
      payload,
      response,
      status,
      error_message,
      created_at
    ) VALUES (
      gen_random_uuid(),
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      NOW()
    )
  `;

  const cooperativesCount = payload.cooperatives.length;
  const membersCount = payload.cooperatives.reduce((sum, coop) => sum + coop.members.length, 0);

  await db.query(query, [
    payload.snapshot ? 'SNAPSHOT' : 'PARTIAL',
    cooperativesCount,
    membersCount,
    JSON.stringify(payload),
    response ? JSON.stringify(response) : null,
    status,
    error,
  ]);
}

/**
 * Main sync function - Full snapshot sync
 * @returns {Promise<Object>} Sync result
 */
async function syncAllCooperatives() {
  console.log('[AGR-ID Sync] Starting full snapshot sync...');
  
  try {
    // 1. Fetch all cooperatives with members
    const cooperatives = await fetchCooperativesWithMembers();
    console.log(`[AGR-ID Sync] Fetched ${cooperatives.length} cooperatives`);

    // 2. Build payload
    const payload = buildSyncPayload(cooperatives, true);
    console.log(`[AGR-ID Sync] Built payload with ${payload.cooperatives.length} cooperatives`);

    // 3. Send to AGR-ID
    const response = await sendSyncRequest(payload);
    console.log('[AGR-ID Sync] Sync completed successfully');

    // 4. Log result
    await logSyncResult(payload, response, 'SUCCESS');

    return {
      success: true,
      cooperatives_synced: response.cooperatives_synced,
      members_synced: response.members_synced,
      snapshot: response.snapshot,
    };

  } catch (error) {
    console.error('[AGR-ID Sync] Sync failed:', error.message);
    
    // Log failure
    try {
      await logSyncResult(null, null, 'FAILED', error.message);
    } catch (logError) {
      console.error('[AGR-ID Sync] Failed to log error:', logError.message);
    }

    throw error;
  }
}

/**
 * Sync specific cooperative - Partial update
 * @param {string} cooperativeId - UUID of cooperative
 * @returns {Promise<Object>} Sync result
 */
async function syncCooperative(cooperativeId) {
  console.log(`[AGR-ID Sync] Starting partial sync for cooperative: ${cooperativeId}`);
  
  try {
    // 1. Fetch cooperative with members
    const cooperative = await fetchCooperativeWithMembers(cooperativeId);
    console.log(`[AGR-ID Sync] Fetched cooperative: ${cooperative.name}`);

    // 2. Build payload
    const payload = buildSyncPayload([cooperative], false);
    console.log(`[AGR-ID Sync] Built payload for 1 cooperative`);

    // 3. Send to AGR-ID
    const response = await sendSyncRequest(payload);
    console.log('[AGR-ID Sync] Sync completed successfully');

    // 4. Log result
    await logSyncResult(payload, response, 'SUCCESS');

    return {
      success: true,
      cooperatives_synced: response.cooperatives_synced,
      members_synced: response.members_synced,
      snapshot: response.snapshot,
    };

  } catch (error) {
    console.error(`[AGR-ID Sync] Sync failed for cooperative ${cooperativeId}:`, error.message);
    
    // Log failure
    try {
      await logSyncResult(null, null, 'FAILED', error.message);
    } catch (logError) {
      console.error('[AGR-ID Sync] Failed to log error:', logError.message);
    }

    throw error;
  }
}

/**
 * Get sync history from logs
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Array>} Array of sync logs
 */
async function getSyncHistory(limit = 10) {
  const query = `
    SELECT 
      id,
      sync_type,
      cooperatives_count,
      members_count,
      status,
      error_message,
      created_at
    FROM agrid_sync_logs
    ORDER BY created_at DESC
    LIMIT $1
  `;

  const result = await db.query(query, [limit]);
  return result.rows;
}

module.exports = {
  syncAllCooperatives,
  syncCooperative,
  getSyncHistory,
  fetchCooperativesWithMembers,
  buildSyncPayload,
};
