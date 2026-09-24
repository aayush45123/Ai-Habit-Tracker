import mongoose from "mongoose";
import User from "../models/User.js";
import UserSession from "../models/UserSession.js";
import ActivityEvent from "../models/ActivityEvent.js";
import VisitorLog from "../models/VisitorLog.js";

/**
 * Helper to get date at 00:00:00 in UTC/IST
 */
function getStartOfDay(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /api/admin/analytics/overview
 * High-level platform health, engagement, and operational metrics
 */
export async function getAnalyticsOverview(req, res) {
  try {
    const todayStart = getStartOfDay(0);
    const sevenDaysAgo = getStartOfDay(7);
    const thirtyDaysAgo = getStartOfDay(30);

    // 1. Total Registered Users
    const totalUsers = await User.countDocuments();

    // 2. Daily Active Users (DAU) - active today
    const [dauSessions, dauEvents] = await Promise.all([
      UserSession.distinct("userId", { lastActivityAt: { $gte: todayStart } }),
      ActivityEvent.distinct("userId", { timestamp: { $gte: todayStart } }),
    ]);
    const dauSet = new Set([...dauSessions.map(String), ...dauEvents.map(String)]);
    const dau = dauSet.size;

    // 3. Monthly Active Users (MAU) - active in last 30 days
    const [mauSessions, mauEvents] = await Promise.all([
      UserSession.distinct("userId", { lastActivityAt: { $gte: thirtyDaysAgo } }),
      ActivityEvent.distinct("userId", { timestamp: { $gte: thirtyDaysAgo } }),
    ]);
    const mauSet = new Set([...mauSessions.map(String), ...mauEvents.map(String)]);
    const mau = mauSet.size;

    // 4. Logins Today
    const loginsToday = await ActivityEvent.countDocuments({
      eventType: "LOGIN_SUCCESS",
      timestamp: { $gte: todayStart },
    });

    // 5. Active Sessions (currently connected / active within last 30 mins)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const activeSessionsCount = await UserSession.countDocuments({
      status: "active",
      lastActivityAt: { $gte: thirtyMinutesAgo },
    });

    // 6. Aggregate Active Time & Session Stats
    const sessionAgg = await UserSession.aggregate([
      {
        $group: {
          _id: null,
          totalDuration: { $sum: "$activeDurationSeconds" },
          totalSessions: { $sum: 1 },
          avgDuration: { $avg: "$activeDurationSeconds" },
        },
      },
    ]);
    const totalActiveSeconds = sessionAgg[0]?.totalDuration || 0;
    const totalSessions = sessionAgg[0]?.totalSessions || 0;
    const avgSessionSeconds = Math.round(sessionAgg[0]?.avgDuration || 0);

    // 6b. Web Page Visitor Metrics (includes non-logged in guest visitors)
    const [
      allTimeVisitors,
      allTimeGuests,
      todayVisitors,
      todayGuests,
      pageViewsToday,
      totalPageViews,
    ] = await Promise.all([
      VisitorLog.distinct("visitorId"),
      VisitorLog.distinct("visitorId", { isGuest: true }),
      VisitorLog.distinct("visitorId", { timestamp: { $gte: todayStart } }),
      VisitorLog.distinct("visitorId", { timestamp: { $gte: todayStart }, isGuest: true }),
      VisitorLog.countDocuments({ timestamp: { $gte: todayStart } }),
      VisitorLog.countDocuments(),
    ]);
    const totalVisitors = allTimeVisitors.length;
    const guestVisitorsTotal = allTimeGuests.length;
    const visitorsToday = todayVisitors.length;
    const guestVisitorsToday = todayGuests.length;

    // 7. Feature Usage Breakdown (Past 30 days)
    const featureUsageRaw = await ActivityEvent.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const featureUsage = {
      habitsCreated: 0,
      habitsCompleted: 0,
      challengesStarted: 0,
      challengeHabitsCompleted: 0,
      focusSessions: 0,
      aiInsights: 0,
      other: 0,
    };

    featureUsageRaw.forEach((f) => {
      switch (f._id) {
        case "HABIT_CREATED":
          featureUsage.habitsCreated = f.count;
          break;
        case "HABIT_COMPLETED":
          featureUsage.habitsCompleted = f.count;
          break;
        case "CHALLENGE_STARTED":
          featureUsage.challengesStarted = f.count;
          break;
        case "CHALLENGE_HABIT_COMPLETED":
          featureUsage.challengeHabitsCompleted = f.count;
          break;
        case "FOCUS_SESSION_COMPLETED":
          featureUsage.focusSessions = f.count;
          break;
        case "AI_INSIGHTS_GENERATED":
          featureUsage.aiInsights = f.count;
          break;
        default:
          featureUsage.other += f.count;
      }
    });

    // 8. Device & Browser Breakdown
    const [deviceBreakdown, browserBreakdown] = await Promise.all([
      UserSession.aggregate([
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      UserSession.aggregate([
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // 9. Daily Usage Trend (Past 14 Days)
    const dailyTrend = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = getStartOfDay(i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dateStr = dayStart.toISOString().split("T")[0];

      const [
        dayActiveUsers,
        daySessions,
        dayLogins,
        dayEvents,
        dayVisitors,
        dayGuestVisitors,
        dayViews,
      ] = await Promise.all([
        ActivityEvent.distinct("userId", { timestamp: { $gte: dayStart, $lte: dayEnd } }),
        UserSession.aggregate([
          { $match: { loginAt: { $gte: dayStart, $lte: dayEnd } } },
          { $group: { _id: null, totalSeconds: { $sum: "$activeDurationSeconds" } } },
        ]),
        ActivityEvent.countDocuments({
          eventType: "LOGIN_SUCCESS",
          timestamp: { $gte: dayStart, $lte: dayEnd },
        }),
        ActivityEvent.countDocuments({
          timestamp: { $gte: dayStart, $lte: dayEnd },
        }),
        VisitorLog.distinct("visitorId", { timestamp: { $gte: dayStart, $lte: dayEnd } }),
        VisitorLog.distinct("visitorId", { timestamp: { $gte: dayStart, $lte: dayEnd }, isGuest: true }),
        VisitorLog.countDocuments({ timestamp: { $gte: dayStart, $lte: dayEnd } }),
      ]);

      dailyTrend.push({
        date: dateStr,
        activeUsers: dayActiveUsers.length,
        activeMinutes: Math.round((daySessions[0]?.totalSeconds || 0) / 60),
        logins: dayLogins,
        events: dayEvents,
        visitors: dayVisitors.length,
        guestVisitors: dayGuestVisitors.length,
        pageViews: dayViews,
      });
    }

    return res.json({
      summary: {
        totalUsers,
        dau,
        mau,
        loginsToday,
        activeSessionsCount,
        totalActiveMinutes: Math.round(totalActiveSeconds / 60),
        avgSessionDurationSeconds: avgSessionSeconds,
        totalSessions,
        totalVisitors,
        visitorsToday,
        guestVisitorsToday,
        guestVisitorsTotal,
        pageViewsToday,
        totalPageViews,
      },
      featureUsage,
      deviceBreakdown: deviceBreakdown.map((d) => ({ name: d._id || "unknown", count: d.count })),
      browserBreakdown: browserBreakdown.map((b) => ({ name: b._id || "Other", count: b.count })),
      dailyTrend,
    });
  } catch (error) {
    console.error("Admin analytics overview error:", error);
    return res.status(500).json({ message: "Failed to fetch analytics overview" });
  }
}

/**
 * GET /api/admin/analytics/users
 * Paginated user analytics directory with active time and login statistics
 */
export async function getAnalyticsUsers(req, res) {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      role,
      status,
      sortBy = "lastActivityAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // A user is considered "online" if they have an active session touched within 5 minutes
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000);

    // Filter Query for Users
    const matchQuery = {};
    if (role && ["user", "admin"].includes(role)) {
      matchQuery.role = role;
    }
    if (status === "active") {
      matchQuery.isActive = true;
    } else if (status === "inactive") {
      matchQuery.isActive = false;
    }

    if (search && search.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      matchQuery.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { email: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    // Aggregation pipeline to join sessions summary
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "usersessions",
          localField: "_id",
          foreignField: "userId",
          as: "sessions",
        },
      },
      {
        $addFields: {
          totalSessions: { $size: "$sessions" },
          totalActiveDurationSeconds: {
            $sum: "$sessions.activeDurationSeconds",
          },
          lastLoginAt: { $max: "$sessions.loginAt" },
          lastActivityAt: {
            $ifNull: [{ $max: "$sessions.lastActivityAt" }, "$createdAt"],
          },
          // isOnline: true if any session is active AND had activity within last 5 minutes
          isOnline: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$sessions",
                    as: "s",
                    cond: {
                      $and: [
                        { $eq: ["$$s.status", "active"] },
                        { $gte: ["$$s.lastActivityAt", onlineThreshold] },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          isAdmin: 1,
          isActive: 1,
          isOnline: 1,
          createdAt: 1,
          totalSessions: 1,
          totalActiveDurationSeconds: 1,
          lastLoginAt: 1,
          lastActivityAt: 1,
        },
      },
    ];

    // Sorting: always put online users first, then apply the requested sort
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortField =
      ["lastActivityAt", "lastLoginAt", "totalActiveDurationSeconds", "createdAt", "name"].includes(
        sortBy
      )
        ? sortBy
        : "lastActivityAt";

    // isOnline: -1 ensures online users always float to the top
    pipeline.push({ $sort: { isOnline: -1, [sortField]: sortDirection } });

    // Total Count
    const totalUsers = await User.countDocuments(matchQuery);

    // Apply pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    const users = await User.aggregate(pipeline);

    return res.json({
      users,
      pagination: {
        total: totalUsers,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalUsers / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Admin analytics users error:", error);
    return res.status(500).json({ message: "Failed to fetch user analytics" });
  }
}

/**
 * GET /api/admin/analytics/user/:id
 * Detailed activity profile and session history for an individual user
 */
export async function getAnalyticsUserById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id).select(
      "_id name email role isAdmin isActive profileImage createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Sessions metrics
    const sessionsAgg = await UserSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: "$activeDurationSeconds" },
          totalSessions: { $sum: 1 },
          lastLogin: { $max: "$loginAt" },
          lastActivity: { $max: "$lastActivityAt" },
        },
      },
    ]);

    const totalActiveSeconds = sessionsAgg[0]?.totalDuration || 0;
    const totalSessions = sessionsAgg[0]?.totalSessions || 0;
    const lastLogin = sessionsAgg[0]?.lastLogin || null;
    const lastActivity = sessionsAgg[0]?.lastActivity || user.createdAt;

    // Recent 15 sessions
    const recentSessions = await UserSession.find({ userId: id })
      .sort({ loginAt: -1 })
      .limit(15)
      .select("sessionId loginAt logoutAt lastActivityAt activeDurationSeconds status deviceType browser");

    // Recent 40 activity events
    const recentEvents = await ActivityEvent.find({ userId: id })
      .sort({ timestamp: -1 })
      .limit(40)
      .select("eventType metadata timestamp");

    // Past 14-day daily usage for this user
    const dailyUsage = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = getStartOfDay(i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dateStr = dayStart.toISOString().split("T")[0];

      const [daySession, dayEventCount] = await Promise.all([
        UserSession.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(id),
              loginAt: { $gte: dayStart, $lte: dayEnd },
            },
          },
          { $group: { _id: null, totalSeconds: { $sum: "$activeDurationSeconds" } } },
        ]),
        ActivityEvent.countDocuments({
          userId: id,
          timestamp: { $gte: dayStart, $lte: dayEnd },
        }),
      ]);

      dailyUsage.push({
        date: dateStr,
        activeMinutes: Math.round((daySession[0]?.totalSeconds || 0) / 60),
        eventsCount: dayEventCount,
      });
    }

    return res.json({
      user,
      stats: {
        totalSessions,
        totalActiveMinutes: Math.round(totalActiveSeconds / 60),
        totalActiveHours: +(totalActiveSeconds / 3600).toFixed(1),
        avgSessionMinutes: totalSessions ? Math.round(totalActiveSeconds / totalSessions / 60) : 0,
        lastLogin,
        lastActivity,
      },
      recentSessions,
      recentEvents,
      dailyUsage,
    });
  } catch (error) {
    console.error("Admin analytics user details error:", error);
    return res.status(500).json({ message: "Failed to fetch user details" });
  }
}

/**
 * GET /api/admin/analytics/activity
 * Paginated live activity feed with filters
 */
export async function getAnalyticsActivity(req, res) {
  try {
    const {
      page = 1,
      limit = 25,
      eventType,
      userId,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (eventType) {
      query.eventType = eventType;
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const [events, total] = await Promise.all([
      ActivityEvent.find(query)
        .populate("userId", "name email")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      ActivityEvent.countDocuments(query),
    ]);

    return res.json({
      events: events.map((e) => ({
        _id: e._id,
        user: e.userId ? { id: e.userId._id, name: e.userId.name, email: e.userId.email } : null,
        eventType: e.eventType,
        metadata: e.metadata,
        timestamp: e.timestamp,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Admin activity logs error:", error);
    return res.status(500).json({ message: "Failed to fetch activity logs" });
  }
}

/**
 * GET /api/admin/analytics/daily-usage
 * Time-series usage metrics over custom date intervals
 */
export async function getDailyUsageAnalytics(req, res) {
  try {
    const { days = 14 } = req.query;
    const daysNum = Math.min(90, Math.max(7, parseInt(days, 10)));

    const result = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const dayStart = getStartOfDay(i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dateStr = dayStart.toISOString().split("T")[0];

      const [
        dauUsers,
        sessionData,
        logins,
        events,
        dayVisitors,
        dayGuestVisitors,
        dayViews,
      ] = await Promise.all([
        ActivityEvent.distinct("userId", { timestamp: { $gte: dayStart, $lte: dayEnd } }),
        UserSession.aggregate([
          { $match: { loginAt: { $gte: dayStart, $lte: dayEnd } } },
          { $group: { _id: null, totalSeconds: { $sum: "$activeDurationSeconds" } } },
        ]),
        ActivityEvent.countDocuments({
          eventType: "LOGIN_SUCCESS",
          timestamp: { $gte: dayStart, $lte: dayEnd },
        }),
        ActivityEvent.countDocuments({
          timestamp: { $gte: dayStart, $lte: dayEnd },
        }),
        VisitorLog.distinct("visitorId", { timestamp: { $gte: dayStart, $lte: dayEnd } }),
        VisitorLog.distinct("visitorId", { timestamp: { $gte: dayStart, $lte: dayEnd }, isGuest: true }),
        VisitorLog.countDocuments({ timestamp: { $gte: dayStart, $lte: dayEnd } }),
      ]);

      result.push({
        date: dateStr,
        dau: dauUsers.length,
        activeMinutes: Math.round((sessionData[0]?.totalSeconds || 0) / 60),
        logins,
        events,
        visitors: dayVisitors.length,
        guestVisitors: dayGuestVisitors.length,
        pageViews: dayViews,
      });
    }

    return res.json({ dailyUsage: result });
  } catch (error) {
    console.error("Daily usage error:", error);
    return res.status(500).json({ message: "Failed to fetch daily usage" });
  }
}

/**
 * GET /api/admin/analytics/feature-usage
 * Feature breakdown over custom date intervals
 */
export async function getFeatureUsageAnalytics(req, res) {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(90, Math.max(1, parseInt(days, 10)));
    const startDate = getStartOfDay(daysNum);

    const featureStats = await ActivityEvent.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.json({
      days: daysNum,
      features: featureStats.map((f) => ({ eventType: f._id, count: f.count })),
    });
  } catch (error) {
    console.error("Feature usage error:", error);
    return res.status(500).json({ message: "Failed to fetch feature usage" });
  }
}

/**
 * GET /api/admin/analytics/visitors
 * Detailed web visitor traffic, top visited pages, device & browser breakdowns
 */
export async function getVisitorAnalytics(req, res) {
  try {
    const { days = 14 } = req.query;
    const daysNum = Math.min(90, Math.max(1, parseInt(days, 10)));
    const startDate = getStartOfDay(daysNum);
    const todayStart = getStartOfDay(0);

    const [
      allTimeVisitors,
      allTimeGuests,
      allTimeViews,
      todayVisitors,
      todayGuests,
      todayViews,
      periodVisitors,
      periodGuests,
      periodViews,
      topPagesRaw,
      deviceBreakdown,
      browserBreakdown,
    ] = await Promise.all([
      VisitorLog.distinct("visitorId"),
      VisitorLog.distinct("visitorId", { isGuest: true }),
      VisitorLog.countDocuments(),
      VisitorLog.distinct("visitorId", { timestamp: { $gte: todayStart } }),
      VisitorLog.distinct("visitorId", { timestamp: { $gte: todayStart }, isGuest: true }),
      VisitorLog.countDocuments({ timestamp: { $gte: todayStart } }),
      VisitorLog.distinct("visitorId", { timestamp: { $gte: startDate } }),
      VisitorLog.distinct("visitorId", { timestamp: { $gte: startDate }, isGuest: true }),
      VisitorLog.countDocuments({ timestamp: { $gte: startDate } }),
      VisitorLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: "$path", count: { $sum: 1 }, uniqueVisitors: { $addToSet: "$visitorId" } } },
        { $project: { _id: 1, count: 1, uniqueVisitorsCount: { $size: "$uniqueVisitors" } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      VisitorLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      VisitorLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const topPages = topPagesRaw.map((p) => ({
      path: p._id || "/",
      views: p.count,
      uniqueVisitors: p.uniqueVisitorsCount,
    }));

    return res.json({
      summary: {
        totalVisitors: allTimeVisitors.length,
        totalGuests: allTimeGuests.length,
        totalPageViews: allTimeViews,
        todayVisitors: todayVisitors.length,
        todayGuests: todayGuests.length,
        todayPageViews: todayViews,
        periodVisitors: periodVisitors.length,
        periodGuests: periodGuests.length,
        periodPageViews: periodViews,
      },
      topPages,
      deviceBreakdown: deviceBreakdown.map((d) => ({ name: d._id || "unknown", count: d.count })),
      browserBreakdown: browserBreakdown.map((b) => ({ name: b._id || "Other", count: b.count })),
    });
  } catch (error) {
    console.error("Visitor analytics error:", error);
    return res.status(500).json({ message: "Failed to fetch visitor analytics" });
  }
}
