(function oneko() {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  if (isReducedMotion) return;

  // --- 变量定义 ---
  const initialX = window.innerWidth / 2 + 32;
  const initialY = 20;
  let nekoEl = document.createElement("div");
  let nekoPosX = initialX;
  let nekoPosY = initialY;
  let mousePosX = 0;
  let mousePosY = 0;
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;
  let lastFrameTimestamp;
  
  // 活跃状态标记，默认为 false (睡眠状态)
  let active = false; 

  const nekoSpeed = 10;
  const spriteSets = {
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

  function init() {
    const oldNeko = document.getElementById("oneko");
    if (oldNeko) oldNeko.remove();

    nekoEl.id = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "auto";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.zIndex = "999999";
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;

    let nekoFile = "images/oneko.gif"
    const currentScript = document.currentScript || 
                          Array.from(document.getElementsByTagName("script"))
                          .find(s => s.src && s.src.includes("oneko.js"));

    if (currentScript && currentScript.src) {
        nekoFile = currentScript.src.replace(".js", ".gif");
    }
    const curScript = document.currentScript
    if (curScript && curScript.dataset.cat) {
      nekoFile = curScript.dataset.cat
    }
    nekoEl.style.backgroundImage = `url(${nekoFile})`;

    document.body.appendChild(nekoEl);

    document.removeEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousemove", handleMouseMove);

    // 左键点击：唤醒小猫
    nekoEl.addEventListener('click', (e) => {
        e.stopPropagation();
        explodeHearts();
        
        if (!active) {
            active = true;
            idleTime = 0;
            resetIdleAnimation(); 
            setSprite("alert", 0);
        }
    });

    // 【修改点】右键点击 (contextmenu)：重置位置并睡觉
    nekoEl.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // ！！！重要：阻止默认的浏览器右键菜单弹出
        e.stopPropagation();
        
        active = false; // 进入睡眠状态
        nekoPosX = initialX;  // 重置 X
        nekoPosY = initialY;  // 重置 Y
        
        // 立即更新位置
        nekoEl.style.left = `${nekoPosX - 16}px`;
        nekoEl.style.top = `${nekoPosY - 16}px`;
        
        resetIdleAnimation();
    });

    window.requestAnimationFrame(onAnimationFrame);
  }

  function handleMouseMove(event) {
    mousePosX = event.clientX;
    mousePosY = event.clientY;
  }

  function onAnimationFrame(timestamp) {
    if (!nekoEl.isConnected) return;
    if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp
      frame()
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;
    
    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 100) == 0 &&
      idleAnimation == null
    ) {
      let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) avalibleIdleAnimations.push("scratchWallW");
      if (nekoPosY < 32) avalibleIdleAnimations.push("scratchWallN");
      if (nekoPosX > window.innerWidth - 32) avalibleIdleAnimations.push("scratchWallE");
      if (nekoPosY > window.innerHeight - 32) avalibleIdleAnimations.push("scratchWallS");
      idleAnimation = avalibleIdleAnimations[Math.floor(Math.random() * avalibleIdleAnimations.length)];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) resetIdleAnimation();
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) resetIdleAnimation();
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function explodeHearts() {
    const rect = nekoEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 10; i++) {
      const container = document.createElement('div');
      const offsetX = (Math.random() - 0.5) * 50;
      const offsetY = (Math.random() - 0.5) * 50;

      container.style.position = 'fixed';
      container.style.left = `${centerX + offsetX - 16}px`;
      container.style.top = `${centerY + offsetY - 16}px`;
      container.style.zIndex = "9999999";
      container.style.pointerEvents = 'none';

      const heart = document.createElement('div');
      heart.innerText = '❤';
      heart.style.color = '#FF69B4';
      heart.style.fontSize = '2em';
      heart.style.userSelect = 'none';
      heart.style.animation = 'heartBurst 1s ease-out';
      heart.style.animationFillMode='forwards';

      container.appendChild(heart);
      document.body.appendChild(container);

      const animation = heart.animate([
        { transform: 'scale(0)', opacity: 1 },
        { transform: 'scale(1)', opacity: 0 }
      ], {
        duration: 1000,
        easing: 'ease-out',
        fill: 'forwards'
      });

      animation.onfinish = () => {
        container.remove();
      };
    }
  }

  function frame() {
    frameCount += 1;

    // 如果是睡眠状态，强制播放睡觉动画并停止移动
    if (!active) {
        if (idleAnimation !== "sleeping") {
            idleAnimation = "sleeping";
        }
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

    let direction;
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

  init();
})()