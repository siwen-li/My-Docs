// oneko.js: Standalone Clean Version

(function oneko() {
  const nekoEl = document.createElement("div"); // 创建猫的 DOM 元素
  
  let initialX = window.innerWidth / 2 + 32;
  let initialY = 20;
  
  // --- 状态变量定义 ---
  // 保留了你提供的默认值：默认进入睡眠状态
  let nekoPosX = initialX,          
    nekoPosY = initialY,            
    mousePosX = 0,            
    mousePosY = 0,            
    frameCount = 0,           
    idleTime = 0,             
    idleAnimation = "sleeping",     // 默认闲置动画为睡觉
    returningToSleep = false,       // 标记是否正在跑回初始位置 + 
    idleAnimationFrame = 0,   
    forceSleep = true,              // 默认开启强制睡眠
    grabbing = false,         
    grabStop = true,          
    nudge = false,            
    kuroNeko = false,         
    variant = "classic";      

  // 辅助函数：安全解析 LocalStorage 中的配置
  function parseLocalStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(`oneko:${key}`));
      return typeof value === typeof fallback ? value : fallback;
    } catch (e) {
      console.error(e);
      return fallback;
    }
  }

  const nekoSpeed = 10, 
    variants = [
      ["classic", "Classic"],
      ["dog", "Dog"],
      ["tora", "Tora"],
      ["maia", "Maia (maia.crimew.gay)"],
      ["vaporwave", "Vaporwave (nya.rest)"],
    ],
    spriteSets = {
      idle: [[-3, -3]],             
      alert: [[-7, -3]],            
      scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
      scratchWallN: [[0, 0], [0, -1]],
      scratchWallS: [[-7, -1], [-6, -2]],
      scratchWallE: [[-2, -2], [-2, -3]],
      scratchWallW: [[-4, 0], [-4, -1]],
      tired: [[-3, -2]],            
      sleeping: [[-2, 0], [-2, -1]],
      N: [[-1, -2], [-1, -3]],
      NE: [[0, -2], [0, -3]],
      E: [[-3, 0], [-3, -1]],
      SE: [[-5, -1], [-5, -2]],
      S: [[-6, -3], [-7, -2]],
      SW: [[-5, -3], [-6, -1]],
      W: [[-4, -2], [-4, -3]],
      NW: [[-1, 0], [-1, -1]],
    };

  // --- 睡眠逻辑：简化版 ---
  // 不再依赖 Spotify 进度条，仅切换状态
  function sleep() {
    forceSleep = !forceSleep;
    nudge = false;
    localStorage.setItem("oneko:forceSleep", forceSleep);

    if (!forceSleep) {
      resetIdleAnimation();
      returningToSleep = false; // 醒来就不跑了 + 
    } else {
      // 立即进入睡觉动画
      // idleAnimation = "sleeping";   -
      returningToSleep = true;  // 开启睡眠时，标记需要跑回家 +
    }
  }

  // --- 初始化函数 ---
  function create() {
    // 读取配置
    variant = parseLocalStorage("variant", "classic");
    // kuroNeko = parseLocalStorage("kuroneko", false);  // 不再读取本地存储，改为跟随主题
    
    // 如果本地存储有强制睡眠设置，覆盖默认值
    const savedSleep = parseLocalStorage("forceSleep", null);
    if (savedSleep !== null) {
        forceSleep = savedSleep;
        if (forceSleep) idleAnimation = "sleeping";
    }

    if (!variants.some((v) => v[0] === variant)) {
      variant = "classic";
    }

    // 设置 DOM 属性
    nekoEl.id = "oneko";
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "auto"; // 确保鼠标可以点击到猫
    nekoEl.style.backgroundImage = `url('/oneko.gif')`;
    nekoEl.style.imageRendering = "pixelated"; 
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.filter = kuroNeko ? "invert(100%)" : "none"; 
    nekoEl.style.zIndex = "9999"; // 提高层级以适应通用网页



    // ---------------- [新增部分开始] ----------------
    // 定义深色模式检测函数 (适配 Material for MkDocs)
    function updateTheme() {
        // 检查 body 是否有 data-md-color-scheme="slate" (Material 主题深色标记)
        const isDark = document.body.getAttribute("data-md-color-scheme") === "slate" 
                       || document.body.classList.contains("dark");
        kuroNeko = isDark;
        nekoEl.style.filter = kuroNeko ? "invert(100%)" : "none";
    }

    // 1. 初始化时执行一次
    updateTheme();

    // 2. 监听 DOM 变化 (当用户点击网页右上角切换模式时自动变色)
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ["data-md-color-scheme", "class"] 
    });
    // ---------------- [新增部分结束] ----------------

    document.body.appendChild(nekoEl);

    // 监听鼠标移动
    window.addEventListener("mousemove", (e) => {
      // 这里的逻辑保留：强制睡眠时不更新目标位置，猫就不会动
      if (forceSleep) return; 

      mousePosX = e.clientX;
      mousePosY = e.clientY;
    });

    window.addEventListener("resize", () => {
        // --- [修改 2] 窗口变化时更新初始位置 ---
        initialX = window.innerWidth / 2 + 32;
        // initialY = 20; // Y轴如果是固定的20，这里可以不写，或者你也想根据高度变化则在这里改

        // 如果当前是睡觉模式，需要叫醒它让它跑去新的中心点
        if (forceSleep) {
            returningToSleep = true; // 标记需要跑回新位置
            resetIdleAnimation();    // 重置动画（从睡觉变成走路）
        }
    });

    // --- 拖拽猫咪逻辑 ---
    nekoEl.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; 
      grabbing = true;
      let startX = e.clientX;
      let startY = e.clientY;
      let startNekoX = nekoPosX;
      let startNekoY = nekoPosY;
      let grabInterval;

      const mousemove = (e) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > absDeltaY && absDeltaX > 10) {
          setSprite(deltaX > 0 ? "scratchWallW" : "scratchWallE", frameCount);
        } else if (absDeltaY > absDeltaX && absDeltaY > 10) {
          setSprite(deltaY > 0 ? "scratchWallN" : "scratchWallS", frameCount);
        }

        if (grabStop || absDeltaX > 10 || absDeltaY > 10 || Math.sqrt(deltaX ** 2 + deltaY ** 2) > 10) {
          grabStop = false;
          clearTimeout(grabInterval);
          grabInterval = setTimeout(() => {
            grabStop = true;
            nudge = false;
            startX = e.clientX;
            startY = e.clientY;
            startNekoX = nekoPosX;
            startNekoY = nekoPosY;
          }, 150);
        }

        nekoPosX = startNekoX + e.clientX - startX;
        nekoPosY = startNekoY + e.clientY - startY;
        nekoEl.style.left = `${nekoPosX - 16}px`;
        nekoEl.style.top = `${nekoPosY - 16}px`;
      };

      // const mouseup = () => {
      //   grabbing = false;
      //   nudge = true; 
      //   resetIdleAnimation();
      //   // 如果被拖拽且放下，如果处于强制睡眠，则保持唤醒状态还是继续睡？
      //   // 原逻辑是 nudge=true，frame 中会处理。
      //   // 这里为了体验更好，如果拖拽了，建议暂时解除强制睡眠，或者让它原地继续睡
      //   // 保持原逻辑：nudge 会在 idle() 中被处理
      //   window.removeEventListener("mousemove", mousemove);
      //   window.removeEventListener("mouseup", mouseup);
      // };


      const mouseup = () => {      // 拖拽醒来跑回去睡 + 
        grabbing = false;
        // 如果处于强制睡眠，放下后标记“回家”，并唤醒行走动画
        if (forceSleep) {
            returningToSleep = true;
            resetIdleAnimation();
        } else {
            nudge = true; 
            resetIdleAnimation();
        }
        window.removeEventListener("mousemove", mousemove);
        window.removeEventListener("mouseup", mouseup);
      };

      window.addEventListener("mousemove", mousemove);
      window.addEventListener("mouseup", mouseup);
    });

    // 右键点击切换黑猫模式
    nekoEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      kuroNeko = !kuroNeko;
      localStorage.setItem("oneko:kuroneko", kuroNeko);
      nekoEl.style.filter = kuroNeko ? "invert(100%)" : "none";
    });

    // 双击切换睡眠模式
    nekoEl.addEventListener("dblclick", sleep);

    // 启动动画循环
    window.onekoInterval = setInterval(frame, 100);
  }

  function getSprite(name, frame) {
    return spriteSets[name][frame % spriteSets[name].length];
  }

  function setSprite(name, frame) {
    const sprite = getSprite(name, frame);
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  // --- 闲置状态逻辑 ---
  function idle() {
    idleTime += 1;

    // 只有在非强制睡眠时，才随机触发其他闲置动画
    if (idleTime > 10 && Math.floor(Math.random() * 100) == 0 && idleAnimation == null && !forceSleep) {
      let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) avalibleIdleAnimations.push("scratchWallW");
      if (nekoPosY < 32) avalibleIdleAnimations.push("scratchWallN");
      if (nekoPosX > window.innerWidth - 32) avalibleIdleAnimations.push("scratchWallE");
      if (nekoPosY > window.innerHeight - 32) avalibleIdleAnimations.push("scratchWallS");
      idleAnimation = avalibleIdleAnimations[Math.floor(Math.random() * avalibleIdleAnimations.length)];
    }

    if (forceSleep) {
      idleAnimation = "sleeping";
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8 && nudge && forceSleep) {
          setSprite("idle", 0);
          break;
        } else if (nudge) {
          nudge = false;
          resetIdleAnimation();
        }
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192 && !forceSleep) {
          resetIdleAnimation();
        }
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) {
          resetIdleAnimation();
        }
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  // --- 核心动画帧函数 ---
  function frame() {
    frameCount += 1;

    if (grabbing) {
      grabStop && setSprite("alert", 0);
      return;
    }

    // 在普通网页版中，强制睡眠只需原地不动调用 idle() 即可
    // 删除了原版中强制位移到进度条的代码
    // if (forceSleep) {
    //   idle();
    //   return;
    // }

    // const diffX = nekoPosX - mousePosX;
    // const diffY = nekoPosY - mousePosY;
    // const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    // if (distance < nekoSpeed || distance < 48) {
    //   idle();
    //   return;
    // }


    // --- [修改开始] 目标位置判断 ---   强制位移到初始位置睡 + 
    let targetX, targetY;

    if (forceSleep) {
        // 如果正在强制睡眠
        if (returningToSleep) {
            // 如果在“回家”路上，目标设为初始点
            targetX = initialX;
            targetY = initialY;
        } else {
            // 已经到家并在睡觉，原地待命
            idle();
            return;
        }
    } else {
        // 正常非睡眠模式，追随鼠标
        targetX = mousePosX;
        targetY = mousePosY;
    }

    const diffX = nekoPosX - targetX;
    const diffY = nekoPosY - targetY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    // 到达判定
    if (distance < nekoSpeed ) {
        if (returningToSleep) {
            // 刚好跑到了初始位置
            returningToSleep = false; // 停止奔跑状态
            idle(); // 开始睡觉
            return;
        }
    }

      // 正常追随鼠标时的停止距离
    if (!forceSleep && distance < 48) {
          idle();
          return;
    }
    // --- [修改结束] ---

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  create();
  

})();


// oneko.js: https://github.com/adryd325/oneko.js

