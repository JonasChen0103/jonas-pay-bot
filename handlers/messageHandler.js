const {
    addDebt,
    getUnpaidDebts,
    getBorrowerDebts,
    markAsPaid,
    getDebtById,
    formatAmount,
    parseAmount
} = require('../database');

// 狀態管理 - 記錄使用者當前的操作狀態
const userStates = new Map();

// 處理文字訊息
async function handleTextMessage(event, client) {
    const userId = event.source.userId;
    const text = event.message.text.trim();

    try {
        // 取得使用者資料
        const profile = await client.getProfile(userId);
        const userName = profile.displayName;

        // 檢查使用者是否在特定操作狀態中
        const userState = userStates.get(userId);

        if (userState) {
            return await handleUserState(event, client, userState, text);
        }

        // 處理一般指令
        if (text.toLowerCase().startsWith('記錄') || text.toLowerCase().startsWith('借')) {
            return await startRecordDebt(event, client, text);
        }

        if (text.toLowerCase().includes('清單') || text.toLowerCase().includes('查看')) {
            return await showDebtList(event, client, userId);
        }

        if (text.toLowerCase().includes('提醒')) {
            return await sendReminders(event, client, userId);
        }

        if (text.toLowerCase().includes('幫助') || text.toLowerCase().includes('help')) {
            return await showHelp(event, client);
        }

        // 預設回應
        return await client.replyMessage(event.replyToken, {
            type: 'text',
            text: `哈囉 ${userName}！👋\n\n歡迎使用 Jonas Pay！\n\n📝 輸入「記錄 @朋友 金額 說明」來記錄借款\n📋 輸入「清單」查看所有未還款記錄\n🔔 輸入「提醒」發送還款提醒\n❓ 輸入「幫助」查看更多功能`
        });

    } catch (error) {
        console.error('處理訊息時發生錯誤:', error);
        return await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '抱歉，處理您的請求時發生錯誤，請稍後再試。'
        });
    }
}

// 開始記錄借款流程
async function startRecordDebt(event, client, text) {
    const userId = event.source.userId;

    // 解析指令格式: 記錄 @朋友 金額 說明
    const matches = text.match(/(?:記錄|借)\s+(.+)/i);

    if (matches && matches[1]) {
        const params = matches[1].trim().split(/\s+/);

        if (params.length >= 2) {
            const borrowerName = params[0].replace('@', '');
            const amountStr = params[1];
            const description = params.slice(2).join(' ') || '未指定項目';

            try {
                const amount = parseAmount(amountStr);

                if (amount <= 0) {
                    return await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '請輸入有效的金額！'
                    });
                }

                // 儲存借款記錄 (這裡先用借款人姓名作為ID，實際使用時會需要更複雜的用戶匹配)
                const debtId = await addDebt(userId, `user_${borrowerName}`, borrowerName, amount, description);

                const replyMessage = {
                    type: 'flex',
                    altText: '借款記錄已建立',
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
                                    text: '✅ 借款記錄已建立',
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
                                            type: 'box',
                                            layout: 'baseline',
                                            contents: [
                                                {
                                                    type: 'text',
                                                    text: '借款人:',
                                                    color: '#666666',
                                                    size: 'sm',
                                                    flex: 2
                                                },
                                                {
                                                    type: 'text',
                                                    text: borrowerName,
                                                    weight: 'bold',
                                                    flex: 3
                                                }
                                            ]
                                        },
                                        {
                                            type: 'box',
                                            layout: 'baseline',
                                            contents: [
                                                {
                                                    type: 'text',
                                                    text: '金額:',
                                                    color: '#666666',
                                                    size: 'sm',
                                                    flex: 2
                                                },
                                                {
                                                    type: 'text',
                                                    text: formatAmount(amount),
                                                    weight: 'bold',
                                                    color: '#e74c3c',
                                                    flex: 3
                                                }
                                            ]
                                        },
                                        {
                                            type: 'box',
                                            layout: 'baseline',
                                            contents: [
                                                {
                                                    type: 'text',
                                                    text: '項目:',
                                                    color: '#666666',
                                                    size: 'sm',
                                                    flex: 2
                                                },
                                                {
                                                    type: 'text',
                                                    text: description,
                                                    flex: 3,
                                                    wrap: true
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        footer: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'button',
                                    action: {
                                        type: 'postback',
                                        label: '發送提醒給朋友',
                                        data: `action=send_reminder&debt_id=${debtId}`
                                    },
                                    style: 'primary'
                                }
                            ]
                        }
                    }
                };

                return await client.replyMessage(event.replyToken, replyMessage);

            } catch (error) {
                return await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '金額格式錯誤，請輸入有效的數字。'
                });
            }
        }
    }

    // 如果格式不正確，顯示使用說明
    return await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '請使用正確格式：\n\n📝 記錄 @朋友姓名 金額 說明\n\n例如：記錄 @小明 500 聚餐費用'
    });
}

// 顯示債務清單
async function showDebtList(event, client, userId) {
    try {
        const debts = await getUnpaidDebts(userId);

        if (debts.length === 0) {
            return await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '🎉 太棒了！目前沒有未還款的記錄。'
            });
        }

        // 計算總金額
        const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);

        // 建立債務清單的 Flex Message
        const bubbleContents = debts.slice(0, 10).map(debt => {
            const date = new Date(debt.created_at).toLocaleDateString('zh-TW');
            return {
                type: 'box',
                layout: 'vertical',
                margin: 'sm',
                contents: [
                    {
                        type: 'box',
                        layout: 'baseline',
                        contents: [
                            {
                                type: 'text',
                                text: debt.borrower_name,
                                weight: 'bold',
                                flex: 2
                            },
                            {
                                type: 'text',
                                text: formatAmount(debt.amount),
                                weight: 'bold',
                                color: '#e74c3c',
                                align: 'end',
                                flex: 1
                            }
                        ]
                    },
                    {
                        type: 'text',
                        text: debt.description,
                        size: 'sm',
                        color: '#666666',
                        wrap: true
                    },
                    {
                        type: 'text',
                        text: date,
                        size: 'xs',
                        color: '#999999'
                    },
                    {
                        type: 'separator',
                        margin: 'sm'
                    }
                ]
            };
        });

        const flexMessage = {
            type: 'flex',
            altText: '未還款清單',
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
                            text: '💰 未還款清單',
                            weight: 'bold',
                            color: '#2c3e50',
                            size: 'lg'
                        },
                        {
                            type: 'text',
                            text: `總計: ${formatAmount(totalAmount)}`,
                            weight: 'bold',
                            color: '#e74c3c',
                            size: 'md',
                            margin: 'sm'
                        },
                        {
                            type: 'separator',
                            margin: 'md'
                        },
                        ...bubbleContents
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'button',
                            action: {
                                type: 'postback',
                                label: '發送提醒給所有人',
                                data: 'action=send_all_reminders'
                            },
                            style: 'primary'
                        }
                    ]
                }
            }
        };

        return await client.replyMessage(event.replyToken, flexMessage);

    } catch (error) {
        console.error('取得債務清單時發生錯誤:', error);
        return await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '取得清單時發生錯誤，請稍後再試。'
        });
    }
}

// 顯示幫助訊息
async function showHelp(event, client) {
    const helpMessage = {
        type: 'flex',
        altText: 'Jonas Pay 使用說明',
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
                        text: '📖 Jonas Pay 使用說明',
                        weight: 'bold',
                        color: '#2c3e50',
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
                                text: '📝 記錄借款',
                                weight: 'bold',
                                color: '#3498db',
                                margin: 'sm'
                            },
                            {
                                type: 'text',
                                text: '記錄 @朋友 金額 說明',
                                size: 'sm',
                                color: '#666666'
                            },
                            {
                                type: 'text',
                                text: '例：記錄 @小明 500 聚餐',
                                size: 'xs',
                                color: '#999999'
                            },
                            {
                                type: 'text',
                                text: '📋 查看清單',
                                weight: 'bold',
                                color: '#3498db',
                                margin: 'md'
                            },
                            {
                                type: 'text',
                                text: '輸入「清單」或「查看」',
                                size: 'sm',
                                color: '#666666'
                            },
                            {
                                type: 'text',
                                text: '🔔 發送提醒',
                                weight: 'bold',
                                color: '#3498db',
                                margin: 'md'
                            },
                            {
                                type: 'text',
                                text: '輸入「提醒」',
                                size: 'sm',
                                color: '#666666'
                            }
                        ]
                    }
                ]
            }
        }
    };

    return await client.replyMessage(event.replyToken, helpMessage);
}

// 處理使用者狀態
async function handleUserState(event, client, userState, text) {
    // 這裡可以處理需要多步驟操作的功能
    // 暫時清除狀態
    userStates.delete(event.source.userId);

    return await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '操作已取消。'
    });
}

// 發送提醒
async function sendReminders(event, client, userId) {
    // 這個功能稍後實作，因為需要實際的朋友 LINE ID
    return await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '🔔 提醒功能開發中...\n\n目前可以透過債務清單的按鈕來發送個別提醒。'
    });
}

module.exports = {
    handleTextMessage
};