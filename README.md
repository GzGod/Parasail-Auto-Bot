# Parasail Node Bot

## Description
Parasail Node Bot is an automated tool for managing and interacting with Parasail network nodes. It provides a terminal-based UI for monitoring node stats, performing check-ins, and automating node-related tasks.

## Features
- Automatic user verification with Ethereum wallet
- Node onboarding
- Regular check-ins
- Real-time node statistics tracking
- Terminal-based dashboard with logging and stats display
- Automatic token refresh mechanism

## Prerequisites
- Node.js (v14 or higher)
- An Ethereum wallet with private key
- Internet connection

## Installation

1. Clone the repository:
```bash
git clone https://github.com/airdropinsiders/Parasail-Auto-Bot.git
cd Parasail-Auto-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `config.json` file in the project root with the following structure:
```json
{
  "privateKey": "YOUR_ETHEREUM_PRIVATE_KEY"
}
```

⚠️ **IMPORTANT**: Never commit your `config.json` to version control. Add it to `.gitignore`.

## Usage

```bash
npm start
```

## Dependencies
- blessed: Terminal UI library
- blessed-contrib: Advanced terminal dashboards
- axios: HTTP client
- ethers: Ethereum wallet and signing library

## Configuration
- `privateKey`: Your Ethereum wallet's private key
- `bearer_token`: Automatically populated after verification
- `wallet_address`: Automatically populated after verification

## Controls
- Press `Q` or `Ctrl+C` to quit the application

## Security Notes
- Keep your private key confidential
- Use a dedicated wallet for this bot
- Verify the source and safety of the bot before use

## Disclaimer
This bot is provided as-is. Use at your own risk. Always review the code and understand its functionality before running.

## License
MIT License

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.