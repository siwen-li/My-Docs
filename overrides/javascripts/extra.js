/* ==========================================
   Zensical-Wcowin 自定义脚本
   ========================================== */

// 即时导航兼容
document$.subscribe(function() {

    document.querySelectorAll('.md-code__button[data-md-type="select"]').forEach(b => b.title = "选择行");

    // 在这里添加你的自定义 JavaScript

    //======== 外部链接新窗口打开=============

    // Open external links in a new window
    function external_new_window() {
        for(let c = document.getElementsByTagName("a"), a = 0; a < c.length; a++) {
            let b = c[a];
            if(b.getAttribute("href") && b.host !== location.host && 
                b.protocol !== "javascript:") {
                b.target = "_blank";
                b.rel = "noopener";
            }
        }
    }

    // Open PDF links in a new window
    function pdf_new_window() {
        if (!document.getElementsByTagName) {
            return false;
        }

        const extensions = ['.pdf', '.doc', '.docx', '.json', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.tar', '.gz', '.7z', '.bz2', '.xz', '.tgz', '.tar.gz'];
        let links = document.getElementsByTagName("a");

        for (let eleLink = 0; eleLink < links.length; eleLink++) {
            let href = links[eleLink].href.toLowerCase(); // Convert href to lowercase for case-insensitive matching

            if (extensions.some(ext => href.endsWith(ext))) {
                links[eleLink].onclick = function() {
                    window.open(this.href);
                    return false;
                }
            }
        }
    }

    function apply_rules() {
        external_new_window();
        pdf_new_window();
    }

    if (typeof document$ !== "undefined") {
        // Compatibility with mkdocs-material's instant loading feature
        document$.subscribe(function() {
            apply_rules();
        });
    } else {
        // For browsers without mkdocs-material's instant loading feature
        document.addEventListener("DOMContentLoaded", function() {
            apply_rules();
        });
    }

    //======== 外部链接新窗口打开=============

 
    // ================= 主页特效 ====================

    // (function() {
    //     // ================= 配置区域 =================
    //     // 1. 设置主页路径
    //     // 如果你的网站部署在根目录 (例如 https://example.com/)，请写 '/'
    //     // 如果部署在子目录 (例如 https://example.com/my-project/)，请写 '/my-project/'
    //     const TARGET_PATH = '/'; // 或者是 window.location.pathname 的首页值

    //     // 2. MkDocs 专属夜间模式检测
    //     function checkNightMode() {
    //         const body = document.body;
            
    //         // --- 针对 MkDocs Material 主题 ---
    //         // 获取当前配色方案
    //         const scheme = body.getAttribute('data-md-color-scheme');
            
    //         // 1. 如果方案明确设置为 'slate' (Material 主题默认的暗色方案名)，则是夜间模式
    //         if (scheme === 'slate') return true;

    //         // 2. 如果方案是 'default' (亮色)，明确返回 false
    //         if (scheme === 'default') return false;

    //         // --- 针对其他 MkDocs 主题 或 系统跟随 ---
    //         // 3. 如果使用的是 'preference' (跟随系统) 或者没有定义 scheme
    //         // 则检查浏览器的系统首选颜色
    //         if ((scheme === 'preference' || !scheme) && 
    //             window.matchMedia && 
    //             window.matchMedia('(prefers-color-scheme: dark)').matches) {
    //             return true;
    //         }

    //         return false;
    //     }
    //     // ===========================================

    //     // 全局变量
    //     let particles = [];
    //     let width, height, canvas, ctx;
    //     let loopId = null; 
    //     let isRunning = false;

    //     // 参数
    //     const fps = 30;
    //     const mspf = Math.floor(1000 / fps);
    //     let focused = true;
    //     let disabled = false;
    //     let lastTime = performance.now();

    //     // ---------------- 核心绘图逻辑 ----------------

    //     function velocity(r) { return 70 / r + 30; }

    //     function sine_component(h, a) { return [2 * Math.PI / h, Math.random() * a, Math.random() * 2 * Math.PI]; }

    //     function calc_sine(components, x) {
    //         let sum = 0;
    //         for (let i = 0; i < components.length; i++) {
    //             const [f, a, p] = components[i];
    //             sum += Math.sin(x * f + p) * a;
    //         }
    //         return sum;
    //     }

    //     function gen_particle() {
    //         let r = Math.random() * 4 + 1;
    //         return {
    //             radius: r,
    //             x: Math.random() * width,
    //             y: -r,
    //             opacity: Math.random(),
    //             sine_components: [sine_component(height, 3), sine_component(height / 2, 2), sine_component(height / 5, 1), sine_component(height / 10, 0.5)],
    //         };
    //     }

    //     function update_pos(dt) {
    //         const n = particles.length;
    //         for (let i = 0; i < n; i++) {
    //             const v = velocity(particles[i].radius);
    //             particles[i].x += calc_sine(particles[i].sine_components, particles[i].y) * v / 5 * dt;
    //             particles[i].y += v * dt;
    //             if (particles[i].y - particles[i].radius > height) particles[i] = gen_particle();
    //         }
    //     }

    //     function create_canvas() {
    //         if (document.getElementById('snow-canvas')) return;
    //         width = window.innerWidth || document.documentElement.clientWidth;
    //         height = window.innerHeight || document.documentElement.clientHeight;
    //         canvas = document.createElement('canvas');
    //         canvas.id = 'snow-canvas';
    //         canvas.width = width;
    //         canvas.height = height;
    //         // z-index 设为 100 左右即可，MkDocs Material 的 header 通常在 100+
    //         canvas.style = 'position: fixed; top: 0; left: 0; overflow: hidden; pointer-events: none; z-index: 50;';
    //         document.body.appendChild(canvas);
    //         ctx = canvas.getContext('2d');
    //     }

    //     function draw() {
    //         if (!ctx) return;
    //         ctx.clearRect(0, 0, width, height);
    //         const n = particles.length;
    //         for (let i = 0; i < n; i++) {
    //             const p = particles[i];
    //             ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
    //             // 发光效果，在深色背景下更好看
    //             ctx.shadowColor = '#80EDF7';
    //             ctx.shadowBlur = 5;
    //             ctx.beginPath();
    //             ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
    //             ctx.fill();
    //         }
    //     }

    //     function loop() {
    //         if (!isRunning) return;
    //         const dt = (performance.now() - lastTime) / 1000;
    //         lastTime = performance.now();
    //         if (particles.length < 120 && Math.random() < 0.1) particles.push(gen_particle());
    //         update_pos(dt);
    //         draw();
    //         if (focused && !disabled && isRunning) loopId = setTimeout(loop, mspf);
    //     }

    //     // ---------------- 事件监听 ----------------

    //     const handleResize = () => {
    //         width = window.innerWidth || document.documentElement.clientWidth;
    //         height = window.innerHeight || document.documentElement.clientHeight;
    //         if (canvas) { canvas.width = width; canvas.height = height; }
    //     };
    //     const handleFocus = () => {
    //         if (!isRunning) return;
    //         focused = true; lastTime = performance.now(); loop();
    //     };
    //     const handleBlur = () => { focused = false; clearTimeout(loopId); };
        
    //     // Ctrl+S 快捷键开关
    //     const handleKeydown = (e) => {
    //         if (e.ctrlKey && e.key == 's') {
    //             e.preventDefault();
    //             disabled = !disabled;
    //             if (canvas) canvas.style.display = disabled ? 'none' : 'block';
    //             if (!disabled) { lastTime = performance.now(); loop(); }
    //         }
    //     };

    //     // ---------------- 核心控制逻辑 ----------------

    //     function startSnow() {
    //         if (isRunning) return;
    //         isRunning = true;
    //         focused = true;
    //         particles = [];
    //         create_canvas();
    //         window.addEventListener('resize', handleResize);
    //         window.addEventListener('focus', handleFocus);
    //         window.addEventListener('blur', handleBlur);
    //         window.addEventListener('keydown', handleKeydown);
    //         lastTime = performance.now();
    //         loop();
    //     }

    //     function stopSnow() {
    //         if (!isRunning) return;
    //         isRunning = false;
    //         clearTimeout(loopId);
    //         if (canvas) { canvas.remove(); canvas = null; ctx = null; }
    //         window.removeEventListener('resize', handleResize);
    //         window.removeEventListener('focus', handleFocus);
    //         window.removeEventListener('blur', handleBlur);
    //         window.removeEventListener('keydown', handleKeydown);
    //     }

    //     // 检查是否应该运行 (必须在主页 且 必须是夜间模式)
    //     function checkStateAndExecute() {
    //         // 处理路径：MkDocs 有时 URL 末尾带有 index.html，有时没有
    //         let path = window.location.pathname;
    //         if (path.endsWith('index.html')) {
    //             path = path.replace('index.html', '');
    //         }

    //         const isHomePage = (path === TARGET_PATH);
    //         const isNight = checkNightMode();

    //         if (isHomePage && isNight) {
    //             startSnow();
    //         } else {
    //             stopSnow();
    //         }
    //     }

    //     // 1. 初始化检查
    //     checkStateAndExecute();

    //     // 2. 监听 URL 变化
    //     window.addEventListener('popstate', checkStateAndExecute);

    //     // 3. 轮询检查 (检测主题切换)
    //     // MkDocs Material 切换主题时不会刷新页面，而是修改 DOM 属性
    //     // 使用 setInterval 可以快速响应主题变化
    //     setInterval(checkStateAndExecute, 500); 

    // })();
    
    // ================ 主页特效结束 ====================


});
