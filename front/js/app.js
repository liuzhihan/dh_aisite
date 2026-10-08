(function () {
  const page = document.body.dataset.page || '';
  const navItems = [
    ['index.html', '首页', 'home'],
    ['services.html', '服务项目', 'services'],
    ['mymedia.html', '媒体频道', 'media'],
    ['about.html', '关于大瀚', 'about'],
    ['register.html', '注册', 'register'],
    ['login.html', '登录', 'login']
  ];

  function applySiteNav() {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;
    nav.innerHTML = navItems.map(function (item) {
      return '<a href="' + item[0] + '"' + (page === item[2] ? ' aria-current="page"' : '') + '>' + item[1] + '</a>';
    }).join('');
    const brand = document.querySelector('.brand');
    if (brand) {
      brand.setAttribute('aria-label', '大瀚的AI私坊首页');
      const label = brand.querySelector('span:last-child');
      if (label) label.textContent = '大瀚的AI私坊';
    }
    document.querySelectorAll('.nav-actions .button').forEach(function (button) {
      button.remove();
    });
    document.querySelectorAll('.footer-brand').forEach(function (footerBrand) {
      footerBrand.textContent = '大瀚的AI私坊';
    });
    document.querySelectorAll('.footer-inner > span:not(.footer-brand)').forEach(function (copyright) {
      copyright.textContent = '© 2026 大瀚 · AI 私坊';
    });
  }

  function setupMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.nav-links');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function setupReveal() {
    const revealItems = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      revealItems.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }
    const observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(function (item) { observer.observe(item); });
  }

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    let payload = {};
    try { payload = await response.json(); } catch (error) { payload = {}; }
    if (!response.ok) {
      const err = new Error(payload.error || '请求失败，请稍后再试。');
      err.status = response.status;
      throw err;
    }
    return payload;
  }

  function formatDate(value) {
    if (!value) return '刚刚';
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
  }

  function statusName(status) {
    return ({ 1: '新问题', 2: '正在解决中', 3: '已解决' })[Number(status)] || '新问题';
  }

  function statusClass(status) {
    return ({ 1: 'status-new', 2: 'status-working', 3: 'status-done' })[Number(status)] || 'status-new';
  }

  function renderTasks(tasks) {
    const list = document.querySelector('[data-task-list]');
    const empty = document.querySelector('[data-task-empty]');
    if (!list || !empty) return;
    list.innerHTML = '';
    empty.hidden = tasks.length !== 0;
    tasks.forEach(function (task) {
      const item = document.createElement('article');
      item.className = 'task-item';
      const attachments = (task.attachments || []).map(function (file) {
        return '<a href="/api/problems/' + task.id + '/attachments/' + file.id + '" target="_blank" rel="noopener">' + escapeHtml(file.fileName) + '</a>';
      }).join('、');
      item.innerHTML = '<div><h3>' + escapeHtml(task.question) + '</h3><p>' + escapeHtml(task.purpose) + '</p><div class="task-meta"><span>提交于 ' + formatDate(task.createdAt) + '</span>' + (attachments ? '<span>附件：' + attachments + '</span>' : '<span>暂无附件</span>') + '</div></div><span class="task-status ' + statusClass(task.status) + '"><i class="task-status-dot"></i>' + statusName(task.status) + '</span>';
      list.appendChild(item);
    });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  async function loadTasks() {
    const loading = document.querySelector('[data-task-loading]');
    const errorBox = document.querySelector('[data-task-error]');
    try {
      const data = await requestJson('/api/problems');
      if (loading) loading.hidden = true;
      renderTasks(data.items || []);
    } catch (error) {
      if (loading) loading.hidden = true;
      if (errorBox) { errorBox.textContent = error.message; errorBox.hidden = false; }
    }
  }

  function setAuthView(user) {
    const gate = document.querySelector('[data-auth-gate]');
    const panel = document.querySelector('[data-task-panel]');
    const form = document.querySelector('[data-problem-form]');
    const submit = form && form.querySelector('button[type="submit"]');
    const submitHint = form && form.querySelector('[data-submit-hint]');
    const summary = document.querySelector('[data-auth-summary]');
    if (user) {
      if (gate) gate.hidden = true;
      if (panel) panel.hidden = false;
      if (form) form.hidden = false;
      if (submit) submit.disabled = false;
      if (submitHint) submitHint.hidden = true;
      if (summary) {
        summary.innerHTML = '已登录：' + escapeHtml(user.displayName || user.username || user.email) + ' <button class="button-link auth-logout" type="button" data-logout>退出</button>';
        const logout = summary.querySelector('[data-logout]');
        if (logout) logout.addEventListener('click', async function () {
          logout.disabled = true;
          try { await requestJson('/api/auth/logout', { method: 'POST' }); window.location.reload(); }
          catch (error) { logout.disabled = false; }
        });
      }
      loadTasks();
    } else {
      if (gate) gate.hidden = false;
      if (panel) panel.hidden = true;
      if (form) form.hidden = false;
      if (submit) submit.disabled = true;
      if (submitHint) submitHint.hidden = false;
      if (summary) summary.textContent = '登录后可查看';
    }
  }

  async function getCurrentUser() {
    try { return (await requestJson('/api/auth/me')).user || null; } catch (error) { return null; }
  }

  function setupProblemForm(user) {
    const form = document.querySelector('[data-problem-form]');
    const input = form && form.querySelector('input[type="file"]');
    const filesBox = document.querySelector('[data-selected-files]');
    if (!form || !input) return;
    let selectedFiles = [];
    function renderFiles() {
      if (!filesBox) return;
      filesBox.innerHTML = selectedFiles.map(function (file, index) {
        return '<div class="selected-file"><span>' + escapeHtml(file.name) + ' · ' + Math.ceil(file.size / 1024) + 'KB</span><button type="button" data-remove-file="' + index + '">移除</button></div>';
      }).join('');
    }
    input.addEventListener('change', function () {
      const incoming = Array.from(input.files || []);
      if (selectedFiles.length + incoming.length > 5) { input.value = ''; showFormFeedback('最多上传 5 个附件。', false); return; }
      const allowed = /\.(txt|doc|docx|pdf|xls|xlsx)$/i;
      if (incoming.some(function (file) { return !allowed.test(file.name); })) { input.value = ''; showFormFeedback('仅支持 TXT、DOC、DOCX、PDF、XLS、XLSX 文件。', false); return; }
      if (incoming.some(function (file) { return file.size > 10 * 1024 * 1024; })) { input.value = ''; showFormFeedback('单个附件不能超过 10MB。', false); return; }
      selectedFiles = selectedFiles.concat(incoming);
      input.value = '';
      renderFiles();
      showFormFeedback('', true);
    });
    if (filesBox) filesBox.addEventListener('click', function (event) {
      const button = event.target.closest('[data-remove-file]');
      if (button) { selectedFiles.splice(Number(button.dataset.removeFile), 1); renderFiles(); }
    });
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!user) {
        showFormFeedback('请先注册或登录，再提交这个问题。', false);
        return;
      }
      const submit = form.querySelector('button[type="submit"]');
      const data = new FormData(form);
      selectedFiles.forEach(function (file) { data.append('attachments', file, file.name); });
      data.delete('attachments');
      selectedFiles.forEach(function (file) { data.append('attachments', file, file.name); });
      if (submit) { submit.disabled = true; submit.querySelector('span').textContent = '提交中…'; }
      try {
        await requestJson('/api/problems', { method: 'POST', body: data });
        form.reset(); selectedFiles = []; renderFiles(); showFormFeedback('问题已提交，状态为“新问题”。', true);
        await loadTasks(); document.querySelector('#tasks').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (error) { showFormFeedback(error.message, false); }
      finally { if (submit) { submit.disabled = false; submit.querySelector('span').textContent = '提交问题'; } }
    });
    function showFormFeedback(message, success) {
      const box = document.querySelector('[data-form-feedback]');
      if (!box) return;
      box.textContent = message; box.hidden = !message; box.classList.toggle('success', Boolean(success));
    }
  }

  function setupAuthForm() {
    const form = document.querySelector('[data-auth-form]');
    if (!form) return;
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const feedback = form.querySelector('[data-form-feedback]');
      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      try {
        const mode = form.dataset.authMode;
        const body = Object.fromEntries(new FormData(form).entries());
        await requestJson('/api/auth/' + mode, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        window.location.href = 'index.html#tasks';
      } catch (error) {
        if (feedback) { feedback.textContent = error.message; feedback.hidden = false; feedback.classList.remove('success'); }
      } finally { if (button) button.disabled = false; }
    });
  }

  function boot() {
    applySiteNav(); setupMenu(); setupReveal(); setupAuthForm();
    if (page === 'home') getCurrentUser().then(function (user) { setAuthView(user); setupProblemForm(user); });
  }
  boot();
})();
