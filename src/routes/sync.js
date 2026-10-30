/**
 * AGR-ID Sync API Routes
 * 
 * Endpoints untuk trigger dan monitor sinkronisasi data koperasi ke AGR-ID
 */

const express = require('express');
const router = express.Router();
const {
  syncAllCooperatives,
  syncCooperative,
  getSyncHistory,
} = require('../services/agridSync');

/**
 * POST /api/v1/sync/agrid
 * Trigger full snapshot sync untuk semua koperasi
 */
router.post('/agrid', async (req, res) => {
  try {
    console.log('[API] Triggering AGR-ID full sync...');
    
    const result = await syncAllCooperatives();
    
    res.status(200).json({
      success: true,
      message: 'AGR-ID sync completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('[API] AGR-ID sync failed:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'AGR-ID sync failed',
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/sync/agrid/:cooperativeId
 * Trigger partial sync untuk koperasi spesifik
 */
router.post('/agrid/:cooperativeId', async (req, res) => {
  try {
    const { cooperativeId } = req.params;
    console.log(`[API] Triggering AGR-ID sync for cooperative: ${cooperativeId}`);
    
    const result = await syncCooperative(cooperativeId);
    
    res.status(200).json({
      success: true,
      message: 'AGR-ID sync completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('[API] AGR-ID sync failed:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'AGR-ID sync failed',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/sync/history
 * Get sync history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log(`[API] Fetching sync history (limit: ${limit})`);
    
    const history = await getSyncHistory(limit);
    
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('[API] Failed to fetch sync history:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync history',
      error: error.message,
    });
  }
});

module.exports = router;
