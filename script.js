let balance = 500000.00;
        let selectedStock = null;
        let selectedQty = 0;
        let holdings = {};
        const confirmationDialog = document.getElementById('confirmation');
        const confirmationMessage = document.getElementById('confirmation-message');
        const overlay = document.getElementById('overlay');
        let tradeType = null;
        let sortType = 'price'; 
        let sortOrders = ['price', 'price', 'change', 'change'];
        let sortOrderIndex = 0;
        let isAscending = false; 

        let achievements = JSON.parse(localStorage.getItem('achievements')) || {
            '交易员生涯,开启！': { target: 500000, current: 0, completed: false },
            '首笔交易': { target: 1, current: 0, completed: false },
            '顶级交易员': { target: 1000000, current: 0, completed: false },
            '财富初现': { target: 2000000, current: 0, completed: false },
            '投资高手': { target: 5000000, current: 0, completed: false },
            '千万富翁': { target: 10000000, current: 0, completed: false },
            '股票大亨': { target: 20000000, current: 0, completed: false },
            '股神': { target: 50000000, current: 0, completed: false },
            '市场,由我掌握！': { target: 100000000, current: 0, completed: false },
            '游戏通关！': { target: 9, current: 0, completed: false }
        };

        const stocks = Array.from({ length: 21 }, (_, i) => {
            const basePrice = (Math.random() * 100 + 51).toFixed(2);
            return {
                id: i + 1,
                name: ['大葱之家','吖里西西', '腾达游戏','奶奶不泡茶', '智慧汽车', '智慧购物', '平安保险', '智慧农业', '北方科技', '长安科技', '有益集团', '北斗地图', '富特科技', '生益电子', '顺丰速运', '星扒克', '一茗奶茶', '幸运咖啡', '蜜雪城堡', '明牌珠宝', '神州信息', '雪龙集团', '宏海科技'][i],
                price: parseFloat(basePrice),
                change: 0
            };
        });

        function selectStock(id) {
            selectedStock = id;
            const stock = stocks.find(s => s.id === id);
            document.getElementById('selected-stock').textContent = stock.name;
            document.getElementById('stock-price').textContent = `¥${stock.price.toFixed(2)}`;
            document.getElementById('stock-change').textContent = `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%`;

            const button = document.querySelector(`.qty-selector button.active`);
            if (button) {
                if (button.textContent.includes('全部')) {
                    selectQty('all');
                } else if (button.textContent.includes('一半')) {
                    selectQty('half');
                } else {
                    selectQty(parseInt(button.textContent));
                }
            }
        }

        function selectQty(type) {
            if (!selectedStock) return alert('请先选择股票！');

            const stock = stocks.find(s => s.id === selectedStock);
            const qtyButtons = document.querySelectorAll('.qty-selector button');
            qtyButtons.forEach(btn => btn.classList.remove('active'));

            switch (type) {
                case 'all':
                    if (tradeType === 'buy') {
                        selectedQty = Math.floor(balance / stock.price / 100) * 100;
                    } else if (tradeType === 'sell') {
                        selectedQty = holdings[selectedStock] ? holdings[selectedStock].qty : 0;
                    }
                    break;
                case 'half':
                    if (tradeType === 'sell' && holdings[selectedStock]) {
                        selectedQty = Math.floor(holdings[selectedStock].qty / 2 / 100) * 100;
                    } else if (tradeType === 'buy') {
                        selectedQty = Math.floor((balance / stock.price) / 2 / 100) * 100; 
                    }
                    break;
                default:
                    selectedQty = Math.floor(type / 100) * 100; 
            }

            const button = document.querySelector(`.qty-selector button[onclick="selectQty('${type}')"]`);
            if (button) {
                button.classList.add('active');
            }
        }


        function executeTrade(type) {
            if (!selectedStock) return alert('请先选择股票！');

            tradeType = type; 

            const stock = stocks.find(s => s.id === selectedStock);

            confirmationMessage.textContent = `你确定以${stock.price.toFixed(2)}元/每股 ${type === 'buy' ? '购入' : '卖出'}${selectedQty}股的 ${stock.name} 吗？`;

            document.getElementById('current-balance').textContent = balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('remaining-balance').textContent = (type === 'buy'
                ? balance - (selectedQty * stock.price)
                : balance + (selectedQty * stock.price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            confirmationDialog.classList.add('active');
            overlay.classList.add('active');
        }


        function cancelTrade() {
            confirmationDialog.classList.remove('active');
            overlay.classList.remove('active');
        }


        function confirmTrade(type) {
            const stock = stocks.find(s => s.id === selectedStock);
            const amount = stock.price * selectedQty;

            if (type === 'buy') {
                if (amount > balance) return alert('资金不足！');
                balance -= amount;
                if (holdings[stock.id]) {
                    holdings[stock.id].qty += selectedQty;
                } else {
                    holdings[stock.id] = { qty: selectedQty, purchasePrice: stock.price };
                }
                achievements['首笔交易'].current = 1;
            } else {
                if ((holdings[stock.id] && holdings[stock.id].qty || 0) < selectedQty) return alert('持仓不足！');
                balance += amount;
                const profit = (stock.price - holdings[stock.id].purchasePrice) * selectedQty;
                holdings[stock.id].qty -= selectedQty;

                if (holdings[stock.id] && holdings[stock.id].qty <= 0) {
                    delete holdings[stock.id];
                }

                if (profit >= 5000000) {
                    achievements['顶级交易员'].current = 1;
                }
            }

            confirmationDialog.classList.remove('active');
            overlay.classList.remove('active');
            updateUI();
            updateAchievements();
            checkAchievements();
        }

        
        function updateUI() {
            document.getElementById('balance').textContent = balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            let holdingsValue = 0;
            Object.entries(holdings).forEach(([id, holding]) => {
                const stock = stocks.find(s => s.id === parseInt(id));
                holdingsValue += holding.qty * stock.price;
            });
            holdingsValue += balance;

            const changePercentage = ((holdingsValue - 500000) / 500000) * 100;
            document.getElementById('holdings-balance').textContent = holdingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('holdings-change').textContent = `${changePercentage >= 0 ? '+' : ''}${changePercentage.toFixed(2)}%`;
            document.getElementById('holdings-change').className = changePercentage >= 0 ? 'up' : 'down';

            const holdingsContainer = document.getElementById('holdings');
            holdingsContainer.innerHTML = Object.entries(holdings)
                .filter(([_, holding]) => holding.qty > 0)
                .map(([id, holding]) => {
                    const stock = stocks.find(s => s.id === parseInt(id));
                    const change = ((stock.price - holding.purchasePrice) / holding.purchasePrice) * 100;
                    return `
                        <div class="stock-item" onclick="selectStock(${stock.id})">
                            <h3>${stock.name}</h3>
                            <p>购入价：<br>¥${holding.purchasePrice.toFixed(2)}</p>
                            <p>当前价：<br>¥${stock.price.toFixed(2)}</p>
                            <p>持仓：${holding.qty}股</p>
                            <p class="${change >= 0 ? 'up' : 'down'}">涨幅：${change.toFixed(2)}%</p>
                        </div>
                    `;
                }).join('');

            renderRankings();
        }

        function renderAchievements() {
            const achievementsContainer = document.getElementById('achievements-list');
            achievementsContainer.innerHTML = Object.entries(achievements).map(([name, achievement]) => {
                const status = achievement.completed ? '已达成' : '未达成';
                return `
                    <div class="achievement-item ${name}">
                        <span>${name}</span>
                        <span>${achievement.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/${achievement.target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${status})</span>
                    </div>
                `;
            }).join('');

            const completedCount = Object.values(achievements).filter(achievement => achievement.completed).length;
            document.getElementById('achievements-progress').textContent = `${completedCount}/10`;

            document.getElementById('achievements-modal').classList.add('active');
            document.getElementById('disclaimer-modal').style.display = 'none';
        }

        function toggleRankingOrder() {
            sortOrderIndex = (sortOrderIndex + 1) % sortOrders.length;
            sortType = sortOrders[sortOrderIndex];
            isAscending = sortOrderIndex % 2 === 1;
            renderRankings();
        }

        function renderRankings() {
            const sortedStocks = [...stocks].sort((a, b) => {
                if (sortType === 'price') {
                    return isAscending ? a.price - b.price : b.price - a.price;
                } else if (sortType === 'change') {
                    return isAscending ? a.change - b.change : b.change - a.change;
                }
            }).slice(0, 20);

            const container = document.getElementById('rankings');
            container.innerHTML = sortedStocks.map((stock, index) => {
                const holding = holdings[stock.id];
                const holdingQty = holding ? holding.qty : 0;
                return `
                    <div class="ranking-item" onclick="selectStock(${stock.id})">
                        <span class="rank">${index + 1}</span>
                        <span>${stock.name}</span>
                        <span class="price">价格: ¥${stock.price.toFixed(2)}</span>
                        <span class="change ${stock.change < 0 ? 'down' : 'up'}">涨跌: ${stock.change.toFixed(2)}%</span>
                        ${holdingQty > 0 ? `<span class="holding-qty">持股: ${holdingQty}股</span>` : ''}
                    </div>
                `;
            }).join('');
        }

        function updateAchievements() {

			let holdingsValue = 0;
			Object.entries(holdings).forEach(([id, holding]) => {
				const stock = stocks.find(s => s.id === parseInt(id));
				holdingsValue += holding.qty * stock.price;
			});
			holdingsValue += balance;

			achievements['交易员生涯,开启！'].current = Math.max(achievements['交易员生涯,开启！'].current, balance);
			if (achievements['交易员生涯,开启！'].current >= achievements['交易员生涯,开启！'].target) {
				achievements['交易员生涯,开启！'].completed = true;
			}

			achievements['顶级交易员'].current = Math.max(achievements['顶级交易员'].current, holdingsValue);
			if (achievements['顶级交易员'].current >= achievements['顶级交易员'].target) {
				achievements['顶级交易员'].completed = true;
			}

			achievements['财富初现'].current = Math.max(achievements['财富初现'].current, holdingsValue);
			if (achievements['财富初现'].current >= achievements['财富初现'].target) {
				achievements['财富初现'].completed = true;
			}

			achievements['投资高手'].current = Math.max(achievements['投资高手'].current, holdingsValue);
			if (achievements['投资高手'].current >= achievements['投资高手'].target) {
				achievements['投资高手'].completed = true;
			}

			achievements['千万富翁'].current = Math.max(achievements['千万富翁'].current, holdingsValue);
			if (achievements['千万富翁'].current >= achievements['千万富翁'].target) {
				achievements['千万富翁'].completed = true;
			}

			achievements['股票大亨'].current = Math.max(achievements['股票大亨'].current, holdingsValue);
			if (achievements['股票大亨'].current >= achievements['股票大亨'].target) {
				achievements['股票大亨'].completed = true;
			}

			achievements['股神'].current = Math.max(achievements['股神'].current, holdingsValue);
			if (achievements['股神'].current >= achievements['股神'].target) {
				achievements['股神'].completed = true;
			}

			achievements['市场,由我掌握！'].current = Math.max(achievements['市场,由我掌握！'].current, holdingsValue);
			if (achievements['市场,由我掌握！'].current >= achievements['市场,由我掌握！'].target) {
				achievements['市场,由我掌握！'].completed = true;
			}
		
			let completedAchievements = Object.values(achievements).filter(a => a.completed).length;
			achievements['游戏通关！'].current = completedAchievements;
			if (achievements['游戏通关！'].current >= achievements['游戏通关！'].target) {
				achievements['游戏通关！'].completed = true;
			}

			localStorage.setItem('achievements', JSON.stringify(achievements));
		}

        function notifyAchievement(name) {
            const notification = document.getElementById('achievement-notification');
            notification.textContent = `获得成就：${name}`;
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 5000);
        }

        function checkAllAchievementsCompleted() {
            let completedCount = 0;
            for (const key in achievements) {
                if (key !== '游戏通关！' && achievements[key].completed) {
                    completedCount++;
                }
            }
            return completedCount === 9;
        }

        function updateGameCompletionAchievement() {
            if (checkAllAchievementsCompleted()) {
                achievements['游戏通关！'].completed = true;
            } else {
                achievements['游戏通关！'].completed = false;
            }
        }

        function checkAchievements() {
            Object.entries(achievements).forEach(([name, achievement]) => {
                if (achievement.current >= achievement.target && !achievement.completed) {
                    achievement.completed = true;
                    notifyAchievement(name);
                }
            });

            updateGameCompletionAchievement();

            if (achievements['游戏通关！'].completed) {
                notifyAchievement('游戏通关！');
            }
        }

        function checkAllAchievementsCompleted() {
            let completedCount = 0;
            for (const key in achievements) {
                if (key !== '游戏通关！' && achievements[key].completed) {
                    completedCount++;
                }
            }
            return completedCount === 9;
        }

        function updateGameCompletionAchievement() {
            if (checkAllAchievementsCompleted()) {
                achievements['游戏通关！'].completed = true;
            } else {
                achievements['游戏通关！'].completed = false;
            }
        }

        function checkAchievements() {
            let completedCount = 0;
            Object.entries(achievements).forEach(([name, achievement]) => {
                if (achievement.current >= achievement.target && !achievement.completed) {
                    achievement.completed = true;
                    completedCount++;
                    notifyAchievement(name);
                }
            });

            updateGameCompletionAchievement();

            if (achievements['游戏通关！'].completed) {
                notifyAchievement('游戏通关！');
            }
        }

        function notifyAchievement(name) {
            const notification = document.getElementById('achievement-notification');
            notification.textContent = `达成成就：${name}`;
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 5000);
        }

        function saveData() {
            const data = {
                balance: balance,
                holdings: holdings,
                achievements: achievements
            };
            localStorage.setItem('stockGameData', JSON.stringify(data));
            localStorage.setItem('achievements', JSON.stringify(achievements));
        }

        function loadData() {
            const data = JSON.parse(localStorage.getItem('stockGameData'));
            const savedAchievements = JSON.parse(localStorage.getItem('achievements'));
            if (data) {
                balance = data.balance;
                holdings = data.holdings;
            }
            if (savedAchievements) {
                achievements = savedAchievements;
            }
        }

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
                '市场,由我掌握！': { target: 100000000, current: 0, completed: false },
                '游戏通关！': { target: 9, current: 0, completed: false }
            };
            updateUI();
            localStorage.removeItem('stockGameData');
            localStorage.removeItem('achievements');
            location.reload();
        }

        window.addEventListener('beforeunload', function (e) {
            e.preventDefault();
            e.returnValue = '';
            saveData();
        });

        // 初始化
        loadData();
        renderStocks(); 
        setInterval(updateStocks, 10000); // 每10秒更新一次股票数据

        document.getElementById('close-modal').onclick = function () {
            document.getElementById('disclaimer-modal').style.display = 'none';
        };

        document.getElementById('achievement-btn').onclick = function () {
            const achievementsModal = document.getElementById('achievements-modal');
            if (achievementsModal.classList.contains('active')) {
                achievementsModal.classList.remove('active');
                document.getElementById('disclaimer-modal').style.display = 'none'; 
            } else {
                renderAchievements();
            }
        };

        let notificationShown = {};
        setInterval(checkAchievements, 60000); // 每60秒检查一次成就

        function renderStocks() {
            const container = document.getElementById('stocks-list');
            container.innerHTML = stocks.map(stock => `
                <div class="stock-item" onclick="selectStock(${stock.id})">
                    <h3>${stock.name}</h3>
                    <p>现价：¥${stock.price.toFixed(2)} <span class="change ${stock.change < 0 ? 'down' : 'up'}">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%</span></p>
                </div>
            `).join('');
        }

        function updateStocks() {
            stocks.forEach(stock => {
                const fluctuation = (Math.random() - 0.45) * 8; // 控制波动范围
                stock.change = fluctuation;
                stock.price = Math.max(10, stock.price * (1 + fluctuation / 100));
            });
            renderStocks();
            updateUI();
        }

        function updateTime() {
            const currentTime = document.getElementById('current-time');
            currentTime.textContent = new Date().toLocaleTimeString();
        }

        // 每秒更新一次时间
        setInterval(updateTime, 1000);
        updateTime(); 