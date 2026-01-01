// docs/assets/shenlun.js

(function() {
    // ============================================================
    // 1. 静态配置与工具函数
    // ============================================================
    
    const CONFIG = {
        cols: 25,          
        minRows: 4,       
        markInterval: 100  
    };

    const FORBIDDEN_START_PUNCTUATION = "，。、：；？！’”»)]}〉》";

    // 辅助：去除HTML标签获取纯文本
    function stripHtml(html) {
        if (!html) return "";
        return html.replace(/<[^>]*>/g, "");
    }

    function isPurePunct(str) {
        return /^[，。、：；？！“”‘’]+$/.test(stripHtml(str));
    }

    function containsForbiddenStart(str) {
        const text = stripHtml(str);
        for (let char of text) {
            if (FORBIDDEN_START_PUNCTUATION.includes(char)) return true;
        }
        return false;
    }

    // === 基础分词逻辑（仅处理纯文本） ===
    function baseTokenize(text) {
        if (!text) return [];
        // 匹配规则：数字+点 | xx | 两位数字 | 连续标点 | 单个字符
        const regex = /(\d+\.)|(xx)|(\d{2})|([，。、：；？！“”‘’]{2})|[\s\S]/gi;
        return text.match(regex) || [];
    }

    // === 核心分词器：支持 HTML 嵌套解析 ===
    function tokenize(text) {
        if (!text) return [];

        // 优化：如果不含 HTML 标签，直接走基础分词
        if (text.indexOf('<') === -1) {
            return baseTokenize(text);
        }

        const tokens = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        function traverse(node, parentWrappers = []) {
            if (node.nodeType === Node.TEXT_NODE) {
                const content = node.nodeValue;
                const rawTokens = baseTokenize(content);
                
                rawTokens.forEach(token => {
                    // 【关键修复】：仅过滤掉非全角空格的空白字符（保留 '　'）
                    // 1. 如果不是空白字符，保留
                    // 2. 如果是空白字符，但包含全角空格，保留
                    // 3. 其他空白（如代码换行、普通空格）则跳过
                    const isWhitespace = /^\s+$/.test(token);
                    const hasIndent = token.indexOf('　') !== -1;
                    
                    if (isWhitespace && !hasIndent) return;

                    let finalToken = token;

                    // 重新包裹父级标签
                    if (parentWrappers.length > 0) {
                        for (let i = parentWrappers.length - 1; i >= 0; i--) {
                            const wrapperClone = parentWrappers[i].cloneNode(false);
                            wrapperClone.innerHTML = finalToken;
                            finalToken = wrapperClone.outerHTML;
                        }
                    }
                    tokens.push(finalToken);
                });

            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'BR') {
                    tokens.push('<br>');
                    return;
                }
                const newWrappers = [...parentWrappers, node];
                node.childNodes.forEach(child => traverse(child, newWrappers));
            }
        }

        tempDiv.childNodes.forEach(child => traverse(child, []));
        return tokens;
    }

    // ============================================================
    // 2. 核心渲染函数
    // ============================================================

    window.renderShenlun = function(target, data) {
        const root = (typeof target === 'string') ? document.getElementById(target) : target;
        if (!root) return;

        root.classList.add('shenlun-wrapper');

        let totalGridCount = 0; 
        let allRowsHtml = [];

        function createRow(chars) {
            while (chars.length < CONFIG.cols) {
                chars.push('');
            }
            totalGridCount += CONFIG.cols;
            
            let cellsHtml = chars.map(content => {
                let className = 'grid-cell';
                let innerHTML = content;
                const pureText = stripHtml(content); 

                if (content && content.length > 0) {
                    if (/<[\s\S]+>/.test(content)) {
                        // 如果是 HTML 标签（含样式），标记并直接输出
                        className += ' custom-html';
                        // 依然允许 HTML 内部的数字显示为数字样式（如果需要可自行扩展逻辑）
                        // 这里默认样式优先
                    }
                    else if (/^\d+\.$/.test(pureText)) className += ' is-number';
                    else if (/^xx$/i.test(pureText)) className += ' double-x';
                    else if (/^\d{2}$/i.test(pureText)) className += ' double-num';
                    else if (isPurePunct(pureText)) className += ' double-punct';
                    else if (pureText.length > 1) {
                        className += ' squeeze-punct';
                        innerHTML = `<span class="char">${pureText[0]}</span><span class="punct">${pureText.substring(1)}</span>`;
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
                    // 避头尾：如果下一个是非HTML的禁止行首标点，则挤压
                    // 注意：如果下一个token是HTML包裹的标点（如 <span..>，</span>），stripHtml 后也能识别
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
                // 【保留原有逻辑】：如果是段落，手动添加两个全角空格
                if(item.type === 'para') {
                    text = '　　' + text;
                }
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

    document.addEventListener("DOMContentLoaded", autoRenderAll);
    if (typeof document$ !== "undefined") {
        document$.subscribe(() => { autoRenderAll(); });
    }
    if (document.readyState === "complete" || document.readyState === "interactive") {
        autoRenderAll();
    }

})();