/* docs/javascripts/todo.js */
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("mkdocs-todo-fab")) return;

  // --- 图标资源 (SVG Paths) ---
  const ICONS = {
    list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    plus: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    empty: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>`
  };

  // --- 构建 DOM ---
  const body = document.body;
  
  const fab = document.createElement("button");
  fab.id = "mkdocs-todo-fab";
  fab.innerHTML = ICONS.list;

  const panel = document.createElement("div");
  panel.id = "mkdocs-todo-panel";
  panel.innerHTML = `
    <div class="todo-header">
      <div class="todo-title">📝 待办事项</div>
      <div class="todo-count" id="todo-count">0/0</div>
    </div>
    <ul class="todo-list" id="todo-list"></ul>
    <div class="todo-footer">
      <input type="text" id="todo-input" placeholder="添加新任务..." autocomplete="off">
      <button id="todo-add-btn">${ICONS.plus}</button>
    </div>
  `;

  body.appendChild(panel);
  body.appendChild(fab);

  // --- 逻辑处理 ---
  const listEl = document.getElementById("todo-list");
  const inputEl = document.getElementById("todo-input");
  const countEl = document.getElementById("todo-count");
  const STORAGE_KEY = 'mkdocs-awesome-todo';

  let todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  // 更新视图
  function render() {
    listEl.innerHTML = "";
    
    if (todos.length === 0) {
      listEl.innerHTML = `
        <div class="todo-empty">
          ${ICONS.empty}
          <p>所有任务已完成！</p>
        </div>`;
    } else {
      todos.forEach(todo => {
        const li = document.createElement("li");
        li.className = `todo-item ${todo.done ? "done" : ""}`;
        
        // 创建复选框
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "todo-checkbox";
        checkbox.checked = todo.done;
        checkbox.onclick = (e) => {
          e.stopPropagation(); // 防止触发li点击
          toggleTodo(todo.id);
        };

        // 创建文本
        const text = document.createElement("span");
        text.className = "todo-text";
        text.textContent = todo.text;
        text.onclick = (e) => { 
          // 修复点：这里也要阻止冒泡，虽然下面的 panel 监听器是双重保险
          e.stopPropagation(); 
          toggleTodo(todo.id); 
        };

        // 创建删除按钮
        const btn = document.createElement("button");
        btn.className = "todo-delete";
        btn.innerHTML = ICONS.trash;
        btn.onclick = (e) => {
          e.stopPropagation();
          deleteTodo(todo.id);
        };

        li.append(checkbox, text, btn);
        listEl.appendChild(li);
      });
    }

    const done = todos.filter(t => t.done).length;
    countEl.textContent = `${done}/${todos.length}`;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  // 操作函数
  function addTodo() {
    const text = inputEl.value.trim();
    if (!text) return;
    todos.push({ id: Date.now(), text, done: false });
    inputEl.value = "";
    render();
    setTimeout(() => listEl.scrollTop = listEl.scrollHeight, 50);
  }

  function toggleTodo(id) {
    const t = todos.find(x => x.id === id);
    if (t) t.done = !t.done;
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter(x => x.id !== id);
    render();
  }

  // --- 事件绑定 ---

  // 0. 核心修复：阻止面板内部的点击事件冒泡到 document
  // 这样无论点击面板里的哪里（文字、空白、输入框），都不会触发 document 的关闭逻辑
  panel.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  
  // 1. 打开/关闭 FAB 按钮
  fab.addEventListener("click", (e) => {
    e.stopPropagation(); // 阻止冒泡
    const isActive = panel.classList.contains("active");
    
    if (isActive) {
      panel.classList.remove("active");
      fab.innerHTML = ICONS.list;
    } else {
      panel.classList.add("active");
      fab.innerHTML = ICONS.close;
      setTimeout(() => inputEl.focus(), 100);
    }
  });

  // 2. 点击外部关闭
  document.addEventListener("click", (e) => {
    // 只有点击面板和按钮**之外**的地方，才关闭
    if (panel.classList.contains("active") && !panel.contains(e.target) && !fab.contains(e.target)) {
      panel.classList.remove("active");
      fab.innerHTML = ICONS.list;
    }
  });

  // 3. 添加任务交互
  document.getElementById("todo-add-btn").onclick = addTodo;
  inputEl.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTodo();
  });

  // 初始化
  render();
});