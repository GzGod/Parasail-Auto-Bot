# Parasail Node 机器人

## 描述
Parasail Node 机器人是一个用于管理和与 Parasail 网络节点交互的自动化工具。它提供了一个基于终端的用户界面，用于监控节点统计信息、执行签到以及自动化节点相关任务。

## 功能
- 使用以太坊钱包自动验证用户
- 节点上线
- 定期签到
- 实时节点统计跟踪
- 基于终端的仪表板，带有日志和统计显示
- 自动令牌刷新机制

## 前提条件
- Node.js (v14 或更高版本)
- 一个带有私钥的以太坊钱包
- 互联网连接

## 安装

1. 克隆仓库：
```bash
git clone https://github.com/Gzgod/Parasail-Auto-Bot.git
cd Parasail-Auto-Bot
```

2. 安装依赖：
```bash
npm install
```

3. 在项目根目录创建一个 `config.json` 文件，结构如下：
```json
{
  "privateKey": "YOUR_ETHEREUM_PRIVATE_KEY"
}
```

⚠️ **重要**：切勿将您的 `config.json` 提交到版本控制中。请将其添加到 `.gitignore`。

## 使用

```bash
npm start
```

## 依赖
- blessed: 终端 UI 库
- blessed-contrib: 高级终端仪表板
- axios: HTTP 客户端
- ethers: 以太坊钱包和签名库

## 配置
- `privateKey`: 您的以太坊钱包私钥
- `bearer_token`: 验证后自动填充
- `wallet_address`: 验证后自动填充

## 控制
- 按 `Q` 或 `Ctrl+C` 退出应用程序

## 安全注意事项
- 保持您的私钥机密
- 为此机器人使用专用钱包
- 在使用前验证机器人的来源和安全性

## 免责声明
此机器人按原样提供。使用风险自负。在运行之前，请务必审查代码并了解其功能。

## 贡献
欢迎贡献！请打开一个 issue 或提交一个 pull request。
