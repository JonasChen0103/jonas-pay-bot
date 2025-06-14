require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const { initDatabase } = require('./database');
const { handleTextMessage } = require('./handlers/messageHandler');

// 建立 Express 應用程式
const app = express();

// 健康檢查端點
app.get('/', (req, res) => {
    res.json({
        status: 'Jonas Pay Bot is running!',
        timestamp: new Date().toISOString(),
        env_check: {
            has_channel_secret: !!process.env.CHANNEL_SECRET,
            has_access_token: !!process.env.CHANNEL_ACCESS_TOKEN
        }
    });
});

// LINE Bot 設定和客戶端 - 在需要時才建立
let client;
let config;

function initLineBot() {
    // 檢查環境變數
    if (!process.env.CHANNEL_ACCESS_TOKEN || !process.env.CHANNEL_SECRET) {
        console.error('❌ 環境變數檢查:');
        console.error('CHANNEL_ACCESS_TOKEN:', process.env.CHANNEL_ACCESS_TOKEN ? '已設定' : '未設定');
        console.error('CHANNEL_SECRET:', process.env.CHANNEL_SECRET ? '已設定' : '未設定');
        throw new Error('❌ 請設定 CHANNEL_ACCESS_TOKEN 和 CHANNEL_SECRET 環境變數');
    }

    config = {
        channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.CHANNEL_SECRET,
    };

    // 建立 LINE Bot 客戶端
    client = new line.Client(config);

    console.log('✅ LINE Bot 初始化完成');
    return { client, config };
}

// LINE Bot Webhook 端點
app.post('/webhook', (req, res) => {
    // 延遲初始化 LINE Bot（如果還沒初始化）
    if (!client) {
        try {
            const lineBot = initLineBot();
            client = lineBot.client;
            config = lineBot.config;
        } catch (error) {
            console.error('LINE Bot 初始化失敗:', error);
            return res.status(500).json({ error: 'LINE Bot configuration error' });
        }
    }

    // 使用 LINE middleware
    line.middleware(config)(req, res, async () => {
        try {
            // 處理所有接收到的事件
            const results = await Promise.all(req.body.events.map(handleEvent));

            // 記錄處理結果
            console.log('事件處理完成:', results);
            res.status(200).end();
        } catch (error) {
            console.error('Webhook 處理錯誤:', error);
            res.status(500).end();
        }
    });
});

// 處理 LINE 事件
async function handleEvent(event) {
    console.log('收到事件:', JSON.stringify(event, null, 2));

    try {
        switch (event.type) {
            case 'message':
                return await handleMessageEvent(event);

            case 'postback':
                return await handlePostbackEvent(event);

            case 'follow':
                return await handleFollowEvent(event);

            case 'unfollow':
                console.log('使用者取消追蹤:', event.source.userId);
                break;

            default:
                console.log('未處理的事件類型:', event.type);
                break;
        }
    } catch (error) {
        console.error('處理事件時發生錯誤:', error);

        // 如果有 replyToken，回傳錯誤訊息
        if (event.replyToken && event.replyToken !== '00000000000000000000000000000000') {
            return await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '抱歉，處理您的請求時發生錯誤。請稍後再試或聯絡管理員。'
            });
        }
    }
}

// 處理訊息事件
async function handleMessageEvent(event) {
    switch (event.message.type) {
        case 'text':
            return await handleTextMessage(event, client);

        case 'sticker':
            return await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '感謝您的貼圖！😊\n\n輸入「幫助」查看 Jonas Pay 的功能。'
            });

        default:
            return await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '抱歉，我目前只能處理文字訊息。\n\n輸入「幫助」查看可用功能。'
            });
    }
}

// 處理 Postback 事件 (按鈕點擊)
async function handlePostbackEvent(event) {
    const data = event.postback.data;
    console.log('收到 Postback:', data);

    try {
        // 解析 postback 資料
        const params = new URLSearchParams(data);
        const action = params.get('action');

        switch (action) {
            case 'send_reminder':
                const debtId = params.get('debt_id');
                return await handleSendReminder(event, debtId);

            case 'send_all_reminders':
                return await handleSendAllReminders(event);

            case 'mark_paid':
                const paidDebtId = params.get('debt_id');
                return await handleMarkAsPaid(event, paidDebtId);

            default:
                return await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '未知的操作。'
                });
        }
    } catch (error) {
        console.error('處理 Postback 時發生錯誤:', error);
        return await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '處理操作時發生錯誤。'
        });
    }
}

// 處理用戶追蹤事件
async function handleFollowEvent(event) {
    const userId = event.source.userId;

    try {
        // 取得用戶資料
        const profile = await client.getProfile(userId);

        const welcomeMessage = {
            type: 'flex',
            altText: '歡迎使用 Jonas Pay！',
            contents: {
                type: 'bubble',
                styles: {
                    body: {
                        backgroundColor: '#f8f9fa'
                    }
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: `歡迎 ${profile.displayName}！🎉`,
                            weight: 'bold',
                            color: '#2ecc71',
                            size: 'lg'
                        },
                        {
                            type: 'text',
                            text: '感謝您使用 Jonas Pay！',
                            margin: 'sm'
                        },
                        {
                            type: 'separator',
                            margin: 'md'
                        },
                        {
                            type: 'text',
                            text: '🔧 主要功能：',
                            weight: 'bold',
                            margin: 'md'
                        },
                        {
                            type: 'text',
                            text: '• 記錄朋友借款\n• 追蹤還款狀態\n• 自動發送提醒\n• 查看借貸歷史',
                            size: 'sm',
                            color: '#666666',
                            margin: 'sm'
                        },
                        {
                            type: 'text',
                            text: '輸入「幫助」查看詳細使用說明！',
                            color: '#3498db',
                            margin: 'md'
                        }
                    ]
                }
            }
        };

        return await client.replyMessage(event.replyToken, welcomeMessage);

    } catch (error) {
        console.error('處理追蹤事件時發生錯誤:', error);
        return await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '歡迎使用 Jonas Pay！輸入「幫助」查看功能說明。'
        });
    }
}

// 處理發送提醒
async function handleSendReminder(event, debtId) {
    // 這個功能需要實際的朋友 LINE ID，暫時顯示提示訊息
    return await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `🔔 提醒功能準備中...\n\n債務ID: ${debtId}\n\n實際部署時，這裡會自動發送提醒訊息給借款人。`
    });
}

// 處理發送所有提醒
async function handleSendAllReminders(event) {
    return await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '🔔 批量提醒功能準備中...\n\n實際部署時，這裡會自動發送提醒給所有未還款的朋友。'
    });
}

// 處理標記為已還款
async function handleMarkAsPaid(event, debtId) {
    const { markAsPaid, getDebtById, formatAmount } = require('./database');

    try {
        const debt = await getDebtById(debtId);

        if (!debt) {
            return await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '找不到該借款記錄。'
            });
        }

        const success = await markAsPaid(debtId);

        if (success) {
            return await client.replyMessage(event.replyToken, {
                type: 'flex',
                altText: '已標記為還款',
                contents: {
                    type: 'bubble',
                    styles: {
                        body: {
                            backgroundColor: '#f8f9fa'
                        }
                    },
                    body: {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'text',
                                text: '✅ 已標記為還款',
                                weight: 'bold',
                                color: '#2ecc71',
                                size: 'lg'
                            },
                            {
                                type: 'separator',
                                margin: 'md'
                            },
                            {
                                type: 'box',
                                layout: 'vertical',
                                margin: 'md',
                                contents: [
                                    {
                                        type: 'text',
                                        text: `${debt.borrower_name} 的借款`,
                                        weight: 'bold'
                                    },
                                    {
                                        type: 'text',
                                        text: `金額: ${formatAmount(debt.amount)}`,
                                        color: '#2ecc71'
                                    },
                                    {
                                        type: 'text',
                                        text: `項目: ${debt.description}`,
                                        size: 'sm',
                                        color: '#666666'
                                    }
                                ]
                            }
                        ]
                    }
                }
            });
        } else {
            return await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '標記還款失敗，請稍後再試。'
            });
        }

    } catch (error) {
        console.error('標記還款時發生錯誤:', error);
        return await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '處理還款標記時發生錯誤。'
        });
    }
}

// 錯誤處理中間件
app.use((error, req, res, next) => {
    console.error('Express 錯誤:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
    });
});

// 初始化應用程式
async function initApp() {
    try {
        // 初始化資料庫
        await initDatabase();
        console.log('✅ 資料庫初始化完成');

        // 嘗試初始化 LINE Bot（但不強制）
        try {
            initLineBot();
        } catch (error) {
            console.warn('⚠️ LINE Bot 初始化延遲:', error.message);
            console.log('💡 LINE Bot 將在第一次 webhook 呼叫時初始化');
        }

        // 啟動伺服器
        const port = process.env.PORT || 3000;
        app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Jonas Pay Bot 已啟動在 port ${port}`);
            console.log(`📡 Webhook URL: ${process.env.RAILWAY_STATIC_URL || 'http://localhost:' + port}/webhook`);
            console.log('💡 記得在 LINE Developers Console 設定 Webhook URL');
        });

    } catch (error) {
        console.error('❌ 應用程式啟動失敗:', error);
        console.error('錯誤詳情:', error.message);
        process.exit(1);
    }
}

// 優雅關閉處理
process.on('SIGINT', () => {
    console.log('\n👋 正在關閉 Jonas Pay Bot...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 正在關閉 Jonas Pay Bot...');
    process.exit(0);
});

// 啟動應用程式
initApp();