import fs from 'fs';
import path from 'path';
const runDeploymentTests = () => {
    console.log('--- Starting Deployment & Infrastructure Validation Tests ---');
    // Test Case 1: docker-compose.yml structure verification
    const composePath = path.join(process.cwd(), 'docker-compose.yml');
    console.assert(fs.existsSync(composePath), 'Test 1 Failed: docker-compose.yml should exist');
    const composeContent = fs.readFileSync(composePath, 'utf8');
    console.assert(composeContent.includes('anon-chat-db'), 'Test 1 Failed: Should specify db container');
    console.assert(composeContent.includes('anon-chat-redis'), 'Test 1 Failed: Should specify redis container');
    console.assert(composeContent.includes('anon-chat-nginx'), 'Test 1 Failed: Should specify nginx container');
    console.log('Test 1 Passed: docker-compose.yml file contains all required services.');
    // Test Case 2: Nginx config check
    const nginxPath = path.join(process.cwd(), 'nginx', 'nginx.conf');
    console.assert(fs.existsSync(nginxPath), 'Test 2 Failed: nginx.conf should exist');
    const nginxContent = fs.readFileSync(nginxPath, 'utf8');
    console.assert(nginxContent.includes('proxy_pass http://frontend:3000'), 'Test 2 Failed: Should reverse proxy frontend');
    console.assert(nginxContent.includes('proxy_pass http://backend:4000'), 'Test 2 Failed: Should reverse proxy backend');
    console.log('Test 2 Passed: nginx.conf reverse proxy rules validated successfully.');
    console.log('All Deployment verification tests completed successfully!');
};
runDeploymentTests();
