import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../src/app.js";
import http from "http";
import CalorieProfile from "../src/models/CalorieProfile.js";

dotenv.config();

let server;
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log("=================================================");
  console.log("🚀 STARTING PHASE 1 & PHASE 2 VERIFICATION TESTS");
  console.log("=================================================\n");

  // Start test server instance
  await new Promise((resolve) => {
    server = http.createServer(app).listen(PORT, resolve);
  });
  console.log(`Test server running on ${BASE_URL}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: ZOD VALIDATION ON SIGNUP (INVALID BODY)
    // ----------------------------------------------------
    const invalidSignupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "A", // too short (<3)
        email: "not-an-email", // invalid email
        password: "123", // weak password
      }),
    });

    const invalidSignupData = await invalidSignupRes.json();
    assert(
      invalidSignupRes.status === 400,
      `Zod validation catches bad signup payload (Status: ${invalidSignupRes.status})`
    );
    assert(
      Array.isArray(invalidSignupData.errors) && invalidSignupData.errors.length > 0,
      `Returns structured Zod validation errors array (${JSON.stringify(invalidSignupData.errors)})`
    );

    // ----------------------------------------------------
    // TEST 2: VALID SIGNUP (REGULAR USER)
    // ----------------------------------------------------
    const timestamp = Date.now();
    const validUserPayload = {
      name: "Normal User",
      email: `user_${timestamp}@example.com`,
      password: "Password123!",
    };

    const validSignupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validUserPayload),
    });

    const validSignupData = await validSignupRes.json();
    assert(
      validSignupRes.status === 201,
      `Valid user signup succeeds (Status: ${validSignupRes.status})`
    );
    assert(
      validSignupData.user.role === "user",
      `Assigned role defaults to 'user' (${validSignupData.user.role})`
    );

    const userToken = validSignupData.token;
    const userId = validSignupData.user.id;

    // Create CalorieProfile for normal user so requireProfileCompleted passes
    await CalorieProfile.create({
      userId,
      age: 25,
      height: 175,
      weight: 70,
      gender: "male",
      activityLevel: "moderate",
      goal: "maintain",
    });

    // ----------------------------------------------------
    // TEST 3: ROLE-BASED ACCESS CONTROL (REGULAR USER -> ADMIN ROUTE)
    // ----------------------------------------------------
    const forbiddenAdminRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    assert(
      forbiddenAdminRes.status === 403,
      `Non-admin user blocked from /api/admin/dashboard (Status: ${forbiddenAdminRes.status})`
    );

    // ----------------------------------------------------
    // TEST 4: VALID SIGNUP (ADMIN USER)
    // ----------------------------------------------------
    const adminUserPayload = {
      name: "Admin User",
      email: `admin_${timestamp}@example.com`,
      password: "Password123!",
      role: "admin",
    };

    const adminSignupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminUserPayload),
    });

    const adminSignupData = await adminSignupRes.json();
    assert(
      adminSignupRes.status === 201,
      `Admin user signup succeeds (Status: ${adminSignupRes.status})`
    );
    assert(
      adminSignupData.user.role === "admin",
      `Assigned role is 'admin' (${adminSignupData.user.role})`
    );

    const adminToken = adminSignupData.token;

    // ----------------------------------------------------
    // TEST 5: ADMIN ACCESS TO /api/admin/dashboard
    // ----------------------------------------------------
    const adminDashboardRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      adminDashboardRes.status === 200,
      `Admin user granted access to /api/admin/dashboard (Status: ${adminDashboardRes.status})`
    );

    // ----------------------------------------------------
    // TEST 6: ZOD VALIDATION ON CREATE HABIT (INVALID BODY)
    // ----------------------------------------------------
    const invalidHabitRes = await fetch(`${BASE_URL}/api/habits/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        title: "12345", // numeric title
        frequency: "invalid_frequency", // invalid enum
      }),
    });

    const invalidHabitData = await invalidHabitRes.json();
    assert(
      invalidHabitRes.status === 400,
      `Zod validation rejects invalid habit title/frequency (Status: ${invalidHabitRes.status})`
    );

    // ----------------------------------------------------
    // TEST 7: CREATE HABIT & LOG HABIT ("done" status)
    // ----------------------------------------------------
    const createHabitRes = await fetch(`${BASE_URL}/api/habits/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        title: "Morning Exercise",
        frequency: "daily",
      }),
    });
    const createHabitData = await createHabitRes.json();
    assert(
      createHabitRes.status === 201,
      `Habit creation succeeds (Status: ${createHabitRes.status})`
    );

    const habitId = createHabitData.habit._id;
    const logHabitRes = await fetch(`${BASE_URL}/api/habits/${habitId}/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        status: "done",
        date: new Date().toISOString().split("T")[0],
      }),
    });
    const logHabitData = await logHabitRes.json();
    assert(
      logHabitRes.status === 200,
      `Logging habit with status 'done' succeeds (Status: ${logHabitRes.status})`
    );

    // ----------------------------------------------------
    // TEST 8: USER DASHBOARD & REDIS CACHE INTERCEPT
    // ----------------------------------------------------
    const dashboardRes1 = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      dashboardRes1.status === 200,
      `User dashboard endpoint returns 200 OK (Status: ${dashboardRes1.status})`
    );

    const dashboardRes2 = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      dashboardRes2.status === 200,
      `Subsequent user dashboard request completes successfully (Status: ${dashboardRes2.status})`
    );

  } catch (err) {
    console.error("❌ Test error encountered:", err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();

    console.log("\n=================================================");
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================\n");

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
