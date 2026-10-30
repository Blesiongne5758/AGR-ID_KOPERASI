/**
 * AGR-ID Sync Scheduler
 * 
 * Cron job untuk sinkronisasi berkala data koperasi ke AGR-ID
 * 
 * Schedule:
 * - Full snapshot sync: Setiap hari jam 02:00 AM
 * - Health check: Setiap 6 jam
 */

const cron = require('node-cron');
const { syncAllCooperatives } = require('../services/agridSync');

// Configuration
const SYNC_SCHEDULE = process.env.AGRID_SYNC_SCHEDULE || '0 2 * * *'; // Default: 02:00 AM daily
const HEALTH_CHECK_SCHEDULE = process.env.AGRID_HEALTH_CHECK_SCHEDULE || '0 */6 * * *'; // Default: Every 6 hours

/**
 * Initialize scheduler
 */
function initScheduler() {
  console.log('[Scheduler] Initializing AGR-ID sync scheduler...');
  console.log(`[Scheduler] Full sync schedule: ${SYNC_SCHEDULE}`);
  console.log(`[Scheduler] Health check schedule: ${HEALTH_CHECK_SCHEDULE}`);

  // Full snapshot sync - Daily at 02:00 AM
  cron.schedule(SYNC_SCHEDULE, async () => {
    console.log('[Scheduler] Starting scheduled full sync...');
    
    try {
      const result = await syncAllCooperatives();
      console.log('[Scheduler] Scheduled sync completed successfully');
      console.log(`[Scheduler] Synced ${result.cooperatives_synced} cooperatives, ${result.members_synced} members`);
    } catch (error) {
      console.error('[Scheduler] Scheduled sync failed:', error.message);
      // TODO: Send alert notification (email/Slack/etc)
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Jakarta',
  });

  // Health check - Every 6 hours
  cron.schedule(HEALTH_CHECK_SCHEDULE, async () => {
    console.log('[Scheduler] Running health check...');
    
    try {
      // Simple health check - verify API token is valid
      const axios = require('axios');
      const AGRID_BASE_URL = process.env.AGRID_BASE_URL || 'https://agr.id';
      const AGRID_API_TOKEN = process.env.AGRID_API_TOKEN;
      
      await axios.get(`${AGRID_BASE_URL}/api/v1/health`, {
        headers: {
          'Authorization': `Bearer ${AGRID_API_TOKEN}`,
        },
        timeout: 10000,
      });
      
      console.log('[Scheduler] Health check passed');
    } catch (error) {
      console.error('[Scheduler] Health check failed:', error.message);
      // TODO: Send alert notification
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Jakarta',
  });

  console.log('[Scheduler] AGR-ID sync scheduler initialized successfully');
}

/**
 * Stop scheduler
 */
function stopScheduler() {
  console.log('[Scheduler] Stopping AGR-ID sync scheduler...');
  cron.getTasks().forEach(task => task.stop());
  console.log('[Scheduler] AGR-ID sync scheduler stopped');
}

module.exports = {
  initScheduler,
  stopScheduler,
};
