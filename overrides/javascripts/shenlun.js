// docs/assets/shenlun.js

(function() {
    // --- 配置 ---
    const CONFIG = {
        cols: 25,          
        minRows: 10,        
        markInterval: 100  
    };

    const FORBIDDEN_START_PUNCTUATION = "，。、：；？！’”»)]}〉》";
    let totalGridCount = 0; 

    // --- 工具函数 ---

    // 判断是否纯标点
    function isPurePunct(str) {
        return /^[，。、：；？！“”‘’]+$/.test(str);
    }

    // 判断是否包含避头标点
    function containsForbiddenStart(str) {
        for (let char of str) {
            if (FORBIDDEN_START_PUNCTUATION.includes(char)) return true;
        }
        return false;
    }

    /**
     * 【核心升级】通用分词函数
     * 统一处理所有地方（标题、正文、落款）的分词规则
     */
    function tokenize(text) {
        if (!text) return [];
        // 正则规则：
        // 1. (\d+\.)       匹配 "1." (数字序号)
        // 2. (xx)          匹配 "xx" (占位符, 忽略大小写)
        // 3. ([...]{2})    匹配双标点 (如 "”。")
        // 4. [\s\S]        匹配任意单个字符
        const regex = /(\d+\.)|(xx)|(\d{2})|([，。、：；？！“”‘’]{2})|[\s\S]/gi;
        return text.match(regex) || [];
    }

    // --- 渲染主逻辑 ---

    function renderShenlun() {
        const root = document.getElementById('paper-root');
        if (!root) return;

        const data = window.SHENLUN_DATA || {
            title: "示例内容",
            content: [{type:'text', text:'请在 Markdown 中定义 window.SHENLUN_DATA'}],
            footer: []
        };

        root.innerHTML = '';
        totalGridCount = 0;
        let allRowsHtml = [];

        // 1. 标题 (现在支持 xx 了)
        if (data.title) {
            allRowsHtml.push(createRow(processCenterText(data.title)));
        }

        // 2. 正文
        if (data.content && Array.isArray(data.content)) {
            data.content.forEach(item => {
                let text = item.text;
                if(item.type === 'para') {
                    text = '　　' + text; 
                }
                const rows = splitToRowsWithSqueeze(text);
                rows.forEach(rowArr => {
                    allRowsHtml.push(createRow(rowArr));
                });
            });
        }
        
        // 3. 落款 (现在支持 xx 了)
        if (data.footer && Array.isArray(data.footer)) {
            data.footer.forEach(line => {
                allRowsHtml.push(createRow(processRightText(line)));
            });
        }
        
        // 4. 动态高度
        allRowsHtml.push(createRow(Array(CONFIG.cols).fill(''))); // 补空行
        while (allRowsHtml.length < CONFIG.minRows) {
            allRowsHtml.push(createRow(Array(CONFIG.cols).fill('')));
        }

        // 5. 挂载
        const pageDiv = document.createElement('div');
        pageDiv.className = 'paper-container';
        pageDiv.innerHTML = allRowsHtml.join('');
        root.appendChild(pageDiv);
    }

    /**
     * 正文分词处理 (包含行末标点挤压逻辑)
     */
    function splitToRowsWithSqueeze(text) {
        const rows = [];
        let currentRow = [];
        
        // 使用统一的 tokenize 函数
        const tokens = tokenize(text);

        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            currentRow.push(token);

            if (currentRow.length === CONFIG.cols) {
                let nextToken = tokens[i + 1];
                if (nextToken && containsForbiddenStart(nextToken)) {
                    // 挤压：把标点加到当前行最后一个格子里
                    currentRow[currentRow.length - 1] += nextToken;
                    i++; 
                }
                rows.push(currentRow);
                currentRow = [];
            }
        }
        if (currentRow.length > 0) rows.push(currentRow);
        return rows;
    }

    /**
     * 创建行 HTML
     */
    function createRow(chars) {
        while (chars.length < CONFIG.cols) {
            chars.push('');
        }
        totalGridCount += CONFIG.cols;
        
        let cellsHtml = chars.map(content => {
            let className = 'grid-cell';
            let innerHTML = content;

            if (content && content.length > 1) {
                if (/^\d+\.$/.test(content)) {
                    className += ' is-number';
                }
                // 检查 xx (忽略大小写)
                else if (/^xx$/i.test(content)) {
                    className += ' double-x';
                }
                else if (/^\d{2}$/i.test(content)) {
                    className += ' double-num';
                }
                else if (isPurePunct(content)) {
                    className += ' double-punct';
                } 
                else {
                    className += ' squeeze-punct';
                    const char = content[0];
                    const punct = content.substring(1);
                    innerHTML = `<span class="char">${char}</span><span class="punct">${punct}</span>`;
                }
            }
            return `<div class="${className}">${innerHTML}</div>`;
        }).join('');

        let markHtml = '';
        if (totalGridCount % CONFIG.markInterval === 0) {
            markHtml = `<div class="word-count-mark">(${totalGridCount}字)</div>`;
        } 
        return `<div class="grid-row">${cellsHtml}${markHtml}</div>`;
    }

    /**
     * 处理标题居中 (使用 tokenize 准确计算 token 数量)
     */
    function processCenterText(text) {
        const tokens = tokenize(text); // 关键：按 token 计数，而不是按字符
        const padding = Math.floor((CONFIG.cols - tokens.length) / 2);
        return Array(padding).fill('').concat(tokens);
    }

    /**
     * 处理落款右对齐 (使用 tokenize 准确计算 token 数量)
     */
    function processRightText(text) {
        const tokens = tokenize(text); // 关键：按 token 计数
        const rightMargin = 4;
        const leftPadding = CONFIG.cols - tokens.length - rightMargin;
        const finalPadding = Math.max(0, leftPadding);
        return Array(finalPadding).fill('').concat(tokens);
    }

    // 初始化
    document.addEventListener("DOMContentLoaded", renderShenlun);
    if (typeof document$ !== "undefined") {
        document$.subscribe(renderShenlun);
    }
})();