---
hide: path 
---

# 目录


<div class="grid cards" markdown>

-   :lucide-brain:{ .lg .middle } __判断推理__

    ---

	- [归因论证](判断推理/归因论证.md) 
    - [一般质疑](判断推理/一般质疑.md)
    - [支持、前提、解释](判断推理/支持、前提、解释.md)
    - [逻辑基础](判断推理/逻辑基础.md)
    - [推出推理](判断推理/推出推理.md)
    - [分析推理](判断推理/分析推理.md)
    - [定义判断](判断推理/定义判断.md)
    - [类比推理](判断推理/类比推理.md)
    - [图形推理-平面类](判断推理/图形推理-平面类.md)
    - [图形推理-特殊类](判断推理/图形推理-特殊类.md)
    - [图形推理-空间类](判断推理/图形推理-空间类.md)


-   :lucide-chart-no-axes-combined:{ .lg .middle } __资料分析__

    ---

	- [基础知识](资料分析/基础知识.md)
	- [速算技巧](资料分析/速算技巧.md)
	- [ABRX 类](资料分析/ABRX 类.md)
	- [比重类](资料分析/比重类.md)
	- [盐水类](资料分析/盐水类.md)
	- [比较类](资料分析/比较类.md)
	- [平均类](资料分析/平均类.md)
	- [特殊考点](资料分析/特殊考点.md)


-   :lucide-book-open-text:{ .lg .middle } __言语理解__

    ---

	- [言语理解与表达](言语理解/言语理解与表达.md)
	- [片段阅读](言语理解/片段阅读.md)
	- [逻辑填空](言语理解/逻辑填空.md)
	- [词语积累](言语理解/词语积累.md)


-   :lucide-flag:{ .lg .middle } __其他__

    ---
	
	- [数量关系](数量关系/数量关系.md)
	- [常识、政治理论](常识、政治理论/常识、政治理论.md)

  


</div>

<!-- <style>
    .md-typeset .grid {
        grid-template-columns: none;
    }
</style> -->

<style>
/* =========================================
   MkDocs Grid Cards: 强制 8 行转列 (Grid版)
   ========================================= */

/* 1. 基础设置：给列表预留一点左边距 */
.md-typeset .grid.cards > ul > li > ul {
    margin-top: 0.5em;
    padding-left: 0.5em; 
}

/* 2. 核心逻辑：只有超过 8 个元素的列表才启用 Grid */
.md-typeset .grid.cards > ul > li > ul:has(li:nth-child(8)) {
    display: grid;
    
    /* 关键命令：垂直方向优先填充！ */
    grid-auto-flow: column;
    
    /* 关键命令：强制设定 8 行 (每行高度根据内容自适应) */
    /* 这样填满 8 行后，第 9 个元素就会被迫挤到第二列去 */
    grid-template-rows: repeat(8, min-content);
    
    /* 设定两列等宽 */
    grid-template-columns: 1fr 1fr;
    
    /* 间距：行间距 0.2rem，列间距 2rem */
    /* gap: 0.1rem 1rem; */

}

/* 3. 修复小圆点 (因为 Grid 布局会吞掉默认的列表圆点) */
.md-typeset .grid.cards > ul > li > ul:has(li:nth-child(8)) li {
    display: flex; /* 让伪元素圆点和文字对齐 */
    align-items: baseline; /* 文字基线对齐 */
    margin-left: 0;
    margin-bottom: .5em;
}

/* 手动画一个圆点 */
.md-typeset .grid.cards > ul > li > ul:has(li:nth-child(8)) li::before {
    content: "•";           /* 实心圆点字符 */
	/* font-size: 18px; */
    color: var(--md-default-fg-color); /* 跟随主题色 */
    font-weight: bold;
    margin-right: 0.5em;    /* 圆点和文字的距离 */
    flex-shrink: 0;         /* 防止圆点被挤压 */
}

/* 4. 手机端适配：屏幕窄时取消 Grid，变回普通单列 */
@media screen and (max-width: 800px) {
    .md-typeset .grid.cards > ul > li > ul:has(li:nth-child(8)) {
        display: block; /* 变回普通块级元素 */
    }
    /* 手机端不需要手画圆点，恢复默认圆点 */
    .md-typeset .grid.cards > ul > li > ul:has(li:nth-child(8)) li {
        display: list-item;
        list-style-type: disc;
        list-style-position: outside;
        margin-left: 1.2em; /* 恢复左缩进 */
		margin-bottom: .5em;
    }
    .md-typeset .grid.cards > ul > li > ul:has(li:nth-child(8)) li::before {
        content: none; /* 隐藏手画圆点 */
    }
}
</style>