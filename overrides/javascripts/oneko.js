// oneko.js: Standalone Clean Version

(function oneko() {
  const nekoEl = document.createElement("div"); // 创建猫的 DOM 元素
  
  const initialX = window.innerWidth / 2 + 32;
  const initialY = 20;
  
  // --- 状态变量定义 ---
  // 保留了你提供的默认值：默认进入睡眠状态
  let nekoPosX = initialX,          
    nekoPosY = initialY,            
    mousePosX = 0,            
    mousePosY = 0,            
    frameCount = 0,           
    idleTime = 0,             
    idleAnimation = "sleeping",     // 默认闲置动画为睡觉
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
    } else {
      // 立即进入睡觉动画
      idleAnimation = "sleeping";
    }
  }

  // --- 初始化函数 ---
  function create() {
    // 读取配置
    variant = parseLocalStorage("variant", "classic");
    kuroNeko = parseLocalStorage("kuroneko", false);
    
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
    nekoEl.style.backgroundImage = `url('https://raw.githubusercontent.com/kyrie25/spicetify-oneko/main/assets/oneko/oneko-${variant}.gif')`;
    nekoEl.style.imageRendering = "pixelated"; 
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.filter = kuroNeko ? "invert(100%)" : "none"; 
    nekoEl.style.zIndex = "9999"; // 提高层级以适应通用网页

    document.body.appendChild(nekoEl);

    // 监听鼠标移动
    window.addEventListener("mousemove", (e) => {
      // 这里的逻辑保留：强制睡眠时不更新目标位置，猫就不会动
      if (forceSleep) return; 

      mousePosX = e.clientX;
      mousePosY = e.clientY;
    });

    window.addEventListener("resize", () => {
        // 窗口大小改变时，不再强制调用 sleep() 重置位置，防止猫跳动
        // 仅在非睡眠状态下更新边界即可（在 frame 中已处理）
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

      const mouseup = () => {
        grabbing = false;
        nudge = true; 
        resetIdleAnimation();
        // 如果被拖拽且放下，如果处于强制睡眠，则保持唤醒状态还是继续睡？
        // 原逻辑是 nudge=true，frame 中会处理。
        // 这里为了体验更好，如果拖拽了，建议暂时解除强制睡眠，或者让它原地继续睡
        // 保持原逻辑：nudge 会在 idle() 中被处理
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
    if (forceSleep) {
      idle();
      return;
    }

    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

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
  
  // 保留一个全局方法用于手动切换皮肤 (因为删除了 UI 弹窗)
  window.onekoSetVariant = function(variantName) {
      if (variants.some(v => v[0] === variantName)) {
          variant = variantName;
          localStorage.setItem("oneko:variant", `"${variant}"`);
          nekoEl.style.backgroundImage = `url('https://raw.githubusercontent.com/kyrie25/spicetify-oneko/main/assets/oneko/oneko-${variant}.gif')`;
      }
  };

})();