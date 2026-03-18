const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Read .env.local and parse keys manually
function readEnvLocal(filePath) {
  const envContent = fs.readFileSync(filePath, 'utf-8');
  const envLines = envContent.split('\n');
  const env = {};
  envLines.forEach(line => {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2];
      // Remove surrounding quotes if any
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith('\'') && value.endsWith('\'')) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });
  return env;
}

// 2. Map usernames to IDs
const teamUserMap = {
  richard: null,
  jared: null,
  gilfoyle: null,
  dinesh: null,
  erlich: null,
  bighead: null
};

// Placeholder function to fetch user ID by username from a data source
function getUserIdByUsername(username) {
  // This function should be implemented based on how user data is stored
  // For example, from a database or API call. Here, we just simulate returning an ID.
  // Replace this with real lookup logic.
  const simulatedIds = {
    richard: 'user-r-123',
    jared: 'user-j-456',
    gilfoyle: 'user-g-789',
    dinesh: 'user-d-101',
    erlich: 'user-e-112',
    bighead: 'user-b-131'
  };
  return simulatedIds[username] || null;
}

// Backups folder path
const backupFolder = path.resolve(__dirname, 'backup-agents');
if (!fs.existsSync(backupFolder)) {
  fs.mkdirSync(backupFolder);
}

// Simulated functions to list agents and orders
// Replace with real data-fetching logic
function listAgents() {
  // Fetch all agents
  // Example: fetch from database or API
  return [
    { slug: 'agent-1', owner: 'user-r-123' },
    { slug: 'agent-2', owner: 'user-j-456' },
    { slug: 'agent-3', owner: 'user-x-999' }, // Non-team
    { slug: 'agent-4', owner: 'user-d-101' },
    { slug: 'agent-5', owner: 'user-z-777' }  // Non-team
  ];
}

function listOrdersForAgent(agentSlug) {
  // Fetch orders for given agent
  // Example: fetch from database or API
  return [
    { id: 'order-1', agentSlug },
    { id: 'order-2', agentSlug }
  ];
}

// Backup an agent and its orders
function backupAgent(agent) {
  const agentBackupPath = path.join(backupFolder, `${agent.slug}.json`);
  const orders = listOrdersForAgent(agent.slug);
  const backupData = {
    agent,
    orders
  };
  fs.writeFileSync(agentBackupPath, JSON.stringify(backupData, null, 2), 'utf-8');
}

// Delete an order (simulation)
function deleteOrder(order) {
  console.log(`Deleting order ${order.id}`);
  // Replace with real delete logic
}

// Delete an agent (simulation)
function deleteAgent(agent) {
  console.log(`Deleting agent ${agent.slug}`);
  // Replace with real delete logic
}

(async function main() {
  // Load env variables
  const env = readEnvLocal(path.resolve(__dirname, '.env.local'));

  // Map usernames to IDs (simulate real lookup)
  for (const username of Object.keys(teamUserMap)) {
    teamUserMap[username] = getUserIdByUsername(username);
  }

  const allAgents = listAgents();

  // Identify non-team agents
  const teamUserIds = new Set(Object.values(teamUserMap));
  const nonTeamAgents = allAgents.filter(agent => !teamUserIds.has(agent.owner));

  // Backup and delete non-team agents & orders
  const deletedSlugs = [];
  for (const agent of nonTeamAgents) {
    backupAgent(agent);
    const orders = listOrdersForAgent(agent.slug);
    for (const order of orders) {
      deleteOrder(order);
    }
    deleteAgent(agent);
    deletedSlugs.push(agent.slug);
  }

  // Run `npm run build`
  try {
    console.log('Running npm run build...');
    execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname) });
  } catch (err) {
    console.error('Build failed:', err);
  }

  // Report deleted slugs
  console.log('Deleted agent slugs:', deletedSlugs);
})();
