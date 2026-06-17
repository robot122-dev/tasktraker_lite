const { exec, spawn } = require('child_process');

const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'pipe'
});

server.stdout.on('data', (data) => process.stdout.write(data));
server.stderr.on('data', (data) => process.stderr.write(data));

console.log('Waiting for server...');
setTimeout(() => {
    const cypress = spawn('npx', ['cypress', 'run', '--spec', 'cypress/e2e/tasks.cy.js', '--browser', 'electron'], {
        cwd: __dirname,
        stdio: 'inherit'
    });
    cypress.on('close', (code) => {
        server.kill();
        process.exit(code);
    });
}, 3000);
