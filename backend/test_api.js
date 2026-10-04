const http = require('http');

const API_BASE = 'http://localhost:5001/api';

async function request(path, options = {}) {
  const url = new URL(API_BASE + path);
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let body = data;
          try {
            body = JSON.parse(data);
          } catch (e) {}
          resolve({ status: res.statusCode, data: body });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING SECTION 35 VERIFICATION TESTS ---');

  const timestamp = Date.now();
  const clientAEmail = `clientA_${timestamp}@test.com`;
  const clientBEmail = `clientB_${timestamp}@test.com`;
  const freelancerAEmail = `freelancerA_${timestamp}@test.com`;
  const freelancerBEmail = `freelancerB_${timestamp}@test.com`;

  console.log('\n[TEST 1] Register Client A, Freelancer A, Login Client A, Create Project');
  const regCA = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Client A', email: clientAEmail, password: 'password123', role: 'client' }
  });
  console.log('Register Client A:', regCA.status === 201 ? 'PASS' : `FAIL (${regCA.status})`);

  const regFA = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Freelancer A', email: freelancerAEmail, password: 'password123', role: 'freelancer' }
  });
  console.log('Register Freelancer A:', regFA.status === 201 ? 'PASS' : `FAIL (${regFA.status})`);

  const loginCA = await request('/auth/login', {
    method: 'POST',
    body: { email: clientAEmail, password: 'password123' }
  });
  const tokenCA = loginCA.data.token;
  console.log('Login Client A:', loginCA.status === 200 && tokenCA ? 'PASS' : `FAIL (${loginCA.status})`);

  const createProj = await request('/projects', {
    method: 'POST',
    token: tokenCA,
    body: { title: 'Test Project Alpha', description: 'Testing creation', budget: 10000 }
  });
  const projectId = createProj.data._id;
  console.log('Create Project by Client A:', createProj.status === 201 && projectId ? 'PASS' : `FAIL (${createProj.status})`);

  const getProjects = await request('/projects');
  const foundProj = getProjects.data.find((p) => p._id === projectId);
  console.log('Project appears in list:', foundProj ? 'PASS' : 'FAIL');

  console.log('\n[TEST 2] Login Freelancer A, Submit Bid, Bid Appears');
  const loginFA = await request('/auth/login', {
    method: 'POST',
    body: { email: freelancerAEmail, password: 'password123' }
  });
  const tokenFA = loginFA.data.token;
  console.log('Login Freelancer A:', loginFA.status === 200 && tokenFA ? 'PASS' : `FAIL (${loginFA.status})`);

  const submitBid1 = await request(`/projects/${projectId}/bids`, {
    method: 'POST',
    token: tokenFA,
    body: { amount: 8500, proposal: 'Bid from Freelancer A' }
  });
  const bidAId = submitBid1.data._id;
  console.log('Submit Bid by Freelancer A:', submitBid1.status === 201 && bidAId ? 'PASS' : `FAIL (${submitBid1.status})`);

  const getProjDetails = await request(`/projects/${projectId}`);
  const hasBid = getProjDetails.data.bids && getProjDetails.data.bids.some((b) => b._id === bidAId);
  console.log('Bid appears on project:', hasBid ? 'PASS' : 'FAIL');

  const regFB = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Freelancer B', email: freelancerBEmail, password: 'password123', role: 'freelancer' }
  });
  const loginFB = await request('/auth/login', {
    method: 'POST',
    body: { email: freelancerBEmail, password: 'password123' }
  });
  const tokenFB = loginFB.data.token;
  const submitBidB = await request(`/projects/${projectId}/bids`, {
    method: 'POST',
    token: tokenFB,
    body: { amount: 9000, proposal: 'Bid from Freelancer B' }
  });
  const bidBId = submitBidB.data._id;
  console.log('Submit Bid by Freelancer B (to test rejection):', submitBidB.status === 201 ? 'PASS' : `FAIL (${submitBidB.status})`);

  console.log('\n[TEST 3] Duplicate Bid Prevention');
  const dupBid = await request(`/projects/${projectId}/bids`, {
    method: 'POST',
    token: tokenFA,
    body: { amount: 8000, proposal: 'Second bid from Freelancer A' }
  });
  console.log('Duplicate bid rejected with 400:', dupBid.status === 400 ? 'PASS' : `FAIL (${dupBid.status})`);
  console.log('Message:', dupBid.data.message);

  console.log("\n[TEST 4] Unauthorized Client B Accepting Client A's Bid");
  const regCB = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Client B', email: clientBEmail, password: 'password123', role: 'client' }
  });
  const loginCB = await request('/auth/login', {
    method: 'POST',
    body: { email: clientBEmail, password: 'password123' }
  });
  const tokenCB = loginCB.data.token;

  const unauthorizedAccept = await request(`/bids/${bidAId}/accept`, {
    method: 'PATCH',
    token: tokenCB
  });
  console.log('Client B accepting fails with 403:', unauthorizedAccept.status === 403 ? 'PASS' : `FAIL (${unauthorizedAccept.status})`);
  console.log('Message:', unauthorizedAccept.data.message);

  console.log('\n[TEST 5] Client A Accepts Bid');
  const acceptBid = await request(`/bids/${bidAId}/accept`, {
    method: 'PATCH',
    token: tokenCA
  });
  console.log('Client A accepting succeeds (200):', acceptBid.status === 200 ? 'PASS' : `FAIL (${acceptBid.status})`);

  const projAfterAccept = await request(`/projects/${projectId}`);
  console.log('Project status is awarded:', projAfterAccept.data.status === 'awarded' ? 'PASS' : `FAIL (${projAfterAccept.data.status})`);

  const acceptedBidObj = projAfterAccept.data.bids.find((b) => b._id === bidAId);
  console.log('Accepted bid status is accepted:', acceptedBidObj && acceptedBidObj.status === 'accepted' ? 'PASS' : 'FAIL');

  const otherBidObj = projAfterAccept.data.bids.find((b) => b._id === bidBId);
  console.log('Other bid status is rejected:', otherBidObj && otherBidObj.status === 'rejected' ? 'PASS' : 'FAIL');

  console.log('\n[TEST 6] Submit Bid on Awarded Project');
  const regFC = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Freelancer C', email: `freelancerC_${timestamp}@test.com`, password: 'password123', role: 'freelancer' }
  });
  const loginFC = await request('/auth/login', {
    method: 'POST',
    body: { email: `freelancerC_${timestamp}@test.com`, password: 'password123' }
  });
  const tokenFC = loginFC.data.token;

  const bidOnAwarded = await request(`/projects/${projectId}/bids`, {
    method: 'POST',
    token: tokenFC,
    body: { amount: 7000, proposal: 'Bid on awarded project' }
  });
  console.log('Bid on awarded project fails with 400:', bidOnAwarded.status === 400 ? 'PASS' : `FAIL (${bidOnAwarded.status})`);
  console.log('Message:', bidOnAwarded.data.message);

  console.log("\n[TEST 7] Client B Modifying Client A's Project");
  const editOther = await request(`/projects/${projectId}`, {
    method: 'PUT',
    token: tokenCB,
    body: { title: 'Hacked Title' }
  });
  console.log('Unauthorized edit fails with 403:', editOther.status === 403 ? 'PASS' : `FAIL (${editOther.status})`);
  console.log('Message:', editOther.data.message);

  console.log("\n[TEST 8] Client B Deleting Client A's Project");
  const deleteOther = await request(`/projects/${projectId}`, {
    method: 'DELETE',
    token: tokenCB
  });
  console.log('Unauthorized delete fails with 403:', deleteOther.status === 403 ? 'PASS' : `FAIL (${deleteOther.status})`);
  console.log('Message:', deleteOther.data.message);

  console.log('\n--- ALL SECTION 35 TESTS COMPLETED ---');
}

runTests();
