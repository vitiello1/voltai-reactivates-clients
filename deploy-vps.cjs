/**
 * Voltai VPS Deploy Script
 * Uses ssh2 to connect to the VPS and run deploy commands
 */

const { Client } = require('ssh2');
const readline = require('readline');

const VPS = {
  host: '129.121.51.87',
  port: 22022,
  username: 'root',
};

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function runCommands(conn, commands) {
  return new Promise((resolve, reject) => {
    let output = '';
    let index = 0;

    function next() {
      if (index >= commands.length) {
        resolve(output);
        return;
      }

      const cmd = commands[index++];
      console.log(`\n>>> ${cmd}`);
      output += `\n>>> ${cmd}\n`;

      conn.exec(cmd, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        stream.on('close', (code) => {
          if (code !== 0) {
            console.warn(`  [exit code: ${code}]`);
          }
          next();
        });

        stream.on('data', (data) => {
          process.stdout.write(data);
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          process.stderr.write(data);
          output += '[stderr] ' + data.toString();
        });
      });
    }

    next();
  });
}

async function detectProjectPath(conn) {
  return new Promise((resolve) => {
    conn.exec('ls /var/www/ 2>/dev/null', (err, stream) => {
      if (err) { resolve('/var/www/voltai'); return; }
      let out = '';
      stream.on('data', (d) => out += d.toString());
      stream.stderr.on('data', () => {});
      stream.on('close', () => {
        const dirs = out.split('\n').map(d => d.trim()).filter(Boolean);
        console.log('Directories in /var/www/:', dirs);
        // Prefer 'voltai' or any voltai-related dir, fallback to html
        const voltaiDir = dirs.find(d => d.toLowerCase().includes('voltai'));
        if (voltaiDir) resolve(`/var/www/${voltaiDir}`);
        else resolve('/var/www/voltai');
      });
    });
  });
}

async function main() {
  const password = process.env.VPS_PASSWORD || await prompt('Enter VPS root password: ');

  const conn = new Client();

  conn.on('ready', async () => {
    console.log('\nConnected to VPS successfully.\n');

    try {
      const projectPath = await detectProjectPath(conn);
      console.log(`Using project path: ${projectPath}`);

      const commands = [
        // Ensure project dir exists
        `mkdir -p ${projectPath}`,
        // Check git status
        `cd ${projectPath} && git status 2>&1 || echo "Not a git repo yet"`,
        // Pull latest changes (or clone if needed)
        `cd ${projectPath} && git pull origin main 2>&1 || echo "git pull failed — may need to clone first"`,
        // Install dependencies if package.json exists
        `cd ${projectPath} && [ -f package.json ] && npm install --production 2>&1 || echo "No package.json or npm install skipped"`,
        // Build
        `cd ${projectPath} && [ -f package.json ] && npm run build 2>&1 || echo "Build step skipped"`,
        // Check where nginx serves from
        `cat /etc/nginx/sites-enabled/* 2>/dev/null | grep root | head -5 || echo "Could not detect nginx root"`,
        // Copy dist to nginx root
        `[ -d ${projectPath}/dist ] && cp -r ${projectPath}/dist/. /var/www/html/ && echo "Dist copied to /var/www/html/" || echo "No dist/ folder found"`,
        // Reload nginx
        `nginx -t && systemctl reload nginx && echo "Nginx reloaded" || echo "Nginx reload failed"`,
        // Verify
        `ls -la /var/www/html/ | head -20`,
        `curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://localhost/ || echo "Could not curl localhost"`,
      ];

      await runCommands(conn, commands);

      console.log('\n✓ Deployment complete.');
    } catch (err) {
      console.error('Deployment error:', err);
    } finally {
      conn.end();
    }
  });

  conn.on('error', (err) => {
    console.error('SSH connection error:', err.message);
    process.exit(1);
  });

  conn.connect({
    host: VPS.host,
    port: VPS.port,
    username: VPS.username,
    password,
    readyTimeout: 20000,
    hostVerifier: () => true, // accept any host key
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
