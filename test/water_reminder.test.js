const fs = require('fs');
const path = require('path');

// Mock 依赖
jest.mock('node-notifier', () => ({
  notify: jest.fn()
}));
jest.mock('node-schedule');
jest.mock('fs');
jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: jest.fn((query, callback) => callback('1')),
    close: jest.fn()
  }))
}));

// 导入被测试的模块
const notifier = require('node-notifier');
const schedule = require('node-schedule');

// 导入被测试的模块
const { 
  loadConfig, 
  saveConfig, 
  sendReminder 
} = require('../water_reminder');

const CONFIG_FILE = path.join(__dirname, '../config.json');

// 默认配置
const DEFAULT_CONFIG = {
  reminder_interval: 15,
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

describe('water_reminder 测试', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    test('当配置文件不存在时，返回默认配置', () => {
      // 模拟文件不存在
      fs.existsSync.mockReturnValue(false);
      
      const config = loadConfig();
      
      expect(config).toEqual(DEFAULT_CONFIG);
      expect(fs.existsSync).toHaveBeenCalledWith(CONFIG_FILE);
    });

    test('当配置文件存在且格式正确时，返回合并后的配置', () => {
      // 模拟文件存在
      fs.existsSync.mockReturnValue(true);
      
      // 模拟用户配置
      const userConfig = {
        reminder_interval: 30,
        show_notification: false
      };
      
      fs.readFileSync.mockReturnValue(JSON.stringify(userConfig));
      
      const config = loadConfig();
      
      expect(config).toEqual({
        ...DEFAULT_CONFIG,
        ...userConfig
      });
      expect(fs.readFileSync).toHaveBeenCalledWith(CONFIG_FILE, 'utf8');
    });

    test('当配置文件格式错误时，返回默认配置', () => {
      // 模拟文件存在
      fs.existsSync.mockReturnValue(true);
      
      // 模拟读取到无效的 JSON
      fs.readFileSync.mockReturnValue('invalid json');
      
      // 捕获控制台输出
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const config = loadConfig();
      
      expect(config).toEqual(DEFAULT_CONFIG);
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('将使用默认配置');
      
      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('saveConfig', () => {
    test('成功保存配置到文件', () => {
      const config = { ...DEFAULT_CONFIG, reminder_interval: 20 };
      
      saveConfig(config);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        CONFIG_FILE,
        JSON.stringify(config, null, 2),
        'utf8'
      );
    });

    test('保存配置失败时，输出错误信息', () => {
      const config = { ...DEFAULT_CONFIG };
      
      // 模拟写入失败
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('写入失败');
      });
      
      // 捕获控制台输出
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      saveConfig(config);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('sendReminder', () => {
    test('发送提醒通知', () => {
      const config = { ...DEFAULT_CONFIG };
      
      sendReminder(config);
      
      expect(notifier.notify).toHaveBeenCalled();
      expect(notifier.notify.mock.calls[0][0]).toHaveProperty('title', '健康提醒');
      expect(notifier.notify.mock.calls[0][0]).toHaveProperty('sound', true);
    });

    test('当 show_notification 为 false 时，不发送通知', () => {
      const config = { ...DEFAULT_CONFIG, show_notification: false };
      
      sendReminder(config);
      
      expect(notifier.notify).not.toHaveBeenCalled();
    });

    test('当 play_sound 为 false 时，不播放声音', () => {
      const config = { ...DEFAULT_CONFIG, play_sound: false };
      
      sendReminder(config);
      
      expect(notifier.notify).toHaveBeenCalled();
      expect(notifier.notify.mock.calls[0][0]).toHaveProperty('sound', false);
    });

    test('使用自定义声音文件', () => {
      const config = { 
        ...DEFAULT_CONFIG, 
        sound_file: 'custom_sound.mp3' 
      };
      
      sendReminder(config);
      
      expect(notifier.notify).toHaveBeenCalled();
      expect(notifier.notify.mock.calls[0][0]).toHaveProperty('sound', 'custom_sound.mp3');
    });
  });
});
