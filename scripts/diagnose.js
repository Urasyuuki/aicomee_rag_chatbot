const fs = require('fs');
const path = require('path');
const http = require('http');

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

console.log(`${colors.blue}=== Local Debugging Diagnostic Tool ===${colors.reset}\n`);

// 1. Check Environment Variables
console.log(`${colors.yellow}1. Checking Environment Variables...${colors.reset}`);

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const parts = line.split('=');
      const key = parts[0];
      const val = parts.slice(1).join('=');
      if (key) env[key] = val;
    }
  });
  return env;
}

const envLocal = parseEnv(path.join(process.cwd(), '.env.local'));
const envMain = parseEnv(path.join(process.cwd(), '.env'));
const combinedEnv = { ...envMain, ...envLocal, ...process.env };

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY'
];

let envOk = true;
requiredVars.forEach(v => {
  if (combinedEnv[v]) {
    console.log(`  ${colors.green}✓ ${v} is set.${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ ${v} is MISSING!${colors.reset}`);
    envOk = false;
  }
});

if (envOk) {
    console.log(`  ${colors.green}Environment variables look good.${colors.reset}`);
} else {
    console.log(`  ${colors.red}Required environment variables are missing. Creating a chat session might fail.${colors.reset}`);
}

// 2. Check Ollama
console.log(`\n${colors.yellow}2. Checking Local LLM (Ollama)...${colors.reset}`);

const checkOllama = () => {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:11434/api/tags', (res) => {
            if (res.statusCode === 200) {
                console.log(`  ${colors.green}✓ Ollama is running (Port 11434).${colors.reset}`);
                resolve(true);
            } else {
                console.log(`  ${colors.red}✗ Ollama responded with status ${res.statusCode}${colors.reset}`);
                resolve(false);
            }
        });

        req.on('error', (e) => {
            console.log(`  ${colors.red}✗ Could not connect to Ollama: ${e.message}${colors.reset}`);
            console.log(`    Make sure Ollama is installed and running ('ollama serve').`);
            resolve(false);
        });
        
        req.end();
    });
};

checkOllama().then(() => {
    console.log(`\n${colors.blue}=== Diagnosis Complete ===${colors.reset}`);
});
