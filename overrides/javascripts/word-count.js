// docs/javascripts/count-word.js

function addReadTime() {
    // =========================================
    // 排除逻辑开始
    // =========================================

    // 1. 【手动标记排除】
    // 如果页面中有 <div class="no-read-time"> 则不显示
    if (document.querySelector(".no-read-time")) {
        return; 
    }

    // 2. 【首页排除】
    // 排除根目录的 index.md
    var path = window.location.pathname;
    if (path === "/" || path === "/index.html") {
        return;
    }

    // 3. 【智能排除子目录 index.md】(适配 Material 主题)
    // 只有当页面源码文件是 index.md 时，编辑按钮的链接通常会以 "index.md" 结尾
    // 查找 Material 主题的编辑按钮
    var editButton = document.querySelector("a.md-content__button");
    if (editButton && editButton.href) {
        // 如果编辑链接以 index.md 结尾，说明这是个 index 文件，直接退出
        if (editButton.href.endsWith("index.md")) {
            return;
        }
    }

    // =========================================
    // 排除逻辑结束，开始统计
    // =========================================

    // 防止重复添加
    if (document.querySelector(".read-time-info")) return;

    // 获取文章内容
    var content = document.querySelector(".md-content__inner") || document.querySelector("article");
    if (!content) return;

    var text = content.innerText;
    
    // 统计字数
    var cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    var en = (text.match(/[a-zA-Z0-9]+/g) || []).length;
    var totalCount = cn + en;

    // 字数过少不显示 (比如只有标题的空页面)
    if (totalCount < 10) return;

    // 计算时间
    var readTime = Math.ceil(totalCount / 400);
    if (readTime < 1) readTime = 1;

    // 创建显示元素
    var infoElem = document.createElement("div");
    infoElem.className = "read-time-info"; 
    infoElem.style.marginTop = "0.6rem";
    infoElem.style.marginBottom = "1.2rem";
    infoElem.style.color = "var(--md-default-fg-color--light)";
    infoElem.style.fontSize = "0.8rem";
    
    infoElem.innerHTML = `⏱️ 阅读时间：${readTime} min (${totalCount} 字)`;

    // 插入位置
    var h1 = content.querySelector("h1");
    if (h1) {
        h1.insertAdjacentElement('afterend', infoElem);
    } else {
        content.prepend(infoElem);
    }
}

// 初始加载
document.addEventListener("DOMContentLoaded", addReadTime);

// 兼容 Instant Loading
if (window.document$) {
    window.document$.subscribe(function() {
        setTimeout(addReadTime, 100); 
    });
}