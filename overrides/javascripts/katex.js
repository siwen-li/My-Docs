// document$.subscribe(({ body }) => { 
//   renderMathInElement(body, {
//     delimiters: [
//       { left: "$$",  right: "$$",  display: true },
//       { left: "$",   right: "$",   display: false },
//       { left: "\\(", right: "\\)", display: false },
//       { left: "\\[", right: "\\]", display: true }
//     ],
//   })
// });

document.addEventListener("DOMContentLoaded", function() {
    // 1. 定义渲染选项
    var mathOptions = {
        delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false},
            {left: "\\(", right: "\\)", display: false},
            {left: "\\[", right: "\\]", display: true}
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        // 显式抛出错误以防吞掉异常
        throwOnError: false
    };

    // 2. 初始渲染整个页面
    renderMathInElement(document.body, mathOptions);

    // 3. 处理 MkDocs Material 的 Instant Loading (如果开启了)
    // 每次页面切换后重新渲染
    if (typeof document$ !== "undefined") {
        document$.subscribe(() => {
            renderMathInElement(document.body, mathOptions);
        })
    }

    // 4. 【核心修复】监听 DOM 变化 (针对 data-preview / tooltips)
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(function(node) {
                    // 检查节点是否是元素节点 (nodeType 1)
                    if (node.nodeType === 1) {
                        // 针对 MkDocs Material 的 tooltip 容器通常包含在某些特定 class 中
                        // 或者直接对新增节点进行渲染尝试
                        // 这里的 try-catch 是为了防止在非文本节点上报错
                        try {
                            renderMathInElement(node, mathOptions);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                });
            }
        });
    });

    // 开始观察 document.body 的子节点变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});


