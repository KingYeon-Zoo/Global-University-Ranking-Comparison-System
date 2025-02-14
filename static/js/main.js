// 全局变量
let allRankingData = {};
let currentYear = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化年份选择器
    await initializeYearSelect();
    
    // 初始化搜索功能
    initializeSearch();
    
    // 初始化对比功能
    initializeComparison();
    
    // 初始化趋势分析功能
    initializeTrend();
    
    // 隐藏搜索结果区域
    document.getElementById('searchResults').style.display = 'none';
});

// 初始化年份选择器
async function initializeYearSelect() {
    try {
        // 获取可用年份（已经是倒序排列）
        const response = await fetch('/api/available_years');
        const years = await response.json();
        
        const yearSelect = document.getElementById('yearSelect');
        
        // 添加年份选项（年份已经是倒序）
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}年`;
            yearSelect.appendChild(option);
        });
        
        // 使用第一个年份（最新的）作为默认值
        currentYear = years[0];
        yearSelect.value = currentYear;
        
        // 更新所有标题中的年份
        updateYearInTitles(currentYear);
        
        // 加载初始数据
        await loadRankingData(currentYear);
        
        // 添加年份变更事件监听
        yearSelect.addEventListener('change', async (e) => {
            currentYear = parseInt(e.target.value);
            updateYearInTitles(currentYear);
            await loadRankingData(currentYear);
        });
    } catch (error) {
        console.error('初始化年份选择器失败:', error);
        showError('加载年份数据失败，请刷新页面重试');
    }
}

// 更新标题中的年份
function updateYearInTitles(year) {
    document.querySelectorAll('.ranking-column h2 .year').forEach(span => {
        span.textContent = year;
    });
}

// 初始化搜索功能
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    // 搜索按钮点击事件
    searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value);
    });
    
    // 输入框回车事件
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
}

// 加载排名数据
async function loadRankingData(year) {
    try {
        const response = await fetch(`/api/rankings/${year}`);
        const data = await response.json();
        
        // 保存数据到全局变量
        allRankingData = data;
        
        // 更新显示
        updateRankingDisplay(data, year);
    } catch (error) {
        console.error('加载排名数据失败:', error);
        showError('加载排名数据失败，请稍后重试');
    }
}

// 更新排名显示
function updateRankingDisplay(data, year) {
    // 如果是2025年且ARWU数据为空，显示特殊提示
    if (year === 2025) {
        const arwuContent = document.getElementById('arwuRanking');
        arwuContent.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-info-circle"></i>
                <p>ARWU ${year}年排名数据暂未发布</p>
            </div>
        `;
    } else {
        updateRankingSection('arwuRanking', data.ARWU);
    }
    
    // 更新其他排名
    updateRankingSection('qsRanking', data.QS);
    updateRankingSection('theRanking', data.THE);
}

// 更新单个排名部分
function updateRankingSection(sectionId, rankingData) {
    const content = document.getElementById(sectionId);
    console.log(rankingData)
    if (!rankingData || rankingData.length === 0) {
        content.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-info-circle"></i>
                <p>暂无数据</p>
            </div>
        `;
        return;
    }
    
    // 创建表格
    const table = document.createElement('table');
    table.className = 'ranking-table';
    
    // 添加表头
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>排名</th>
            <th>学校</th>
            <th>国家/地区</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // 添加表格内容
    const tbody = document.createElement('tbody');
    rankingData.forEach(item => {
        const tr = document.createElement('tr');
        const countryCode = item.country_code ? item.country_code.toLowerCase() : '';
        const flagHtml = countryCode ? 
            `<img src="https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png" 
                 alt="${item.country}" 
                 class="country-flag">` : '';
        
        tr.innerHTML = `
            <td>${item.World_Rank || '-'}</td>
            <td>${item.University || '-'}</td>
            <td>
                ${flagHtml}
                <span class="country-name">${item.Country || '-'}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    // 更新内容
    content.innerHTML = '';
    content.appendChild(table);
}

// 执行搜索
async function performSearch(query) {
    if (!query.trim()) {
        document.getElementById('searchResults').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query.trim())}&year=${currentYear}`);
        const data = await response.json();

        if (response.ok) {
            displaySearchResults(data);
        } else {
            showError(data.error || '搜索失败，请稍后重试');
        }
    } catch (error) {
        console.error('搜索失败:', error);
        showError('搜索失败，请稍后重试');
    }
}

// 显示搜索结果
function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    const resultsContent = searchResults.querySelector('.results-content');
    const resultsHeader = searchResults.querySelector('.results-header');
    
    if (Object.keys(results).length === 0) {
        resultsContent.innerHTML = '<p class="no-results">未找到匹配的结果</p>';
    } else {
        let html = '<div class="search-results-container">';
        
        for (const [system, data] of Object.entries(results)) {
            html += `
                <div class="search-result-section">
                    <h3>${system} (${data.year}年)</h3>
                    <table class="search-result-table">
                        <thead>
                            <tr>
                                <th>排名</th>
                                <th>学校</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.data.map(item => `
                                <tr>
                                    <td>${item.World_Rank || '-'}</td>
                                    <td>${item.University || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        html += '</div>';
        resultsContent.innerHTML = html;
    }
    
    resultsHeader.style.display = 'flex';
    searchResults.style.display = 'block';
}

// 显示错误信息
function showError(message) {
    alert(message);
}

// 初始化对比功能
function initializeComparison() {
    const universityCount = document.getElementById('universityCount');
    const universityInputs = document.getElementById('universityInputs');
    const compareBtn = document.getElementById('compareBtn');
    
    // 初始化输入框
    updateUniversityInputs(parseInt(universityCount.value));
    
    // 监听大学数量变化
    universityCount.addEventListener('change', (e) => {
        updateUniversityInputs(parseInt(e.target.value));
    });
    
    // 监听对比按钮点击
    compareBtn.addEventListener('click', performComparison);
}

// 更新大学输入框
function updateUniversityInputs(count) {
    const container = document.getElementById('universityInputs');
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'university-input-group';
        inputGroup.innerHTML = `
            <input type="text" 
                   class="university-input" 
                   placeholder="输入第${i + 1}所大学名称..."
                   data-index="${i}">
            <button class="clear-btn" onclick="clearInput(${i})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(inputGroup);
    }
}

// 清除输入
function clearInput(index) {
    const input = document.querySelector(`.university-input[data-index="${index}"]`);
    if (input) {
        input.value = '';
    }
}

// 执行对比
async function performComparison() {
    const inputs = document.querySelectorAll('.university-input');
    const universities = Array.from(inputs)
        .map(input => input.value.trim())
        .filter(value => value !== '');
    
    if (universities.length < 2) {
        showError('请至少输入两所大学进行对比');
        return;
    }
    
    try {
        const queryString = universities
            .map(uni => `universities[]=${encodeURIComponent(uni)}`)
            .join('&');
        
        const response = await fetch(`/api/compare?${queryString}&year=${currentYear}`);
        const data = await response.json();
        
        if (response.ok) {
            displayComparisonResults(data);
        } else {
            showError(data.error || '对比失败，请稍后重试');
        }
    } catch (error) {
        console.error('对比失败:', error);
        showError('对比失败，请稍后重试');
    }
}

// 显示对比结果
function displayComparisonResults(data) {
    const container = document.getElementById('comparisonResults');
    const resultsContent = container.querySelector('.results-content');
    const resultsHeader = container.querySelector('.results-header');
    const results = data.results;
    const year = data.year;
    
    if (Object.keys(results).length === 0) {
        resultsContent.innerHTML = '<p class="no-results">未找到匹配的大学</p>';
    } else {
        let html = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>大学名称</th>
                        <th>ARWU排名</th>
                        <th>QS排名</th>
                        <th>THE排名</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (const [searchTerm, uniData] of Object.entries(results)) {
            const arwuInfo = uniData.ARWU || { rank: '-', name: '-' };
            const qsInfo = uniData.QS || { rank: '-', name: '-' };
            const theInfo = uniData.THE || { rank: '-', name: '-' };
            
            const displayName = arwuInfo.name !== '-' ? arwuInfo.name :
                              qsInfo.name !== '-' ? qsInfo.name :
                              theInfo.name !== '-' ? theInfo.name :
                              searchTerm;
            
            html += `
                <tr>
                    <td class="university-name">${displayName}</td>
                    <td class="rank">${arwuInfo.rank}</td>
                    <td class="rank">${qsInfo.rank}</td>
                    <td class="rank">${theInfo.rank}</td>
                </tr>
            `;
        }
        
        html += `
                </tbody>
            </table>
            <p class="comparison-note">数据来源：${year}年排名数据</p>
        `;
        
        resultsContent.innerHTML = html;
    }
    
    resultsHeader.style.display = 'flex';
    container.style.display = 'block';
}

// 初始化趋势分析
function initializeTrend() {
    const trendBtn = document.getElementById('trendBtn');
    const trendInput = document.getElementById('trendUniversityInput');
    
    // 监听分析按钮点击
    trendBtn.addEventListener('click', () => {
        performTrendAnalysis(trendInput.value);
    });
    
    // 监听回车键
    trendInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performTrendAnalysis(trendInput.value);
        }
    });
}

// 执行趋势分析
async function performTrendAnalysis(university) {
    if (!university.trim()) {
        showError('请输入大学名称');
        return;
    }
    
    try {
        const response = await fetch(`/api/trend?university=${encodeURIComponent(university.trim())}`);
        const data = await response.json();
        
        if (response.ok) {
            displayTrendResults(data);
        } else {
            showError(data.error || '分析失败，请稍后重试');
        }
    } catch (error) {
        console.error('趋势分析失败:', error);
        showError('分析失败，请稍后重试');
    }
}

// 显示趋势分析结果
function displayTrendResults(data) {
    const container = document.getElementById('trendResults');
    const resultsHeader = container.querySelector('.results-header');
    const chartContainer = document.getElementById('trendChart');
    const universityName = data.university_name;
    const trendData = data.trend_data;
    
    // 重置图表容器
    chartContainer.innerHTML = '<canvas></canvas>';
    const canvas = chartContainer.querySelector('canvas');
    
    // 准备图表数据
    const years = new Set();
    for (const system of Object.keys(trendData)) {
        Object.keys(trendData[system]).forEach(year => years.add(parseInt(year)));
    }
    const sortedYears = Array.from(years).sort();
    
    const datasets = [];
    const colors = {
        'ARWU': '#FF6384',
        'QS': '#36A2EB',
        'THE': '#4BC0C0'
    };
    
    // 为每个排名系统创建数据集
    for (const [system, systemData] of Object.entries(trendData)) {
        const data = sortedYears.map(year => {
            const yearData = systemData[year];
            return yearData ? yearData.rank : null;
        });
        
        datasets.push({
            label: system,
            data: data,
            borderColor: colors[system],
            backgroundColor: colors[system],
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
        });
    }
    
    // 销毁现有图表（如果存在）
    if (window.trendChart instanceof Chart) {
        window.trendChart.destroy();
    }
    
    // 创建新图表
    window.trendChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: sortedYears,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${universityName} 历年排名趋势`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: 20
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '年份'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '排名'
                    },
                    reverse: true,
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
    
    resultsHeader.style.display = 'flex';
    container.style.display = 'block';
}

// 隐藏结果区域
function hideResults(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.style.display = 'none';
        // 如果是趋势图，销毁图表实例
        if (containerId === 'trendResults' && window.trendChart instanceof Chart) {
            window.trendChart.destroy();
            window.trendChart = null;
        }
        // 如果是对比或搜索结果，清空输入框
        if (containerId === 'searchResults') {
            document.getElementById('searchInput').value = '';
        } else if (containerId === 'comparisonResults') {
            document.querySelectorAll('.university-input').forEach(input => {
                input.value = '';
            });
        }
    }
} 