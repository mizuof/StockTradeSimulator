// 全局变量
let balance = 500000.00;
let selectedStock = null;
let selectedQty = 0;
let holdings = {};
let tradeType = null;
let isDarkMode = false;

// 成就系统
let achievements = JSON.parse(localStorage.getItem('achievements')) || {
    '交易员生涯,开启！': { target: 500000, current: 0, completed: false },
    '首笔交易': { target: 1, current: 0, completed: false },
    '顶级交易员': { target: 1000000, current: 0, completed: false },
    '财富初现': { target: 2000000, current: 0, completed: false },
    '投资高手': { target: 5000000, current: 0, completed: false },
    '千万富翁': { target: 10000000, current: 0, completed: false },
    '股票大亨': { target: 20000000, current: 0, completed: false },
    '股神': { target: 50000000, current: 0, completed: false },
    '市场,由我掌握！': { target: 200000000, current: 0, completed: false },
    '游戏通关！': { target: 9, current: 0, completed: false }
};

// 股票数据
const stocks = Array.from({ length: 22 }, (_, i) => {
    const basePrice = (Math.random() * 100 + 51).toFixed(2);
    return {
        id: i + 1,
        name: ['大葱之家', '有家企业', '吖里西西', '腾达游戏', '奶奶不泡茶', '智慧汽车', '智慧购物', '平安保险', '智慧农业', '北方科技', '长安科技', '有益集团',
              '北斗地图', '富特科技', '生益电子', '顺丰速运', '星扒克', '一茗奶茶', '幸运咖啡', '蜜雪城堡', '明牌珠宝', '神州信息'][i],
        price: parseFloat(basePrice),
        change: 0,
        history: Array.from({ length: 20 }, () => parseFloat(basePrice) * (0.95 + Math.random() * 0.1))
    };
});

// 计算持仓价值
function calculateHoldingsValue() {
    let total = 0;
    for (const [stockId, holding] of Object.entries(holdings)) {
        const stock = stocks.find(s => s.id === parseInt(stockId));
        if (stock) {
            total += stock.price * holding.qty;
        }
    }
    return total;
}

// 初始化函数
$(document).ready(function() {
    try {
        // 加载保存的数据
        loadData();
    } catch (error) {
        console.error('加载本地存储数据时出错:', error);
        balance = 500000.00;
        holdings = {};
        achievements = {
            '交易员生涯,开启！': { target: 500000, current: 0, completed: false },
            '首笔交易': { target: 1, current: 0, completed: false },
            '顶级交易员': { target: 1000000, current: 0, completed: false },
            '财富初现': { target: 2000000, current: 0, completed: false },
            '投资高手': { target: 5000000, current: 0, completed: false },
            '千万富翁': { target: 10000000, current: 0, completed: false },
            '股票大亨': { target: 20000000, current: 0, completed: false },
            '股神': { target: 50000000, current: 0, completed: false },
            '市场,由我掌握！': { target: 200000000, current: 0, completed: false },
            '游戏通关！': { target: 9, current: 0, completed: false }
        };
    }
    
    // 渲染初始界面
    renderStocks();
    updateUI();
    
    // 设置定时器
    setInterval(updateStocks, 10000); 
    setInterval(checkAchievements, 60000); 
    
    // 事件监听器
    $('#close-modal, #close-modal-btn').click(function() {
        $('#disclaimer-modal').removeClass('active');
    });
    
    $('#achievement-btn').click(function() {
        renderAchievements();
        $('#achievements-modal').addClass('active');
    });
    
    $('#close-achievements, #achievements-modal .modal-close').click(function() { // 确保成就模态框可关闭
        $('#achievements-modal').removeClass('active');
    });
    
    $('#reset-btn').click(function() {
        if(confirm('确定要重置所有数据吗？这将无法恢复！')) {
            resetData();
        }
    });
    
    $('#theme-toggle').click(function() {
        toggleTheme();
    });
    
    // 恢复确认交易相关事件
    $('#confirm-trade').click(function() {
        confirmTrade(tradeType);
        $('#confirmation-modal').removeClass('active');
    });
    
    $('#cancel-trade').click(function() {
        $('#confirmation-modal').removeClass('active');
    });
    
    // 显示免责声明
    setTimeout(function() {
        $('#disclaimer-modal').addClass('active');
    }, 500);

    // 为成就模态框的主体添加滚动条样式
    $('#achievements-modal .modal-body').css({
        'overflow-y': 'auto',
        'max-height': '500px',
        'padding-right': '1rem'
    });

    // 修复部分窗口打开后流畅动画效果没有应用的错误
    $('.modal-overlay').on('show', function () {
        $(this).find('.modal').css('transform', 'translateY(20px)');
        $(this).find('.modal').addClass('fadeIn');
    });

    $('.modal-overlay').on('hidden', function () {
        $(this).find('.modal').removeClass('fadeIn');
    });

    initMobileStockSelector();

    $(window).on('resize', function() {
        if ($(window).width() <= 768) {
            $('#stocks-list').hide();
            $('#mobile-stock-selector').show();
        } else {
            $('#stocks-list').show();
            $('#mobile-stock-selector').hide();
        }
    }).trigger('resize');
});

// 选择股票
function selectStock(id) {
    selectedStock = id;
    const stock = stocks.find(s => s.id === id);
    
    // 更新选中状态
    $('.stock-card').removeClass('active');
    $(`.stock-card[data-id="${id}"]`).addClass('active');
    
    $('#selected-stock').text(stock.name);
    $('#stock-price').text(`¥${stock.price.toFixed(2)}`);
    $('#stock-change').html(`${stock.change >= 0 ? '+' : ''}${Number(stock.change).toFixed(2)}%`)
                     .removeClass('up down')
                     .addClass(stock.change >= 0 ? 'up' : 'down');
    
    // 更新图表
    updateStockChart(stock);
    
    // 如果有活跃的数量按钮，重新选择数量
    const activeBtn = $('.qty-btn.active');
    if(activeBtn.length) {
        if(activeBtn.text().includes('全部')) {
            selectQty('all', tradeType);
        } else if(activeBtn.text().includes('一半')) {
            selectQty('half', tradeType);
        } else {
            selectQty(parseInt(activeBtn.text()), tradeType);
        }
    }
}

// 更新股票图表
function updateStockChart(stock) {
    const svg = document.getElementById('chart-path');
    const data = stock.history;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    let pathData = '';
    
    for(let i = 0; i < data.length; i++) {
        const x = i * 100 / (data.length - 1);
        const y = 20 - ((data[i] - min) / range * 20);
        
        if(i === 0) {
            pathData += `M ${x} ${y}`;
        } else {
            pathData += ` L ${x} ${y}`;
        }
    }
    
    svg.setAttribute('d', pathData);
    svg.setAttribute('stroke', stock.change >= 0 ? 'var(--success)' : 'var(--danger)');
}

// 选择数量函数，直接执行交易
function executeTrade(tradeTypeParam, type) {
    if(!selectedStock) {
        showNotification('请先选择股票！', 'danger');
        return;
    }
    tradeType = tradeTypeParam;
    const stock = stocks.find(s => s.id === selectedStock);
    
    switch(type) {
        case 'all':
            if(tradeType === 'buy') {
                selectedQty = Math.floor(balance / stock.price / 100) * 100;
            } else if(tradeType === 'sell') {
                selectedQty = holdings[selectedStock] ? holdings[selectedStock].qty : 0;
            }
            break;
        case 'half':
            if(tradeType === 'sell' && holdings[selectedStock]) {
                selectedQty = Math.floor(holdings[selectedStock].qty / 2 / 100) * 100;
            } else if(tradeType === 'buy') {
                selectedQty = Math.floor((balance / stock.price) / 2 / 100) * 100;
            }
            break;
        case 'quarter':
            if(tradeType === 'sell' && holdings[selectedStock]) {
                selectedQty = Math.floor(holdings[selectedStock].qty / 4 / 100) * 100;
            } else if(tradeType === 'buy') {
                selectedQty = Math.floor((balance / stock.price) / 4 / 100) * 100;
            }
            break;
    }
    
    if (selectedQty <= 0) {
        showNotification(tradeType === 'buy' ? '余额不足，无法买入！' : '没有可卖出的股票！', 'danger');
        return;
    }
    
    // 显示确认交易模态框
    const totalPrice = (selectedQty * stock.price).toFixed(2);
    const remainingBalance = (tradeType === 'buy' ? balance - totalPrice : parseFloat(balance) + parseFloat(totalPrice)).toFixed(2);
    $('#confirmation-title').html(`<i class="fas fa-check-circle"></i><span>确认${tradeType === 'buy' ? '买入' : '卖出'}</span>`);
    $('#confirmation-message').html(`你确定以¥${stock.price.toFixed(2)}/每股 ${tradeType === 'buy' ? '购入' : '卖出'}${selectedQty}股的 ${stock.name} 吗？`);
    $('#current-balance').text(balance.toFixed(2));
    $('#remaining-balance').text(remainingBalance);
    $('#confirmation-modal').addClass('active');
}

// 确认交易函数，修正持仓计算逻辑
function confirmTrade(type) {
    if (!selectedStock) {
        showNotification('请先选择股票！', 'danger');
        return;
    }

    const stock = stocks.find(s => s.id === selectedStock);
    if (type === 'buy') {
        if (selectedQty <= 0) {
            showNotification('请选择购买数量！', 'danger');
            return;
        }
        const amount = stock.price * selectedQty;
        if (amount > balance) {
            showNotification('资金不足！', 'danger');
            return;
        }
        balance -= amount;
        if (holdings[stock.id]) {
            const totalQty = holdings[stock.id].qty + selectedQty;
            const totalCost = holdings[stock.id].purchasePrice * holdings[stock.id].qty + amount;
            holdings[stock.id].qty = totalQty;
            holdings[stock.id].purchasePrice = totalCost / totalQty;
        } else {
            holdings[stock.id] = {
                qty: selectedQty,
                purchasePrice: stock.price
            };
        }
        // 更新成就
        if (!achievements['首笔交易'].completed) {
            achievements['首笔交易'].current = 1;
            achievements['首笔交易'].completed = true;
            checkAchievements();
        }
    } else if (type === 'sell') {
        if (selectedQty <= 0) {
            showNotification('请选择卖出数量！', 'danger');
            return;
        }
        if (!holdings[selectedStock] || holdings[selectedStock].qty < selectedQty) {
            showNotification('持仓不足！', 'danger');
            return;
        }
        const amount = stock.price * selectedQty;
        balance += amount;
        holdings[selectedStock].qty -= selectedQty;
        if (holdings[selectedStock].qty === 0) {
            delete holdings[selectedStock];
        }
    }

    // 更新 UI
    updateUI();
    try {
        // 保存数据
        saveData();
    } catch (error) {
        console.error('保存本地存储数据时出错:', error);
    }
    // 新增：资金变化后检查成就
    checkAchievements();
    // 显示通知
    showNotification(`成功${type === 'buy' ? '买入' : '卖出'} ${selectedQty} 股 ${stock.name}`, 'success');
}

// 显示通知
function showNotification(message, type) {
    const notification = $('#notification');
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    notification.find('i').removeClass().addClass(`fas ${icon}`);
    notification.find('#notification-text').text(message);
    notification.addClass('show');
    setTimeout(() => {
        notification.removeClass('show');
    }, 3000);
}

// 渲染股票列表
function renderStocks() {
    const stockList = $('#stocks-list');
    stockList.empty();
    stocks.forEach(stock => {
        const stockCard = `
            <div class="stock-card" data-id="${stock.id}" onclick="selectStock(${stock.id})">
                <div class="stock-name">${stock.name}</div>
                <div class="stock-price">¥${stock.price.toFixed(2)}</div>
                <div class="stock-change ${stock.change >= 0 ? 'up' : 'down'}">
                    <i class="${stock.change >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'}"></i>
                    ${stock.change >= 0 ? '+' : ''}${Number(stock.change).toFixed(2)}%
                </div>
                <div class="stock-chart">
                    <div class="chart-line"></div>
                    <svg viewBox="0 0 100 20" preserveAspectRatio="none" class="chart-path">
                        <path d="" stroke="${stock.change >= 0 ? 'var(--success)' : 'var(--danger)'}"></path>
                    </svg>
                </div>
            </div>
        `;
        stockList.append(stockCard);
    });
}

// 更新 UI
function updateUI() {
    $('#balance').text(balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    let holdingsBalance = 0;
    Object.entries(holdings).forEach(([id, holding]) => {
        const stock = stocks.find(s => s.id === parseInt(id)); 
        if (stock) {
            holdingsBalance += holding.qty * stock.price;
        }
    });
    $('#holdings-balance').text(holdingsBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    const totalBalance = balance + holdingsBalance;
    const change = ((totalBalance - 500000) / 500000 * 100).toFixed(2);
    $('#holdings-change').text(`${change >= 0 ? '+' : ''}${change}%`).removeClass('up down').addClass(change >= 0 ? 'up' : 'down');

    // 渲染持仓列表
    const holdingsList = $('#holdings');
    holdingsList.empty();
    Object.entries(holdings).forEach(([id, holding]) => {
        const stock = stocks.find(s => s.id === parseInt(id));
        if (stock) {
            const holdingItem = `
                <div class="holding-item">
                    <div class="holding-name">${stock.name}</div>
                    <div class="holding-qty">${holding.qty} 股</div>
                    <div class="holding-value">¥${(holding.qty * stock.price).toFixed(2)}</div>
                </div>
            `;
            holdingsList.append(holdingItem);
        }
    });
}

// 更新股票数据
function updateStocks() {
    stocks.forEach(stock => {
        const oldPrice = stock.price;
        stock.price = parseFloat((oldPrice * (0.99 + Math.random() * 0.02)).toFixed(2));
        stock.change = ((stock.price - oldPrice) / oldPrice * 100);
        stock.history.shift();
        stock.history.push(stock.price);
    });
    renderStocks();
    if (selectedStock) {
        selectStock(selectedStock);
    }
    updateUI();
}

// 保存数据
function saveData() {
    try {
        localStorage.setItem('balance', balance);
        localStorage.setItem('holdings', JSON.stringify(holdings));
        localStorage.setItem('achievements', JSON.stringify(achievements));
    } catch (error) {
        console.error('保存数据到本地存储时出错:', error);
    }
}

// 加载数据
function loadData() {
    try {
        balance = parseFloat(localStorage.getItem('balance')) || 500000.00;
        holdings = JSON.parse(localStorage.getItem('holdings')) || {};
        achievements = JSON.parse(localStorage.getItem('achievements')) || achievements;
    } catch (error) {
        console.error('从本地存储加载数据时出错:', error);
    }
}

// 重置数据
function resetData() {
    balance = 500000.00;
    holdings = {};
    achievements = {
        '交易员生涯,开启！': { target: 500000, current: 0, completed: false },
        '首笔交易': { target: 1, current: 0, completed: false },
        '顶级交易员': { target: 1000000, current: 0, completed: false },
        '财富初现': { target: 2000000, current: 0, completed: false },
        '投资高手': { target: 5000000, current: 0, completed: false },
        '千万富翁': { target: 10000000, current: 0, completed: false },
        '股票大亨': { target: 20000000, current: 0, completed: false },
        '股神': { target: 50000000, current: 0, completed: false },
        '市场,由我掌握！': { target: 200000000, current: 0, completed: false },
        '游戏通关！': { target: 9, current: 0, completed: false }
    };
    try {
        localStorage.clear();
    } catch (error) {
        console.error('清除本地存储数据时出错:', error);
    }
    updateUI();
    renderStocks();
}

// 检查成就
function checkAchievements() {
    const totalWealth = balance + calculateHoldingsValue();
    
    for (const [name, achievement] of Object.entries(achievements)) {
        if (name === '首笔交易') {
            continue;
        } else if (name === '游戏通关！') {
            const otherCompleted = Object.values(achievements).filter(a => a.completed && a !== achievements['游戏通关！']).length;
            achievement.current = otherCompleted;
        } else {
            achievement.current = totalWealth;
        }

        if (achievement.current >= achievement.target && !achievement.completed) {
            achievement.completed = true;
            showNotification(`恭喜解锁成就：${name}`, 'success');
            saveData();
        }
    }
    $('#achievements-progress').text(Object.values(achievements).filter(a => a.completed).length);
}

// 渲染成就列表
function renderAchievements() {
    const achievementsList = $('#achievements-list');
    achievementsList.empty();
    let completedCount = 0;

    for (const [name, achievement] of Object.entries(achievements)) {
        const item = $('<div>').addClass('holding-item');
        if (achievement.completed) {
            item.addClass('completed');
            completedCount++;
        }

        const nameElement = $('<div>').addClass('holding-name').html(`${achievement.completed ? '<i class="fas fa-check"></i>' : ''} ${name}`);
        const progressText = achievement.completed ? '已完成' : `${achievement.current}/${achievement.target}`;
        const progressElement = $('<div>').addClass('holding-qty').text(progressText);

        item.append(nameElement, progressElement);
        achievementsList.append(item);
    }

    $('#achievements-progress').text(completedCount);
}

// 切换主题
function toggleTheme() {
    isDarkMode = !isDarkMode;
    $('body').attr('data-theme', isDarkMode ? 'dark' : '');
    $('#theme-toggle i').toggleClass('fa-moon fa-sun');
}

// 初始化移动端股票选择器
function initMobileStockSelector() {
    const stockNames = stocks.map(stock => stock.name);
    $("#stock-slider").ionRangeSlider({
        type: "single",
        grid: true,
        min: 0,
        max: stocks.length - 1,
        from: 0,
        values: stockNames,
        onFinish: function (data) {
            selectStock(stocks[data.from].id);
        },
        // 添加动画配置
        prettify_enabled: true,
        prettify_separator: ',',
        hide_min_max: true,
        hide_from_to: false,
        skin: "round"
    });
}

// 关闭确认交易模态框函数
function closeConfirmationModal() {
    $('#confirmation-modal').removeClass('active');
}

// 取消交易函数
function cancelTrade() {
    $('#confirmation-modal').removeClass('active');
}
