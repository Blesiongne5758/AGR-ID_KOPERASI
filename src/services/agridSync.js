/**
 * AGR-ID Integration Service
 * Service untuk sinkronisasi data koperasi ke AGR-ID Marketplace
 */

const axios = require('axios');
const { Pool } = require('pg');

// Konfigurasi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Konfigurasi AGR-ID
// Repository: https://github.com/blesiongne5758/agr-id
// URL base: https://agr.biz.id (InfinityFree hosting)
// Database: Supabase
const AGRID_BASE_URL = process.env.AGRID_BASE_URL || 'https://agr.biz.id';
const AGRID_API_TOKEN = process.env.AGRID_API_TOKEN;
const AGRID_REPO_URL = process.env.AGRID_REPO_URL || 'https://github.com/blesiongne5758/agr-id';

/**
 * Fetch semua koperasi aktif beserta anggotanya
 * @returns {Promise<Array>} Array of cooperatives with members
 */
async function fetchCooperativesWithMembers() {
  const query = `
    SELECT 
      c.id,
      c.code,
      c.name,
      c.is_active as active,
      json_agg(
        json_build_object(
          'id', m.id::text,
          'number', m.member_number,
          'name', m.name,
          'email', m.email,
          'active', m.is_active
        ) ORDER BY m.member_number
      ) FILTER (WHERE m.id IS NOT NULL) as members
    FROM cooperatives c
    LEFT JOIN members m ON c.id = m.cooperative_id
    WHERE c.is_active = true
    GROUP BY c.id, c.code, c.name, c.is_active
  `;

  const result = await pool.query(query);
  
  return result.rows.map(row => ({
    id: row.id,
    code: row.code,
    name: row.name,
    active: row.active,
    members: row.members || [],
  }));
}

/**
 * Build payload untuk AGR-ID sync
 * @param {Array} cooperatives - Array of cooperatives with members
 * @param {boolean} snapshot - Apakah ini full snapshot atau partial update
 * @returns {Object} Payload untuk AGR-ID
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
 * Kirim data sync ke AGR-ID dengan retry mechanism
 * @param {Object} payload - Payload untuk AGR-ID
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} Response dari AGR-ID
 */
async function sendSyncRequest(payload, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AGR-ID Sync] Attempt ${attempt}/${maxRetries}`);
      
      const response = await axios.post(
        `${AGRID_BASE_URL}/api/v1/cooperatives/sync`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${AGRID_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log(`[AGR-ID Sync] Success on attempt ${attempt}`);
      return response.data;
      
    } catch (error) {
      lastError = error;
      
      // Jangan retry untuk 4xx errors (client errors)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw new Error(`AGR-ID sync failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
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
 * Log hasil sync ke database
 * @param {Object} payload - Payload yang dikirim
 * @param {Object} response - Response dari AGR-ID
 * @param {string} status - Status sync (SUCCESS/FAILED)
 * @param {string} error - Error message jika gagal
 */
async function logSyncResult(payload, response, status, error = null) {
  const query = `
    INSERT INTO agrid_sync_logs (
      sync_type,
      cooperatives_count,
      members_count,
      status,
      payload,
      response,
      error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;

  const cooperativesCount = payload?.cooperatives?.length || 0;
  const membersCount = payload?.cooperatives?.reduce((sum, coop) => sum + (coop.members?.length || 0), 0) || 0;

  await pool.query(query, [
    payload?.snapshot ? 'SNAPSHOT' : 'PARTIAL',
    cooperativesCount,
    membersCount,
    status,
    payload ? JSON.stringify(payload) : null,
    response ? JSON.stringify(response) : null,
    error,
  ]);
}

/**
 * Sync semua koperasi ke AGR-ID (Full Snapshot)
 * @returns {Promise<Object>} Result dari sync
 */
async function syncAllCooperatives() {
  console.log('[AGR-ID Sync] Starting full snapshot sync...');
  
  try {
    // 1. Fetch data dari database
    const cooperatives = await fetchCooperativesWithMembers();
    console.log(`[AGR-ID Sync] Fetched ${cooperatives.length} cooperatives`);

    // 2. Build payload
    const payload = buildSyncPayload(cooperatives, true);
    console.log(`[AGR-ID Sync] Built payload with ${payload.cooperatives.length} cooperatives`);

    // 3. Kirim ke AGR-ID
    const response = await sendSyncRequest(payload);
    console.log('[AGR-ID Sync] Sync completed successfully');

    // 4. Log hasil
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
 * Get sync history dari database
 * @param {number} limit - Jumlah record yang diambil
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

  const result = await pool.query(query, [limit]);
  return result.rows;
}

module.exports = {
  syncAllCooperatives,
  getSyncHistory,
  fetchCooperativesWithMembers,
  buildSyncPayload,
};
