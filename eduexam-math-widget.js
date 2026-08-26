(function (window, document) {
  'use strict';

  class EduExamMathWidget {
    constructor(options = {}) {
      this.options = Object.assign({
        targetSelector: 'math-field, textarea, input[type="text"]',
        defaultVisible: false
      }, options);

      this.currentTab = 'basic';
      this.activeElement = null;
      this.init();
    }

    init() {
      if (document.getElementById('eduexam-math-widget-root')) return;

      this.host = document.createElement('div');
      this.host.id = 'eduexam-math-widget-root';
      document.body.appendChild(this.host);
      this.shadow = this.host.attachShadow({ mode: 'open' });

      this.renderStyles();
      this.renderDOM();
      this.setupDraggable();
      this.setupFocusTracking();
      this.switchTab('basic');
    }

    renderStyles() {
      const style = document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Times New Roman', serif, sans-serif; }
        .hidden { display: none !important; }

        #draggableMathWindow {
          position: fixed;
          top: 75px;
          right: 25px;
          z-index: 2147483647;
          background: #f8fafc;
          border: 1px solid #94a3b8;
          border-radius: 6px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
          user-select: none;
          width: auto;
          max-width: 96vw;
        }

        .drag-header {
          cursor: move;
          background: linear-gradient(135deg, #1e1b4b, #312e81);
          color: #ffffff;
          padding: 5px 10px;
          border-top-left-radius: 5px;
          border-top-right-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-weight: 600;
        }

        .header-actions { display: flex; align-items: center; gap: 6px; }
        .header-btn { background: none; border: none; color: #fff; cursor: pointer; font-size: 13px; }
        .header-btn:hover { color: #fde047; }

        /* THANH TAB DANH MỤC iMathEQ */
        .tab-bar {
          display: flex;
          background: #e2e8f0;
          border-bottom: 1px solid #cbd5e1;
          padding: 2px 4px 0 4px;
          gap: 2px;
          overflow-x: auto;
        }
        .tab-btn {
          border: 1px solid transparent;
          border-bottom: none;
          background: transparent;
          padding: 3px 8px;
          font-size: 13px;
          cursor: pointer;
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
          color: #334155;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .tab-btn:hover { background: #cbd5e1; }
        .tab-btn.active {
          background: #ffffff;
          border-color: #cbd5e1;
          border-bottom: 1px solid #ffffff;
          margin-bottom: -1px;
          font-weight: bold;
          color: #1e1b4b;
        }

        /* KHUNG LƯỚI NÚT TOÁN */
        .board-body { padding: 6px; background: #ffffff; }
        .grid-container {
          display: flex;
          gap: 4px;
          align-items: stretch;
          background: #ffffff;
        }
        .btn-group {
          display: grid;
          grid-template-rows: repeat(3, 30px);
          grid-auto-flow: column;
          gap: 2px;
          padding: 0 4px;
          border-right: 1px solid #cbd5e1;
        }
        .btn-group:last-child { border-right: none; }

        .m-btn {
          min-width: 32px;
          height: 30px;
          padding: 0 3px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          color: #0f172a;
          transition: all 0.1s;
        }
        .m-btn:hover {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1d4ed8;
        }
        .m-btn:active { background: #dbeafe; }

        /* Icon placeholder ô vuông xanh */
        .ph {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #93c5fd;
          border: 1px solid #2563eb;
          border-radius: 1px;
          vertical-align: middle;
        }
      `;
      this.shadow.appendChild(style);
    }

    renderDOM() {
      const container = document.createElement('div');
      container.id = 'draggableMathWindow';
      if (!this.options.defaultVisible) container.classList.add('hidden');

      container.innerHTML = `
        <div class="drag-header" id="dragHeader">
          <span>iMathEQ Pro - Bảng Toán Đầy Đủ</span>
          <div class="header-actions">
            <button class="header-btn" id="btnMin" title="Thu nhỏ">−</button>
            <button class="header-btn" id="btnClose" title="Đóng">✕</button>
          </div>
        </div>

        <div class="tab-bar">
          <button class="tab-btn active" data-tab="basic">Cơ bản [□]</button>
          <button class="tab-btn" data-tab="operators">Toán tử ×÷</button>
          <button class="tab-btn" data-tab="relations">Quan hệ &lt;⊃</button>
          <button class="tab-btn" data-tab="arrows">Mũi tên ⇄</button>
          <button class="tab-btn" data-tab="greek">Hy Lạp αβ</button>
          <button class="tab-btn" data-tab="calculus">Tích phân ∑∫</button>
          <button class="tab-btn" data-tab="functions">Hàm số sin</button>
          <button class="tab-btn" data-tab="matrix">Hệ & Ma trận</button>
        </div>

        <div class="board-body" id="boardBody">
          <!-- TAB 1: CƠ BẢN (Chuẩn iMathEQ 3 dòng như ảnh) -->
          <div class="grid-container tab-content" id="tab-basic">
            <!-- Nhóm 1: Phân số & Căn & Mũ -->
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\frac{#?}{#?}" title="Phân số đứng"><div style="display:flex;flex-direction:column;align-items:center;line-height:1;font-size:7px;"><span class="ph"></span><span style="width:12px;height:1px;background:#000;margin:1px 0;"></span><span class="ph"></span></div></button>
              <button type="button" class="m-btn" data-ins="{#?}/{#?}" title="Phân số chéo"><span class="ph" style="transform:scale(0.8)"></span>/<span class="ph" style="transform:scale(0.8)"></span></button>
              <button type="button" class="m-btn" data-ins="\\frac{\\partial #?}{\\partial #?}" title="Đạo hàm"><div style="display:flex;flex-direction:column;align-items:center;line-height:1;font-size:7px;"><span>∂<span class="ph"></span></span><span style="width:14px;height:1px;background:#000;margin:1px 0;"></span><span>∂<span class="ph"></span></span></div></button>
              
              <button type="button" class="m-btn" data-ins="\\sqrt{#?}" title="Căn bậc hai">√<span class="ph"></span></button>
              <button type="button" class="m-btn" data-ins="\\sqrt[#?]{#?}" title="Căn bậc n"><span style="font-size:8px;"><span class="ph" style="transform:scale(0.7)"></span>√<span class="ph"></span></span></button>
              <button type="button" class="m-btn" data-ins="\\sqrt[3]{#?}" title="Căn bậc ba"><span style="font-size:9px;">∛<span class="ph"></span></span></button>

              <button type="button" class="m-btn" data-act="power" title="Lũy thừa"><span class="ph"></span><span class="ph" style="transform:scale(0.7) translateY(-3px);margin-left:-1px;"></span></button>
              <button type="button" class="m-btn" data-act="sub" title="Chỉ số dưới"><span class="ph"></span><span class="ph" style="transform:scale(0.7) translateY(3px);margin-left:-1px;"></span></button>
              <button type="button" class="m-btn" data-ins="{#?}_{#?}^{#?}" title="Cả trên và dưới"><span class="ph"></span><span style="display:inline-flex;flex-direction:column;font-size:7px;"><span class="ph"></span><span class="ph"></span></span></button>
            </div>

            <!-- Nhóm 2: Ngoặc -->
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\left(#?\\right)">(<span class="ph"></span>)</button>
              <button type="button" class="m-btn" data-ins="\\left|#?\\right|">|<span class="ph"></span>|</button>
              <button type="button" class="m-btn" data-ins="\\left(#?\\right]">(&nbsp;]</button>
              
              <button type="button" class="m-btn" data-ins="\\left[#?\\right]">[<span class="ph"></span>]</button>
              <button type="button" class="m-btn" data-ins="\\left\\{#?\\right\\}">{<span class="ph"></span>}</button>
              <button type="button" class="m-btn" data-ins="\\left[#?\\right)">[&nbsp;)</button>

              <button type="button" class="m-btn" data-ins="\\langle#?\\rangle">⟨<span class="ph"></span>⟩</button>
              <button type="button" class="m-btn" data-ins="\\left\\|#?\\right\\|">‖<span class="ph"></span>‖</button>
              <button type="button" class="m-btn" data-ins="\\left\\{#?\\right.">{&nbsp;</button>
            </div>

            <!-- Nhóm 3: Toán tử cơ bản -->
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="+">+</button>
              <button type="button" class="m-btn" data-ins="\\times">×</button>
              <button type="button" class="m-btn" data-ins="/">/</button>

              <button type="button" class="m-btn" data-ins="-">−</button>
              <button type="button" class="m-btn" data-ins="\\div">÷</button>
              <button type="button" class="m-btn" data-ins="\\pm">±</button>

              <button type="button" class="m-btn" data-ins="\\cdot">·</button>
              <button type="button" class="m-btn" data-ins=":">:</button>
              <button type="button" class="m-btn" data-ins="\\mp">∓</button>
            </div>

            <!-- Nhóm 4: So sánh & Tập hợp -->
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\ge">≥</button>
              <button type="button" class="m-btn" data-ins="\\in">∈</button>
              <button type="button" class="m-btn" data-ins="\\cup">∪</button>

              <button type="button" class="m-btn" data-ins="\\le">≤</button>
              <button type="button" class="m-btn" data-ins="\\subset">⊂</button>
              <button type="button" class="m-btn" data-ins="\\cap">∩</button>

              <button type="button" class="m-btn" data-ins="=">=</button>
              <button type="button" class="m-btn" data-ins="\\ne">≠</button>
              <button type="button" class="m-btn" data-ins="\\approx">≈</button>
            </div>

            <!-- Nhóm 5: Ký hiệu phổ biến -->
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\pi">π</button>
              <button type="button" class="m-btn" data-ins="\\infty">∞</button>
              <button type="button" class="m-btn" data-ins="\\varnothing">∅</button>

              <button type="button" class="m-btn" data-ins="\\alpha">α</button>
              <button type="button" class="m-btn" data-ins="\\beta">β</button>
              <button type="button" class="m-btn" data-ins="\\theta">θ</button>

              <button type="button" class="m-btn" data-ins="^{\\circ}">°</button>
              <button type="button" class="m-btn" data-ins="\\Delta">Δ</button>
              <button type="button" class="m-btn" data-ins="\\angle">∠</button>
            </div>
          </div>

          <!-- TAB 2: TOÁN TỬ NÂNG CAO -->
          <div class="grid-container tab-content hidden" id="tab-operators">
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\sum_{#?}^{#?}">∑</button>
              <button type="button" class="m-btn" data-ins="\\prod_{#?}^{#?}">∏</button>
              <button type="button" class="m-btn" data-ins="\\coprod_{#?}^{#?}">∐</button>
              <button type="button" class="m-btn" data-ins="\\bigoplus">⊕</button>
              <button type="button" class="m-btn" data-ins="\\bigotimes">⊗</button>
              <button type="button" class="m-btn" data-ins="\\odot">⊙</button>
            </div>
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\nabla">∇</button>
              <button type="button" class="m-btn" data-ins="\\partial">∂</button>
              <button type="button" class="m-btn" data-ins="\\prime">′</button>
              <button type="button" class="m-btn" data-ins="\\forall">∀</button>
              <button type="button" class="m-btn" data-ins="\\exists">∃</button>
              <button type="button" class="m-btn" data-ins="\\nexists">∄</button>
            </div>
          </div>

          <!-- TAB 3: QUAN HỆ & TẬP HỢP -->
          <div class="grid-container tab-content hidden" id="tab-relations">
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\subset">⊂</button>
              <button type="button" class="m-btn" data-ins="\\supset">⊃</button>
              <button type="button" class="m-btn" data-ins="\\subseteq">⊆</button>
              <button type="button" class="m-btn" data-ins="\\supseteq">⊇</button>
              <button type="button" class="m-btn" data-ins="\\notin">∉</button>
              <button type="button" class="m-btn" data-ins="\\not\\subset">⊄</button>
            </div>
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\equiv">≡</button>
              <button type="button" class="m-btn" data-ins="\\sim">∼</button>
              <button type="button" class="m-btn" data-ins="\\cong">≅</button>
              <button type="button" class="m-btn" data-ins="\\parallel">∥</button>
              <button type="button" class="m-btn" data-ins="\\perp">⊥</button>
              <button type="button" class="m-btn" data-ins="\\propto">∝</button>
            </div>
          </div>

          <!-- TAB 4: MŨI TÊN -->
          <div class="grid-container tab-content hidden" id="tab-arrows">
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\leftarrow">←</button>
              <button type="button" class="m-btn" data-ins="\\rightarrow">→</button>
              <button type="button" class="m-btn" data-ins="\\leftrightarrow">↔</button>
              <button type="button" class="m-btn" data-ins="\\Leftarrow">⇐</button>
              <button type="button" class="m-btn" data-ins="\\Rightarrow">⇒</button>
              <button type="button" class="m-btn" data-ins="\\Leftrightarrow">⇔</button>
            </div>
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\uparrow">↑</button>
              <button type="button" class="m-btn" data-ins="\\downarrow">↓</button>
              <button type="button" class="m-btn" data-ins="\\updownarrow">↕</button>
              <button type="button" class="m-btn" data-ins="\\mapsto">↦</button>
              <button type="button" class="m-btn" data-ins="\\nearrow">↗</button>
              <button type="button" class="m-btn" data-ins="\\searrow">↘</button>
            </div>
          </div>

          <!-- TAB 5: CHỮ HY LẠP ĐẦY ĐỦ -->
          <div class="grid-container tab-content hidden" id="tab-greek">
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\alpha">α</button>
              <button type="button" class="m-btn" data-ins="\\beta">β</button>
              <button type="button" class="m-btn" data-ins="\\gamma">γ</button>
              <button type="button" class="m-btn" data-ins="\\delta">δ</button>
              <button type="button" class="m-btn" data-ins="\\epsilon">ϵ</button>
              <button type="button" class="m-btn" data-ins="\\varepsilon">ε</button>
            </div>
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\theta">θ</button>
              <button type="button" class="m-btn" data-ins="\\lambda">λ</button>
              <button type="button" class="m-btn" data-ins="\\mu">μ</button>
              <button type="button" class="m-btn" data-ins="\\sigma">σ</button>
              <button type="button" class="m-btn" data-ins="\\omega">ω</button>
              <button type="button" class="m-btn" data-ins="\\Omega">Ω</button>
            </div>
          </div>

          <!-- TAB 6: TÍCH PHÂN & NGUYÊN HÀM -->
          <div class="grid-container tab-content hidden" id="tab-calculus">
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\int">∫</button>
              <button type="button" class="m-btn" data-ins="\\int_{#?}^{#?}">∫_a^b</button>
              <button type="button" class="m-btn" data-ins="\\iint">∬</button>
              <button type="button" class="m-btn" data-ins="\\oint">∮</button>
              <button type="button" class="m-btn" data-ins="\\lim_{{#?} \\to {#?}}">lim</button>
              <button type="button" class="m-btn" data-ins="\\vec{#?}">v⃗</button>
            </div>
          </div>

          <!-- TAB 7: HÀM SỐ & LƯỢNG GIÁC -->
          <div class="grid-container tab-content hidden" id="tab-functions">
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\sin\\left(#?\\right)">sin</button>
              <button type="button" class="m-btn" data-ins="\\cos\\left(#?\\right)">cos</button>
              <button type="button" class="m-btn" data-ins="\\tan\\left(#?\\right)">tan</button>
              <button type="button" class="m-btn" data-ins="\\cot\\left(#?\\right)">cot</button>
              <button type="button" class="m-btn" data-ins="\\ln\\left(#?\\right)">ln</button>
              <button type="button" class="m-btn" data-ins="\\log_{#?}\\left(#?\\right)">log</button>
            </div>
          </div>

          <!-- TAB 8: HỆ PHƯƠNG TRÌNH & MA TRẬN -->
          <div class="grid-container tab-content hidden" id="tab-matrix">
            <div class="btn-group">
              <button type="button" class="m-btn" data-ins="\\begin{cases} #? \\\\ #? \\end{cases}" title="Hệ 2 PT">{ 2 dòng</button>
              <button type="button" class="m-btn" data-ins="\\begin{cases} #? \\\\ #? \\\\ #? \\end{cases}" title="Hệ 3 PT">{ 3 dòng</button>
              <button type="button" class="m-btn" data-ins="\\begin{bmatrix} #? & #? \\\\ #? & #? \\end{bmatrix}" title="Ma trận 2x2">[ 2x2 ]</button>
              <button type="button" class="m-btn" data-ins="\\begin{vmatrix} #? & #? \\\\ #? & #? \\end{vmatrix}" title="Định thức 2x2">| 2x2 |</button>
            </div>
          </div>

        </div>
      `;

      this.shadow.appendChild(container);

      // Xử lý chuyển tab
      this.shadow.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
          this.shadow.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.switchTab(btn.getAttribute('data-tab'));
        };
      });

      // Xử lý đóng / mở / thu nhỏ
      this.shadow.getElementById('btnClose').onclick = () => this.hide();
      this.shadow.getElementById('btnMin').onclick = () => {
        this.shadow.getElementById('boardBody').classList.toggle('hidden');
      };

      // Xử lý bấm chèn công thức
      this.shadow.querySelectorAll('.m-btn').forEach(btn => {
        btn.onmousedown = (e) => e.preventDefault();
        btn.onclick = () => {
          const ins = btn.getAttribute('data-ins');
          const act = btn.getAttribute('data-act');
          if (ins) this.insertMath(ins);
          else if (act === 'power') this.insertPower();
          else if (act === 'sub') this.insertSubscript();
        };
      });
    }

    switchTab(tabName) {
      this.shadow.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      const activeEl = this.shadow.getElementById('tab-' + tabName);
      if (activeEl) activeEl.classList.remove('hidden');
    }

    setupFocusTracking() {
      document.addEventListener('focusin', (e) => {
        if (e.target && (e.target.matches(this.options.targetSelector) || e.target.tagName.toLowerCase() === 'math-field')) {
          this.activeElement = e.target;
        }
      });
    }

    insertMath(latexPattern) {
      const el = this.activeElement || document.querySelector('math-field') || document.querySelector(this.options.targetSelector);
      if (!el) return;

      if (typeof el.executeCommand === 'function') {
        el.focus();
        el.executeCommand(['insert', latexPattern]);
      } else if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        el.focus();
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const clean = latexPattern.replace(/#\?/g, '');
        el.value = el.value.substring(0, start) + clean + el.value.substring(end);
        el.selectionStart = el.selectionEnd = start + clean.length;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    insertPower() {
      const el = this.activeElement || document.querySelector('math-field');
      if (el && typeof el.executeCommand === 'function') {
        el.focus();
        if (el.getValue && el.getValue('latex-unstyled').length === 0) {
          el.executeCommand(['insert', '{#?}^{#?}']);
        } else {
          el.executeCommand(['insert', '^{#?}']);
        }
      } else {
        this.insertMath('^2');
      }
    }

    insertSubscript() {
      const el = this.activeElement || document.querySelector('math-field');
      if (el && typeof el.executeCommand === 'function') {
        el.focus();
        if (el.getValue && el.getValue('latex-unstyled').length === 0) {
          el.executeCommand(['insert', '{#?}_{#?}']);
        } else {
          el.executeCommand(['insert', '_{#?}']);
        }
      } else {
        this.insertMath('_1');
      }
    }

    setupDraggable() {
      const win = this.shadow.getElementById('draggableMathWindow');
      const handle = this.shadow.getElementById('dragHeader');
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

      handle.onmousedown = (e) => {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
        document.onmousemove = (e) => {
          e.preventDefault();
          pos1 = pos3 - e.clientX;
          pos2 = pos4 - e.clientY;
          pos3 = e.clientX;
          pos4 = e.clientY;
          win.style.top = (win.offsetTop - pos2) + "px";
          win.style.left = (win.offsetLeft - pos1) + "px";
          win.style.right = 'auto';
        };
      };
    }

    show() { this.shadow.getElementById('draggableMathWindow').classList.remove('hidden'); }
    hide() { this.shadow.getElementById('draggableMathWindow').classList.add('hidden'); }
    toggle() { this.shadow.getElementById('draggableMathWindow').classList.toggle('hidden'); }
  }

  window.EduExamMathWidget = EduExamMathWidget;
  document.addEventListener('DOMContentLoaded', () => {
    window.mathWidgetInstance = new EduExamMathWidget();
  });
})(window, document);