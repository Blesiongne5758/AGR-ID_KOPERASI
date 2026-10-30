/**
 * AGR-ID Sync Scheduler
 * Cron job untuk sinkronisasi berkala ke AGR-ID
 */

const cron = require('node-cron');
const { syncAllCooperatives } = require('../services/agridSync');

// Konfigurasi schedule (default: setiap hari jam 02:00 AM)
const SYNC_SCHEDULE = process.env.AGRID_SYNC_SCHEDULE || '0 2 * * *';

/**
 * Initialize scheduler
 */
function initScheduler() {
  console.log('[Scheduler] Initializing AGR-ID sync scheduler...');
  console.log(`[Scheduler] Schedule: ${SYNC_SCHEDULE}`);

  // Full snapshot sync
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
