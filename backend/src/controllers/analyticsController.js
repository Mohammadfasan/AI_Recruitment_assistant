import * as analyticsService from '../services/analyticsService.js';

export const getDashboardData = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const getSeekerDashboardData = async (req, res, next) => {
  try {
    const stats = await analyticsService.getSeekerDashboardStats(req.user._id);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
