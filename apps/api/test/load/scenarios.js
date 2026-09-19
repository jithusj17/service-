import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const ErrorRate = new Rate('errors');
const LoginLatency = new Trend('login_latency');
const GetWorkOrdersLatency = new Trend('get_work_orders_latency');

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 users
    { duration: '1m', target: 50 },   // Sustain 50 users
    { duration: '30s', target: 0 },   // Ramp-down to 0 users
  ],
  thresholds: {
    // 95% of requests must complete within 200ms, 99% within 500ms
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    // Error rate must be less than 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

// We assume there's a pre-seeded test user for load testing
const USER_CREDENTIALS = {
  email: 'loadtest@example.com',
  password: 'Password123!',
};

export default function () {
  // 1. Login
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(USER_CREDENTIALS), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200 || r.status === 201,
  });
  
  ErrorRate.add(loginRes.status >= 400);
  LoginLatency.add(loginRes.timings.duration);

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    sleep(1);
    return; // Exit iteration if login fails
  }

  const token = loginRes.json('accessToken');
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  sleep(1); // Think time

  // 2. Fetch Work Orders (Read heavy)
  const workOrdersRes = http.get(`${BASE_URL}/work-orders`, authHeaders);
  
  check(workOrdersRes, {
    'fetched work orders': (r) => r.status === 200,
  });
  
  ErrorRate.add(workOrdersRes.status >= 400);
  GetWorkOrdersLatency.add(workOrdersRes.timings.duration);

  sleep(1); // Think time
}
