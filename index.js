const blessed = require('blessed');
const contrib = require('blessed-contrib');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

class ParasailNodeBot {
  constructor(account, index, screen) {
    this.account = account; // 账户信息（包括私钥）
    this.index = index; // 账户索引，用于区分不同账户
    this.screen = screen; // 共享的 blessed 屏幕
    this.config = { privateKey: account.privateKey }; // 每个账户的配置
    this.baseUrl = 'https://www.parasail.network/api';
    this.initUI();
  }

  loadConfig() {
    // 直接使用构造函数传入的账户信息，不从文件加载
    return this.config;
  }

  saveConfig(config) {
    try {
      const configPath = path.resolve(`./config_account_${this.index}.json`);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      this.log(`Error saving config for account ${this.index}: ${error.message}`);
    }
  }

  async generateSignature() {
    const wallet = new ethers.Wallet(this.config.privateKey);
    const message = `By signing this message, you confirm that you agree to the Parasail Terms of Service.

Parasail (including the Website and Parasail Smart Contracts) is not intended for:
(a) access and/or use by Excluded Persons;
(b) access and/or use by any person or entity in, or accessing or using the Website from, an Excluded Jurisdiction.

Excluded Persons are prohibited from accessing and/or using Parasail (including the Website and Parasail Smart Contracts).

For full terms, refer to: https://parasail.network/Parasail_User_Terms.pdf`;
    
    const signature = await wallet.signMessage(message);
    return {
      address: wallet.address,
      msg: message,
      signature
    };
  }

  async verifyUser() {
    try {
      const signatureData = await this.generateSignature();
      
      this.log(`Attempting verification for address: ${signatureData.address}`);
      
      const response = await axios.post(`${this.baseUrl}/user/verify`, signatureData, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      });

      this.config.bearer_token = response.data.token;
      this.config.wallet_address = signatureData.address;
      this.saveConfig(this.config);

      this.log('User verification successful');
      return response.data;
    } catch (error) {
      if (error.response) {
        this.log(`Verification Error Details:`);
        this.log(`Status: ${error.response.status}`);
        this.log(`Data: ${JSON.stringify(error.response.data)}`);
        this.log(`Headers: ${JSON.stringify(error.response.headers)}`);
      } else if (error.request) {
        this.log(`No response received: ${error.request}`);
      } else {
        this.log(`Error setting up request: ${error.message}`);
      }
      
      throw error;
    }
  }

  initUI() {
    // 每个账户占用屏幕的一部分，垂直排列
    const accountHeight = Math.floor(100 / this.screen.accountsCount); // 动态计算每个账户的高度

    this.layout = blessed.layout({
      parent: this.screen,
      top: `${this.index * accountHeight}%`,
      left: 0,
      width: '100%',
      height: `${accountHeight}%`
    });

    this.banner = blessed.box({
      parent: this.layout,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: `{center}{bold}Account ${this.index + 1} - Auto Bot Parasail{/bold}{/center}`,
      tags: true,
      border: 'line',
      style: {
        fg: 'cyan',
        bold: true
      }
    });

    this.logBox = blessed.log({
      parent: this.layout,
      top: 3,
      left: 0,
      width: '70%',
      height: '80%',
      border: 'line',
      style: {
        fg: 'white',
        border: {
          fg: 'white'
        }
      },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: ' ',
        inverse: true
      }
    });

    this.statsBox = blessed.box({
      parent: this.layout,
      top: 3,
      right: 0,
      width: '30%',
      height: '80%',
      border: 'line',
      style: {
        fg: 'white',
        border: {
          fg: 'white'
        }
      }
    });

    this.countdownBox = blessed.box({
      parent: this.statsBox,
      top: 1,
      left: 1,
      right: 1,
      height: 3,
      content: 'Next Check-in: 24:00:00',
      style: {
        fg: 'white',
        border: {
          fg: 'green'
        }
      }
    });

    this.nodeStatsBox = blessed.box({
      parent: this.statsBox,
      top: 5,
      left: 1,
      right: 1,
      height: '50%',
      content: 'Loading Node Stats...',
      style: {
        fg: 'white'
      }
    });

    this.screen.render();
  }

  log(message) {
    this.logBox.log(`[Account ${this.index + 1}] ${message}`);
    this.screen.render();
  }

  updateNodeStats(stats) {
    const statsContent = [
      `Has Node: ${stats.data.has_node ? 'Yes' : 'No'}`,
      `Node Address: ${stats.data.node_address}`,
      `Points: ${stats.data.points}`,
      `Pending Rewards: ${stats.data.pending_rewards || 'None'}`,
      `Total Distributed: ${stats.data.total_distributed || 'None'}`,
      `Last Check-in: ${stats.data.last_checkin_time 
        ? new Date(stats.data.last_checkin_time * 1000).toLocaleString() 
        : 'N/A'}`,
      `Card Count: ${stats.data.card_count}`
    ];

    this.nodeStatsBox.setContent(statsContent.join('\n'));
    this.screen.render();
  }

  async getNodeStats() {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/node/node_stats`, {
        params: { address: this.config.wallet_address },
        headers: {
          'Authorization': `Bearer ${this.config.bearer_token}`,
          'Accept': 'application/json, text/plain, */*'
        }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.log('Token expired. Attempting to refresh...');
        await this.verifyUser();
        return this.getNodeStats();
      }

      if (error.response) {
        this.log(`Node Stats Error Details:`);
        this.log(`Status: ${error.response.status}`);
        this.log(`Data: ${JSON.stringify(error.response.data)}`);
        this.log(`Headers: ${JSON.stringify(error.response.headers)}`);
      }
      
      this.log(`Failed to fetch node stats: ${error.message}`);
      throw error;
    }
  }

  async checkIn() {
    try {
      const checkInResponse = await axios.post(
        `${this.baseUrl}/v1/node/check_in`, 
        { address: this.config.wallet_address },
        {
          headers: {
            'Authorization': `Bearer ${this.config.bearer_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
          }
        }
      );

      this.log('Node check-in successful');
      return checkInResponse.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.log('Token expired. Attempting to refresh...');
        await this.verifyUser();
        return this.checkIn();
      }
      
      if (error.response) {
        this.log(`Check-in Error Details:`);
        this.log(`Status: ${error.response.status}`);
        this.log(`Data: ${JSON.stringify(error.response.data)}`);
        this.log(`Headers: ${JSON.stringify(error.response.headers)}`);
      }
      
      this.log(`Check-in error: ${error.message}`);
      throw error;
    }
  }

  async onboardNode() {
    try {
      const response = await axios.post(`${this.baseUrl}/v1/node/onboard`, 
        { address: this.config.wallet_address },
        {
          headers: {
            'Authorization': `Bearer ${this.config.bearer_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
          }
        }
      );

      this.log('Node onboarding successful');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.log('Token expired. Attempting to refresh...');
        await this.verifyUser();
        return this.onboardNode();
      }
      
      if (error.response) {
        this.log(`Onboarding Error Details:`);
        this.log(`Status: ${error.response.status}`);
        this.log(`Data: ${JSON.stringify(error.response.data)}`);
        this.log(`Headers: ${JSON.stringify(error.response.headers)}`);
      }
      
      this.log(`Onboarding error: ${error.message}`);
      throw error;
    }
  }

  startCountdown() {
    let remainingSeconds = 24 * 60 * 60; 
    
    const countdownInterval = setInterval(() => {
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      
      const countdownText = `Next Check-in: ${
        hours.toString().padStart(2, '0')
      }:${
        minutes.toString().padStart(2, '0')
      }:${
        seconds.toString().padStart(2, '0')
      }`;
      
      this.countdownBox.setContent(countdownText);
      this.screen.render();
      
      remainingSeconds--;
      
      if (remainingSeconds < 0) {
        clearInterval(countdownInterval);
        this.log('Time to check in!');
        this.performRoutineTasks();
      }
    }, 1000);

    const statsInterval = setInterval(async () => {
      try {
        const stats = await this.getNodeStats();
        this.updateNodeStats(stats);
      } catch (error) {
        this.log(`Stats update failed: ${error.message}`);
      }
    }, 60000);
  }

  async performRoutineTasks() {
    try {
      await this.onboardNode();
      
      await this.checkIn();
      
      const initialStats = await this.getNodeStats();
      this.updateNodeStats(initialStats);
      
      this.startCountdown();
    } catch (error) {
      this.log(`Routine tasks failed: ${error.message}`);
    }
  }

  async start() {
    this.log(`Starting Parasail Node Bot for Account ${this.index + 1}`);
    
    try {
      if (!this.config.bearer_token) {
        await this.verifyUser();
      }

      this.log(`Wallet Address: ${this.config.wallet_address}`);

      await this.onboardNode();
      await this.checkIn();
      
      const initialStats = await this.getNodeStats();
      this.updateNodeStats(initialStats);

      this.startCountdown();
    } catch (error) {
      this.log(`Initialization failed: ${error.message}`);
    }
  }
}

async function main() {
  // 加载多个账户的配置
  let accounts;
  try {
    const configPath = path.resolve('./config.json');
    const rawConfig = fs.readFileSync(configPath, 'utf8');
    accounts = JSON.parse(rawConfig).accounts; // 假设 config.json 中有一个 accounts 数组
  } catch (error) {
    console.error('Error loading accounts config:', error);
    process.exit(1);
  }

  if (!Array.isArray(accounts) || accounts.length === 0) {
    console.error('No accounts found in config.json');
    process.exit(1);
  }

  // 创建一个共享的 blessed 屏幕
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Multi-Account Parasail Bot'
  });

  // 记录账户数量，以便动态分配 UI 空间
  screen.accountsCount = accounts.length;

  // 为每个账户创建 ParasailNodeBot 实例
  const bots = accounts.map((account, index) => new ParasailNodeBot(account, index, screen));

  // 添加退出键
  screen.key(['q', 'C-c'], () => {
    return process.exit(0);
  });

  // 底部添加退出提示
  const quitBox = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: 'Press Q to Quit',
    style: {
      fg: 'white',
      bg: 'gray'
    }
  });

  // 并发启动所有账户
  await Promise.all(bots.map(bot => bot.start()));
}

main().catch(error => {
  console.error('Main error:', error);
  process.exit(1);
});
