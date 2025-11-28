#!/usr/bin/env node

const notifier = require('node-notifier');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建命令行交互接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 默认配置
const DEFAULT_CONFIG = {
  reminder_interval: 15,  // 默认15分钟
  show_notification: true,
  play_sound: true,
  sound_file: null,
  reminder_messages: [
    "该站起来活动一下啦！顺便喝口水吧~",
    "休息一下，补充水分，保持健康！",
    "喝水时间到！记得起身活动活动脖子和肩膀。",
    "工作虽重要，健康价更高！来杯水吧~",
    "每15分钟的提醒时间到了，起来动一动，喝口水！"
  ]
};

const CONFIG_FILE = path.join(__dirname, 'config.json');

/**
 * 加载配置文件
 */
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      const userConfig = JSON.parse(configData);
      // 合并默认配置和用户配置
      return { ...DEFAULT_CONFIG, ...userConfig };
    } catch (error) {
      console.error(`加载配置文件时出错: ${error.message}`);
      console.log("将使用默认配置");
    }
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * 保存配置到文件
 */
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log("配置已保存");
  } catch (error) {
    console.error(`保存配置文件时出错: ${error.message}`);
  }
}

/**
 * 发送提醒通知
 */
function sendReminder(config) {
  // 随机选择一条提醒消息
  const message = config.reminder_messages[Math.floor(Math.random() * config.reminder_messages.length)];
  
  try {
    // 发送桌面通知配置
    const notificationOptions = {
      title: '健康提醒',
      message: message,
      sound: config.play_sound ? (config.sound_file || true) : false,
      appID: 'Water Drinker Reminder',
      timeout: 60
    };
    
    // 发送桌面通知
    if (config.show_notification) {
      notifier.notify(notificationOptions);
    }
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 已发送提醒: ${message}`);
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString();
    console.error(`[${timestamp}] 发送通知时出错: ${error.message}`);
  }
}

/**
 * 配置提醒参数
 */
function configureReminder() {
  const config = loadConfig();
  
  console.log('\n==== 配置提醒设置 ====');
  console.log(`当前提醒间隔: ${config.reminder_interval}分钟`);
  
  return new Promise((resolve) => {
    rl.question('请输入新的提醒间隔（分钟），按回车保持当前设置: ', (intervalInput) => {
      if (intervalInput.trim()) {
        const newInterval = parseInt(intervalInput, 10);
        if (!isNaN(newInterval) && newInterval > 0) {
          config.reminder_interval = newInterval;
          console.log(`提醒间隔已设置为 ${newInterval} 分钟`);
        } else {
          console.log('无效的间隔时间，保持当前设置');
        }
      }
      
      rl.question('\n是否保存配置？(y/n): ', (saveInput) => {
        if (saveInput.toLowerCase() === 'y') {
          saveConfig(config);
        }
        resolve(config);
      });
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('==== 定时喝水提醒工具 - Node.js版本 ====');
  console.log('1. 开始提醒');
  console.log('2. 配置提醒');
  console.log('0. 退出');
  
  rl.question('请选择操作 (默认1): ', async (choice) => {
    if (choice === '0') {
      console.log('谢谢使用！');
      rl.close();
      return;
    } else if (choice === '2') {
      config = await configureReminder();
    } else {
      config = loadConfig();
    }
    
    console.log(`\n提醒间隔: ${config.reminder_interval}分钟`);
    console.log(`通知功能: ${config.show_notification ? '开启' : '关闭'}`);
    console.log(`声音提醒: ${config.play_sound ? '开启' : '关闭'}`);
    console.log('按 Ctrl+C 退出程序\n');
    
    // 立即发送第一条提醒
    console.log('正在发送第一条提醒...');
    sendReminder(config);
    
    // 设置定时任务
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(0, 59, config.reminder_interval); // 每指定分钟数执行一次
    
    const job = schedule.scheduleJob(rule, () => {
      sendReminder(config);
    });
    
    // 监听退出信号
    process.on('SIGINT', () => {
      job.cancel();
      console.log('\n程序已停止。祝您健康！');
      rl.close();
      process.exit(0);
    });
  });
}

// 启动程序
main().catch(error => {
  console.error('程序运行出错:', error);
  rl.close();
  process.exit(1);
});