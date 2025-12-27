// docs/javascripts/mindmap.js

(function() {
    function addMindMap() {
        // 1. 排除逻辑
        if (document.querySelector(".no-read-time")) return;
        var path = window.location.pathname;
        if (path === "/" || path === "/index.html") return;
        var editButton = document.querySelector("a.md-content__button");
        if (editButton && editButton.href && editButton.href.endsWith("index.md")) return;

        // 2. 防止重复
        if (document.querySelector("#markmap-container")) return;

        var content = document.querySelector(".md-content__inner") || document.querySelector("article");
        if (!content) return;

        // 3. 提取标题 (去锚点逻辑保持不变)
        var headers = content.querySelectorAll("h2, h3, h4");
        if (headers.length < 2) return; 

        var h1 = content.querySelector("h1");
        var rootTitle = "目录";
        
        if (h1) {
            var h1Clone = h1.cloneNode(true);
            var h1Anchor = h1Clone.querySelector(".headerlink");
            if (h1Anchor) h1Anchor.remove();
            rootTitle = h1Clone.innerText.trim();
        }

        var markdown = `# ${rootTitle}\n`;

        headers.forEach(header => {
            var level = parseInt(header.tagName.replace("H", ""));
            var hash = "#".repeat(level);
            
            var clone = header.cloneNode(true);
            var anchor = clone.querySelector(".headerlink");
            if (anchor) anchor.remove();
            var cleanText = clone.innerText.trim();

            markdown += `${hash} ${cleanText}\n`;
        });

        // 4. 创建容器 (样式已修改)
        var container = document.createElement("div");
        container.id = "markmap-container";
        container.style.width = "100%";
        container.style.height = "300px"; 
        container.style.marginBottom = "1.5rem";
        container.style.marginTop = "0.5rem";
        
        // ====================================================
        // 修改这里：只保留下边框
        // ====================================================
        // 移除全边框
        // container.style.border = "1px solid ..."; 
        
        // 只设置底部边框
        container.style.borderBottom = "1px solid var(--md-default-fg-color--lightest)";
        
        // 移除圆角 (单边框通常配合直角更好看)
        container.style.borderRadius = "0"; 
        
        container.style.overflow = "hidden";
        container.style.position = "relative"; 

        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "markmap-svg";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.display = "block";
        container.appendChild(svg);

        // 5. 插入位置
        var readTimeInfo = document.querySelector(".read-time-info");
        if (readTimeInfo) {
            readTimeInfo.insertAdjacentElement('afterend', container);
        } else if (h1) {
            h1.insertAdjacentElement('afterend', container);
        } else {
            content.prepend(container);
        }

        // 6. 渲染 Markmap (保持动画设置)
        if (window.markmap && window.markmap.Transformer && window.markmap.Markmap) {
            var transformer = new window.markmap.Transformer();
            var { root } = transformer.transform(markdown);
            
            window.markmap.Markmap.create(svg, {
                autoFit: true,
                fitRatio: 0.95,
                duration: 800, // 保持动画
                zoom: true,
                pan: true,
                scrollForPan: false,
                initialExpandLevel: 3
            }, root);
        }
    }

    // 初始化
    document.addEventListener("DOMContentLoaded", addMindMap);
    if (window.document$) {
        window.document$.subscribe(function() {
            setTimeout(addMindMap, 150); 
        });
    }
})();