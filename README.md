# Jonas Pay 💰

> 智能借貸記錄 LINE BOT - 再也不怕朋友忘記還錢！  
> Smart debt tracking LINE BOT - Never worry about friends forgetting to pay you back!

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![LINE Bot SDK](https://img.shields.io/badge/LINE_Bot_SDK-8.0+-blue.svg)](https://developers.line.biz/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Language | 語言**: [English](#english) | [繁體中文](#繁體中文)

---

## 繁體中文

### 📖 關於 Jonas Pay

Jonas Pay 是一個專為朋友間借貸記錄設計的 LINE BOT。因為常常幫朋友墊錢，朋友們戲稱為「Jonas Pay」，所以開發了這個工具來追蹤誰還沒還錢！

#### ✨ 主要功能

- 📝 **借款記錄**：快速記錄朋友借款
- 📋 **債務清單**：一目了然查看所有未還款
- 🔔 **智能提醒**：自動發送還款提醒
- 📊 **統計分析**：借貸數據統計
- 💬 **互動介面**：美觀的卡片式介面
- 🔒 **安全可靠**：本地資料庫儲存

#### 🚀 快速開始

##### 前置需求

- Node.js 16.0 或以上版本
- LINE Developer 帳號
- Git

##### 安裝步驟

1. **複製專案**
```bash
git clone https://github.com/你的用戶名/jonas-pay-bot.git
cd jonas-pay-bot
```

2. **安裝依賴**
```bash
npm install
```

3. **設定環境變數**
```bash
# 複製 .env.example 為 .env
cp .env.example .env

# 編輯 .env 檔案，填入你的 LINE Bot 金鑰
CHANNEL_SECRET=你的Channel_Secret
CHANNEL_ACCESS_TOKEN=你的Channel_Access_Token
PORT=3000
```

4. **啟動應用程式**
```bash
npm start
```

5. **設定 Webhook**
- 使用 ngrok 或 LocalTunnel 建立外部連接
- 在 LINE Developers Console 設定 Webhook URL

#### 💬 使用說明

##### 基本指令

| 指令 | 功能 | 範例 |
|------|------|------|
| `記錄 @朋友 金額 說明` | 記錄新的借款 | `記錄 @小明 500 聚餐費用` |
| `清單` | 查看所有未還款記錄 | `清單` |
| `查詢 @朋友` | 查看特定朋友的借款 | `查詢 @小明` |
| `統計` | 查看借貸統計資料 | `統計` |
| `幫助` | 顯示使用說明 | `幫助` |

##### 互動功能

- 點擊債務清單中的按鈕發送提醒
- 使用卡片介面標記已還款
- 瀏覽借貸歷史記錄

#### 🛠️ 技術架構

##### 後端技術
- **Node.js** - 執行環境
- **Express.js** - Web 框架
- **SQLite** - 輕量級資料庫
- **LINE Bot SDK** - LINE 機器人開發套件

##### 資料庫設計
```sql
-- 債務記錄表
debts (
  id, lender_id, borrower_id, borrower_name,
  amount, description, created_at, is_paid, paid_at
)

-- 提醒記錄表
reminders (
  id, debt_id, sent_at
)

-- 使用者設定表
user_settings (
  user_id, display_name, remind_days, auto_remind
)
```

#### 🚀 部署

##### Railway (推薦)
1. 推送程式碼到 GitHub
2. 連接 Railway 到你的 repository
3. 設定環境變數
4. 自動部署完成

##### 其他平台
- Render
- Heroku
- 自架伺服器

#### 📊 專案狀態

- [x] 基礎 LINE Bot 功能
- [x] 借款記錄系統
- [x] 債務清單查看
- [x] 互動式介面
- [x] 本地資料庫
- [ ] 自動提醒系統
- [ ] 統計功能
- [ ] 轉帳整合
- [ ] 群組功能

---

## English

### 📖 About Jonas Pay

Jonas Pay is a LINE BOT designed for tracking debts between friends. Named after the developer who often pays for friends and gets jokingly called "Jonas Pay", this tool helps track who hasn't paid you back yet!

#### ✨ Key Features

- 📝 **Debt Recording**: Quickly record friend's debts
- 📋 **Debt List**: View all unpaid debts at a glance
- 🔔 **Smart Reminders**: Automatically send payment reminders
- 📊 **Statistics**: Analyze lending data
- 💬 **Interactive Interface**: Beautiful card-style interface
- 🔒 **Secure & Reliable**: Local database storage

#### 🚀 Quick Start

##### Prerequisites

- Node.js 16.0 or higher
- LINE Developer account
- Git

##### Installation

1. **Clone the project**
```bash
git clone https://github.com/your-username/jonas-pay-bot.git
cd jonas-pay-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env file with your LINE Bot credentials
CHANNEL_SECRET=your_channel_secret
CHANNEL_ACCESS_TOKEN=your_channel_access_token
PORT=3000
```

4. **Start the application**
```bash
npm start
```

5. **Set up Webhook**
- Use ngrok or LocalTunnel to create external connection
- Configure Webhook URL in LINE Developers Console

#### 💬 Usage

##### Basic Commands

| Command | Function | Example |
|---------|----------|---------|
| `記錄 @friend amount description` | Record new debt | `記錄 @John 500 dinner cost` |
| `清單` | View all unpaid debts | `清單` |
| `查詢 @friend` | View specific friend's debts | `查詢 @John` |
| `統計` | View lending statistics | `統計` |
| `幫助` | Show help message | `幫助` |

##### Interactive Features

- Click buttons in debt list to send reminders
- Use card interface to mark debts as paid
- Browse lending history

#### 🛠️ Technical Architecture

##### Backend Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Lightweight database
- **LINE Bot SDK** - LINE Bot development kit

##### Database Schema
```sql
-- Debt records table
debts (
  id, lender_id, borrower_id, borrower_name,
  amount, description, created_at, is_paid, paid_at
)

-- Reminder records table
reminders (
  id, debt_id, sent_at
)

-- User settings table
user_settings (
  user_id, display_name, remind_days, auto_remind
)
```

#### 🚀 Deployment

##### Railway (Recommended)
1. Push code to GitHub
2. Connect Railway to your repository
3. Configure environment variables
4. Automatic deployment

##### Other Platforms
- Render
- Heroku
- Self-hosted server

#### 📊 Project Status

- [x] Basic LINE Bot functionality
- [x] Debt recording system
- [x] Debt list viewing
- [x] Interactive interface
- [x] Local database
- [ ] Automatic reminder system
- [ ] Statistics feature
- [ ] Payment integration
- [ ] Group functionality

---

## 🤝 Contributing | 貢獻

歡迎提交 Issue 和 Pull Request！  
Welcome to submit Issues and Pull Requests!

1. Fork the project | Fork 專案
2. Create feature branch | 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. Commit changes | 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch | 推送到分支 (`git push origin feature/AmazingFeature`)
5. Open Pull Request | 開啟 Pull Request

## 📝 License | 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案  
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 👨‍💻 Author | 作者

**Jonas** - [GitHub](https://github.com/你的用戶名)

## 🙏 Acknowledgments | 致謝

- LINE Developers 提供優秀的 Bot SDK | LINE Developers for excellent Bot SDK
- 所有測試使用者的寶貴建議 | All beta testers for valuable feedback
- 開源社群的貢獻 | Open source community contributions

---

⭐ 如果這個專案對你有幫助，請給個星星！| If this project helps you, please give it a star!

💡 有任何問題或建議，歡迎開 Issue 討論！| Feel free to open an Issue for questions or suggestions!