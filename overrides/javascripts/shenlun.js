// docs/assets/shenlun.js

(function() {
    // ============================================================
    // 1. 静态配置与工具函数
    // ============================================================
    
    const CONFIG = {
        cols: 25,          
        minRows: 10,       
        markInterval: 100  
    };

    const FORBIDDEN_START_PUNCTUATION = "，。、：；？！’”»)]}〉》";

    function isPurePunct(str) {
        return /^[，。、：；？！“”‘’]+$/.test(str);
    }

    function containsForbiddenStart(str) {
        for (let char of str) {
            if (FORBIDDEN_START_PUNCTUATION.includes(char)) return true;
        }
        return false;
    }

    function tokenize(text) {
        if (!text) return [];
        const regex = /(\d+\.)|(xx)|(\d{2})|([，。、：；？！“”‘’]{2})|[\s\S]/gi;
        return text.match(regex) || [];
    }

    // ============================================================
    // 2. 核心渲染函数
    // ============================================================

    window.renderShenlun = function(target, data) {
        const root = (typeof target === 'string') ? document.getElementById(target) : target;
        if (!root) return;

        // 【关键修复】：自动添加样式类，确保 CSS 生效
        root.classList.add('shenlun-wrapper');

        // 初始化状态
        let totalGridCount = 0; 
        let allRowsHtml = [];

        // --- 内部渲染逻辑 ---

        function createRow(chars) {
            while (chars.length < CONFIG.cols) {
                chars.push('');
            }
            totalGridCount += CONFIG.cols;
            
            let cellsHtml = chars.map(content => {
                let className = 'grid-cell';
                let innerHTML = content;

                if (content && content.length > 1) {
                    if (/^\d+\.$/.test(content)) className += ' is-number';
                    else if (/^xx$/i.test(content)) className += ' double-x';
                    else if (/^\d{2}$/i.test(content)) className += ' double-num';
                    else if (isPurePunct(content)) className += ' double-punct';
                    else {
                        className += ' squeeze-punct';
                        innerHTML = `<span class="char">${content[0]}</span><span class="punct">${content.substring(1)}</span>`;
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

        function splitToRowsWithSqueeze(text) {
            const rows = [];
            let currentRow = [];
            const tokens = tokenize(text);
    
            for (let i = 0; i < tokens.length; i++) {
                let token = tokens[i];
                currentRow.push(token);
    
                if (currentRow.length === CONFIG.cols) {
                    let nextToken = tokens[i + 1];
                    if (nextToken && containsForbiddenStart(nextToken)) {
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

        function processCenterText(text) {
            const tokens = tokenize(text);
            const padding = Math.floor((CONFIG.cols - tokens.length) / 2);
            return Array(padding).fill('').concat(tokens);
        }
    
        function processRightText(text) {
            const tokens = tokenize(text);
            const leftPadding = Math.max(0, CONFIG.cols - tokens.length - 4);
            return Array(leftPadding).fill('').concat(tokens);
        }

        // --- 构建 DOM ---

        root.innerHTML = ''; 

        if (data.title) {
            allRowsHtml.push(createRow(processCenterText(data.title)));
        }

        if (data.content && Array.isArray(data.content)) {
            data.content.forEach(item => {
                let text = item.text || '';
                if(item.type === 'para') text = '　　' + text;
                const rows = splitToRowsWithSqueeze(text);
                rows.forEach(r => allRowsHtml.push(createRow(r)));
            });
        }
        
        if (data.footer && Array.isArray(data.footer)) {
            data.footer.forEach(line => allRowsHtml.push(createRow(processRightText(line))));
        }
        
        allRowsHtml.push(createRow(Array(CONFIG.cols).fill('')));
        while (allRowsHtml.length < CONFIG.minRows) {
            allRowsHtml.push(createRow(Array(CONFIG.cols).fill('')));
        }

        const pageDiv = document.createElement('div');
        pageDiv.className = 'paper-container';
        pageDiv.innerHTML = allRowsHtml.join('');
        root.appendChild(pageDiv);
    };

    // ============================================================
    // 3. 自动扫描逻辑
    // ============================================================

    function autoRenderAll() {
        const containers = document.querySelectorAll('.shenlun-auto');
        containers.forEach(container => {
            if (container.dataset.rendered === 'true') return;

            const textarea = container.querySelector('textarea');
            if (textarea) {
                try {
                    // 解析宽松的 JSON 数据
                    const getData = new Function("return " + textarea.value);
                    const data = getData();
                    window.renderShenlun(container, data);
                    container.dataset.rendered = 'true';
                } catch (e) {
                    console.error("申论排版错误:", e);
                    container.innerHTML = `<div style="color:red;border:1px solid red;padding:10px;">配置解析失败: ${e.message}</div>`;
                }
            }
        });
    }

    // ============================================================
    // 4. 事件监听
    // ============================================================

    document.addEventListener("DOMContentLoaded", autoRenderAll);
    
    if (typeof document$ !== "undefined") {
        document$.subscribe(() => {
            autoRenderAll();
        });
    }
    
    if (document.readyState === "complete" || document.readyState === "interactive") {
        autoRenderAll();
    }

})();