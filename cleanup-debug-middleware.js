// Script to remove debugging middleware from the Telegram bot
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const functionFilePath = path.join(process.cwd(), 'supabase', 'functions', 'tg', 'index.ts');

// Read the current file
let fileContent = fs.readFileSync(functionFilePath, 'utf8');

// Remove the debugging middleware
const debugMiddleware = 'bot.use((ctx, next) => {\n  console.log(\'TG_UPDATE\', JSON.stringify(ctx.update, null, 2));\n  return next();\n});';

if (fileContent.includes(debugMiddleware)) {
  fileContent = fileContent.replace(debugMiddleware, '');
  
  // Write the updated file
  fs.writeFileSync(functionFilePath, fileContent, 'utf8');
  
  console.log('✅ Debugging middleware removed from tg function');
  console.log('🔧 Deploying updated function...');
  
  // Deploy the updated function
  const deploy = spawn('supabase', ['functions', 'deploy', 'tg'], { stdio: 'inherit' });
  
  deploy.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Function deployed successfully without debugging middleware');
    } else {
      console.log('❌ Failed to deploy function');
    }
  });
} else {
  console.log('🔍 Debugging middleware not found in tg function');
}