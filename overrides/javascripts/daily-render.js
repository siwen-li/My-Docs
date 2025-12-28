(function() {
    // 状态变量
    let currentRenderDate = '';
    let contentContainer = null;

    // --- 辅助工具：获取今天的日期字符串 (YYYY-MM-DD) ---
    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- 辅助工具：更新"后一天"按钮的可点击状态 ---
    function updateNextButtonState(viewingDate) {
        const btnNext = document.getElementById('dc-next');
        if (!btnNext) return;
        const today = getTodayString();
        if (viewingDate >= today) {
            btnNext.disabled = true;
            btnNext.title = "已经是最新一期了";
        } else {
            btnNext.disabled = false;
            btnNext.title = "查看后一天";
        }
    }

    // --- 导出功能实现 ---
    
    // 1. 导出图片
    async function exportToImage() {
        const element = document.querySelector('.daily-paper-wrapper');
        if (!element) return;

        const btn = document.getElementById('dc-export-img');
        const originalText = btn.innerText;
        btn.innerText = '生成中...';
        btn.disabled = true;

        try {
            // 使用 html2canvas 截图
            const canvas = await html2canvas(element, {
                scale: 2, // 提高清晰度
                useCORS: true, // 允许跨域图片
                backgroundColor: getComputedStyle(document.body).getPropertyValue('--p-bg') || '#ffffff', // 确保背景色正确
                logging: false
            });

            // 创建下载链接
            const link = document.createElement('a');
            link.download = `申论日刊-${currentRenderDate}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('导出图片失败:', err);
            alert('导出图片失败，请重试');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }



    // --- 核心入口 ---
    window.renderDailyPaper = function(containerId, initialDate) {
        const wrapper = document.getElementById(containerId);
        if (!wrapper) return;

        // 1. 初始化容器结构 (新增了右侧的操作组)
        wrapper.innerHTML = `
            <div class="daily-controls">
                <div class="dc-nav-group">
                    <button class="dc-btn" id="dc-prev" title="查看前一天">«</button>
                    <div class="dc-date-group">
                        <input type="date" id="dc-picker" class="dc-input">
                        <button class="dc-btn dc-btn-primary" id="dc-go">查询</button>
                    </div>
                    <button class="dc-btn" id="dc-next" title="查看后一天">»</button>
                </div>
                
                <div class="dc-action-group">
                    <button class="dc-btn dc-btn-outline" id="dc-export-img" title="保存为长图">📷 导出图片</button>
                </div>
            </div>
            <div id="daily-paper-content"></div>
        `;

        contentContainer = document.getElementById('daily-paper-content');
        
        // 2. 绑定元素
        const picker = document.getElementById('dc-picker');
        const btnPrev = document.getElementById('dc-prev');
        const btnNext = document.getElementById('dc-next');
        const btnGo = document.getElementById('dc-go');
        const btnImg = document.getElementById('dc-export-img');

        const today = getTodayString();
        if (!initialDate) {
            initialDate = today;
        }
        
        picker.value = initialDate;
        picker.max = today; 
        
        _loadPaper(initialDate);

        // --- 事件监听 ---
        btnGo.onclick = () => { if(picker.value) _loadPaper(picker.value); };
        picker.onkeypress = (e) => { if (e.key === 'Enter' && picker.value) _loadPaper(picker.value); };

        btnPrev.onclick = () => {
            const d = new Date(currentRenderDate);
            d.setDate(d.getDate() - 1);
            const newDate = d.toISOString().split('T')[0];
            picker.value = newDate;
            _loadPaper(newDate);
        };

        btnNext.onclick = () => {
            if (currentRenderDate >= getTodayString()) return;
            const d = new Date(currentRenderDate);
            d.setDate(d.getDate() + 1);
            const newDate = d.toISOString().split('T')[0];
            picker.value = newDate;
            _loadPaper(newDate);
        };

        // 绑定导出事件
        btnImg.onclick = exportToImage;
    };

    // --- 数据请求与渲染逻辑 ---
    async function _loadPaper(date) {
        currentRenderDate = date; 
        updateNextButtonState(date);
        
        if (!contentContainer) return;
        contentContainer.innerHTML = '<div class="paper-loading">正在获取 ' + date + ' 的数据...</div>';

        try {
            const apiUrl = `https://shenlunsucai.com/api/v1/daily-news/by-date?date=${date}&status=published`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                 if(response.status === 404) throw new Error("该日期暂无日报数据");
                 throw new Error(`请求失败: ${response.status}`);
            }
            
            const resJson = await response.json();
            if (resJson.code !== 200 || !resJson.data) {
                throw new Error(resJson.message || "该日期暂无数据");
            }

            const data = resJson.data;
            
            let quoteHtml = '';
            if (data.quotes && data.quotes.length > 0) {
                quoteHtml = `
                    <div class="quote-wrapper">
                        <div class="quote-box">
                            <div class="quote-title-badge">晨读 · 金句</div>
                            <div class="quote-content">
                                ${data.quotes.map(q => `<div class="quote-line">${q}</div>`).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }

            let html = `
                <div class="daily-paper-wrapper">
                    <!-- 报头 -->
                    <div class="paper-header">
                        <div class="brand"> 申论日刊 </div>
                        <div class="meta"> ${data.date} ${data.weekday} </div>
                    </div>
                    
                    ${quoteHtml}

                    ${_renderSection('policy', data.policy)}
                    ${_renderSection('hotspot', data.hotspot)}
                    ${_renderSection('caseStudy', data.caseStudy)}
                    ${_renderEssay(data.essay)}
                </div>
            `;

            contentContainer.innerHTML = html;

        } catch (err) {
            contentContainer.innerHTML = `
            <div class="daily-paper-wrapper" style="text-align:center; padding: 50px 20px;">
                <h3 style="color:var(--p-text-light)">📅 ${date}</h3>
                <div style="color:var(--p-brand); margin-top:20px; font-weight:bold;">
                    ${err.message}
                </div>
                <p style="color:var(--p-text-lighter); font-size:12px; margin-top:10px;">
                    可能是当天周末休刊，或者数据尚未发布。<br>请尝试切换其他日期。
                </p>
            </div>`;
            console.error(err);
        }
    }

    // --- 辅助函数 (文本处理) ---
    function _applyMarks(fullText, marks) {
        if (!marks || marks.length === 0) return fullText;
        const sortedMarks = [...marks].sort((a, b) => a.startIndex - b.startIndex);
        let result = "";
        let cursor = 0;
        sortedMarks.forEach(mark => {
            if (!mark.text) return;
            const foundIndex = fullText.indexOf(mark.text, cursor);
            if (foundIndex !== -1) {
                if (foundIndex > cursor) {
                    result += fullText.slice(cursor, foundIndex);
                }
                const cls = mark.type ? `hl-${mark.type}` : '';
                result += `<span class="${cls}">${mark.text}</span>`;
                cursor = foundIndex + mark.text.length;
            }
        });
        if (cursor < fullText.length) result += fullText.slice(cursor);
        return result;
    }

    function _renderSection(type, data) {
        if (!data) return '';
        const content = data.content || data.introduction || "";
        const typeMap = { 'policy': '政策', 'hotspot': '热点', 'caseStudy': '案例' };
        const typeCn = typeMap[type] || '板块';
        
        return `
        <div class="section-block">
            <h2 class="section-title"><span class="tag">【${typeCn}】</span>${data.title}</h2>
            <div class="section-body">
                <div class="text-content">${content}</div>
            </div>
            <div class="application-box">
                <div class="app-title">➤ 申论运用示例：</div>
                <div><strong>适用主题：</strong>${data.applicableThemes ? data.applicableThemes.join('、') : ''}</div>
                <div style="margin-top:5px;"><strong>写作语段：</strong>${data.writingExample || ''}</div>
            </div>
        </div>`;
    }

    function _renderEssay(essay) {
        if (!essay) return '';
        const tags = essay.applicableThemes ? essay.applicableThemes.map(t => `<span class="pill">${t}</span>`).join('') : '';
        let contentHtml = '';
        let sidebarHtml = '';
        const _getTagClass = (tagName) => {
            if (!tagName) return '';
            if (tagName.includes('总论点')) return 'label-zld';
            if (tagName.includes('分论点')) return 'label-fld';
            if (tagName.includes('金句'))   return 'label-jj';
            if (tagName.includes('论述'))   return 'label-ls';
            if (tagName.includes('案例'))   return 'label-al';
            if (tagName.includes('对策'))   return 'label-dc';
            return '';
        };
        if (essay.paragraphs) {
            essay.paragraphs.forEach((para, idx) => {
                contentHtml += `<p>${_applyMarks(para.text, para.marks)}</p>`;
                if (para.analysis && para.analysis.items) {
                    const items = para.analysis.items.map(item => {
                        const colorClass = _getTagClass(item.tag);
                        return `
                        <div class="analysis-point">
                            <span class="label ${colorClass}">${item.tag}：</span>
                            <span class="desc">${item.content}</span>
                        </div>`;
                    }).join('');
                    sidebarHtml += `
                    <div class="analysis-card">
                        <div class="step-badge">${idx + 1}</div>
                        <span class="step-title">${para.analysis.header || ''}</span>
                        ${items}
                    </div>`;
                }
            });
        }
        return `
        <div class="article-section">
            <div class="article-header">
                <h1 class="main-title">${essay.title}</h1>
                <div class="art-meta">来源：${essay.source} &nbsp;&nbsp;|&nbsp;&nbsp; 作者：${essay.author} &nbsp;&nbsp;|&nbsp;&nbsp; 日期：${essay.publishDate}</div>
                <div class="art-tags">适用主题：${tags}</div>
            </div>
            <div class="article-layout">
                <div class="article-main">${contentHtml}</div>
                <div class="article-sidebar">${sidebarHtml}</div>
            </div>
        </div>`;
    }
})();