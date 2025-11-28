const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('开始构建...');

try {
  console.log('执行pkg打包...');
  // 使用优化后的bundle.js进行pkg打包
  execSync('pkg ./water_reminder.js --output dist/water_reminder_new.exe --target node18-win-x64 --compress Brotli --no-native-modules', { stdio: 'inherit' });
  
  // 创建dist/notifier目录
  const notifierDir = path.join(__dirname, 'dist', 'notifier');
  if (!fs.existsSync(notifierDir)) {
    fs.mkdirSync(notifierDir, { recursive: true });
    console.log('创建目录:', notifierDir);
  }
  
  // 复制notifu.exe文件
  execSync(`copy "${path.join(__dirname, 'node_modules', 'node-notifier', 'vendor', 'notifu', '*.exe')}" "${notifierDir}\"`, { stdio: 'inherit' });
  
  // 复制snoreToast.exe文件
  execSync(`copy "${path.join(__dirname, 'node_modules', 'node-notifier', 'vendor', 'snoreToast', '*.exe')}" "${notifierDir}\"`, { stdio: 'inherit' });
  
  // 复制LICENSE文件
  const licensePath = path.join(__dirname, 'node_modules', 'node-notifier', 'LICENSE');
  if (fs.existsSync(licensePath)) {
    fs.copyFileSync(licensePath, path.join(notifierDir, 'LICENSE'));
    console.log('复制LICENSE文件完成');
  }
  
  console.log('构建完成！所有文件已复制到dist目录。');
} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
}