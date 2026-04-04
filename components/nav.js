// 巴菲特知识库 - 全局导航组件（推移式全屏导航）

// === 全局语言偏好管理 ===
// 优先级：URL参数 > localStorage > 默认中文
export function getGlobalLang() {
    // 1. 检查 URL 参数
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang === 'en' || urlLang === 'zh') {
        localStorage.setItem('buffett-lang', urlLang);
        return urlLang;
    }
    // 2. 检查 localStorage
    const savedLang = localStorage.getItem('buffett-lang');
    if (savedLang === 'en' || savedLang === 'zh') {
        return savedLang;
    }
    // 3. 默认中文
    return 'zh';
}

export function setGlobalLang(lang) {
    if (lang === 'en' || lang === 'zh') {
        localStorage.setItem('buffett-lang', lang);
    }
}

// === 页面跳转过渡动画系统 ===
let transitionBar = null;
let transitionOverlay = null;
let isTransitioning = false;

function createTransitionBar() {
    if (transitionBar) return transitionBar;
    transitionBar = document.createElement('div');
    transitionBar.className = 'page-transition-bar';
    document.body.appendChild(transitionBar);
    return transitionBar;
}

function createTransitionOverlay() {
    if (transitionOverlay) return transitionOverlay;
    transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'page-transition-overlay';
    transitionOverlay.innerHTML = `
        <div class="transition-loader">
            <div class="transition-dots">
                <span></span><span></span><span></span>
            </div>
            <div class="transition-loader-text">加载中...</div>
        </div>
    `;
    document.body.appendChild(transitionOverlay);
    return transitionOverlay;
}

// 判断是否为站内链接
function isSiteLink(href) {
    if (!href) return false;
    // 排除外部链接、锚点、javascript:、mailto: 等
    if (href.startsWith('http') && !href.includes(window.location.host)) return false;
    if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    if (href === '#' || href.startsWith('#')) return false;
    // 必须是 .html 页面
    try {
        const resolved = new URL(href, window.location.href).pathname;
        return resolved.endsWith('.html');
    } catch (e) {
        return false;
    }
}

// 带过渡动画的页面跳转（预加载模式）
function navigateWithTransition(href) {
    if (isTransitioning) return;
    // 如果目标就是当前页面，不跳转
    const targetPath = new URL(href, window.location.href).pathname;
    if (targetPath === window.location.pathname) return;

    isTransitioning = true;
    const bar = createTransitionBar();
    const overlay = createTransitionOverlay();
    const pageWrapper = document.getElementById('page-wrapper');

    // 标记跳转目标到 sessionStorage，供目标页面检测
    sessionStorage.setItem('buffett-page-transition', 'slide-in');

    // 第一阶段：进度条快速推进到 30%（表示开始加载）
    bar.style.transition = 'none';
    bar.style.width = '0%';
    bar.classList.add('active');

    requestAnimationFrame(() => {
        bar.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        bar.style.width = '30%';
    });

    // 同时启动页面淡出动画
    if (pageWrapper) {
        pageWrapper.classList.add('page-exit');
    }

    // 使用 fetch 预加载目标页面
    let pageReady = false;
    const preloadPromise = fetch(href, { mode: 'same-origin', credentials: 'same-origin' })
        .then(resp => {
            if (!resp.ok) throw new Error('Load failed');
            return resp.text();
        })
        .then(() => {
            pageReady = true;
        })
        .catch(() => {
            pageReady = true; // 即使失败也继续跳转
        });

    // 第二阶段：页面淡出后显示过渡遮罩
    setTimeout(() => {
        overlay.classList.add('active');
        bar.style.transition = 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        bar.style.width = '65%';
    }, 250);

    // 第三阶段：缓慢推进到 90%
    setTimeout(() => {
        if (!pageReady) {
            bar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
            bar.style.width = '90%';
        }
    }, 1000);

    // 等待预加载完成后跳转
    preloadPromise.then(() => {
        // 进度条快速推到 100%
        bar.style.transition = 'width 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
        bar.style.width = '100%';

        // 确保最少展示过渡遮罩 300ms，避免闪烁
        const minDelay = overlay.classList.contains('active') ? 150 : 350;
        setTimeout(() => {
            window.location.href = href;
        }, minDelay);
    });

    // 超时保护：5秒后强制跳转
    setTimeout(() => {
        if (isTransitioning) {
            window.location.href = href;
        }
    }, 5000);
}

// 初始化页面过渡系统：拦截所有站内链接
function initPageTransition() {
    createTransitionBar();
    createTransitionOverlay();

    // 使用事件委托拦截所有 <a> 标签点击
    document.addEventListener('click', (e) => {
        // 查找最近的 <a> 元素
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // 排除 target="_blank" 的链接
        if (link.target === '_blank') return;

        // 排除导航面板内的链接（它们有自己的处理逻辑）
        if (link.closest('.nav-panel')) return;

        // 判断是否为站内链接
        if (isSiteLink(href)) {
            e.preventDefault();
            e.stopPropagation();
            navigateWithTransition(href);
        }
    }, true);

    // 页面加载时：检测是否需要播放滑入动画
    const hasTransition = sessionStorage.getItem('buffett-page-transition');
    if (hasTransition === 'slide-in') {
        sessionStorage.removeItem('buffett-page-transition');
        const pageWrapper = document.getElementById('page-wrapper');
        if (pageWrapper) {
            // 禁用 page-enter 动画，使用滑入动画替代
            const pageEnterEl = pageWrapper.querySelector('.page-enter');
            if (pageEnterEl) {
                pageEnterEl.style.animation = 'none';
                pageEnterEl.style.opacity = '1';
                pageEnterEl.style.transform = 'none';
            }
            pageWrapper.classList.add('page-enter-slide');
            pageWrapper.addEventListener('animationend', () => {
                pageWrapper.classList.remove('page-enter-slide');
            }, { once: true });
        }

        // 清除进度条和遮罩的残留状态
        requestAnimationFrame(() => {
            const bar = document.querySelector('.page-transition-bar');
            if (bar) {
                bar.style.transition = 'opacity 0.3s ease';
                bar.classList.remove('active');
                bar.style.width = '0%';
            }
            const overlay = document.querySelector('.page-transition-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
        });
    } else {
        // 首次进入页面（非过渡跳转），确保内容立即可见，避免白屏
        const pageWrapper = document.getElementById('page-wrapper');
        if (pageWrapper) {
            pageWrapper.style.opacity = '1';
        }
    }
}

export function createNav(activePage = '') {
    const _lang = getGlobalLang();
    const _isEn = _lang === 'en';

    // === 创建导航面板（左侧全屏导航） ===
    const navPanel = document.createElement('div');
    navPanel.className = 'nav-panel';
    navPanel.id = 'nav-panel';
    navPanel.innerHTML = `
        <div class="nav-panel-inner">
            <div class="nav-panel-header">
                <a href="/index.html" style="display: flex; align-items: center; gap: 12px; text-decoration: none;">
                    <div style="width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--accent-gradient); flex-shrink: 0;">
                        <span style="font-size:18px; color: #fff;"><i class="ri-bar-chart-box-line"></i></span>
                    </div>
                    <span style="font-family: var(--font-serif); font-weight: 600; font-size: 20px; color: var(--text-primary); letter-spacing: -0.01em;">Buffett Wisdom</span>
                </a>
                <button class="nav-panel-close" id="nav-panel-close" aria-label="${_isEn ? 'Close navigation' : '关闭导航'}">
                    <i class="ri-close-line"></i>
                </button>
            </div>
            <nav class="nav-panel-links">
                <a href="/index.html" class="nav-panel-link ${activePage === 'home' ? 'active' : ''}" data-index="0">
                    <div class="nav-panel-link-icon"><i class="ri-home-4-line"></i></div>
                    <div class="nav-panel-link-text">
                        <span class="nav-panel-link-title">${_isEn ? 'Home' : '首页'}</span>
                        <span class="nav-panel-link-desc">${_isEn ? 'Buffett Investment Wisdom' : '巴菲特投资智慧知识库'}</span>
                    </div>
                    <i class="ri-arrow-right-s-line nav-panel-link-arrow"></i>
                </a>
                <a href="/letters.html" class="nav-panel-link ${activePage === 'letters' ? 'active' : ''}" data-index="1">
                    <div class="nav-panel-link-icon"><i class="ri-file-text-line"></i></div>
                    <div class="nav-panel-link-text">
                        <span class="nav-panel-link-title">${_isEn ? 'Letters' : '股东信'}</span>
                        <span class="nav-panel-link-desc">${_isEn ? '1957–Present · Bilingual' : '1957年至今 · 中英双语'}</span>
                    </div>
                    <i class="ri-arrow-right-s-line nav-panel-link-arrow"></i>
                </a>
                <a href="/meetings.html" class="nav-panel-link ${activePage === 'meetings' ? 'active' : ''}" data-index="2">
                    <div class="nav-panel-link-icon"><i class="ri-mic-line"></i></div>
                    <div class="nav-panel-link-text">
                        <span class="nav-panel-link-title">${_isEn ? 'Meetings' : '股东大会'}</span>
                        <span class="nav-panel-link-desc">${_isEn ? 'Annual Meeting Transcripts & Videos' : '历年发言实录与视频'}</span>
                    </div>
                    <i class="ri-arrow-right-s-line nav-panel-link-arrow"></i>
                </a>
                <a href="/glossary.html" class="nav-panel-link ${activePage === 'glossary' ? 'active' : ''}" data-index="3">
                    <div class="nav-panel-link-icon"><i class="ri-book-2-line"></i></div>
                    <div class="nav-panel-link-text">
                        <span class="nav-panel-link-title">${_isEn ? 'Glossary' : '名词解释'}</span>
                        <span class="nav-panel-link-desc">${_isEn ? 'Investment Terms Dictionary' : '投资术语词典'}</span>
                    </div>
                    <i class="ri-arrow-right-s-line nav-panel-link-arrow"></i>
                </a>
                <a href="/people.html" class="nav-panel-link ${activePage === 'people' ? 'active' : ''}" data-index="4">
                    <div class="nav-panel-link-icon"><i class="ri-user-star-line"></i></div>
                    <div class="nav-panel-link-text">
                        <span class="nav-panel-link-title">${_isEn ? 'People' : '人物简介'}</span>
                        <span class="nav-panel-link-desc">${_isEn ? 'Buffett & Munger' : '巴菲特 & 芒格'}</span>
                    </div>
                    <i class="ri-arrow-right-s-line nav-panel-link-arrow"></i>
                </a>
                <a href="/games.html" class="nav-panel-link ${activePage === 'games' ? 'active' : ''}" data-index="5">
                    <div class="nav-panel-link-icon"><i class="ri-gamepad-line"></i></div>
                    <div class="nav-panel-link-text">
                        <span class="nav-panel-link-title">${_isEn ? 'Games' : '下个棋'}</span>
                        <span class="nav-panel-link-desc">${_isEn ? 'Relax, Focus, Flow' : '放松，专注，自然'}</span>
                    </div>
                    <i class="ri-arrow-right-s-line nav-panel-link-arrow"></i>
                </a>
            </nav>
            <div class="nav-panel-footer">
                <button id="nav-theme-toggle" class="nav-panel-theme-btn">
                    <i class="ri-moon-line"></i> <span>${_isEn ? 'Toggle Theme' : '切换主题'}</span>
                </button>
                <p style="color: var(--text-tertiary); font-size: 11px; margin-top: 16px; text-align: center;">
                    由 <a href="https://with.woa.com/" style="color: #8B5CF6;" target="_blank">With</a> 通过自然语言生成
                </p>
            </div>
        </div>
    `;

    // === 创建顶部工具栏（仅含汉堡按钮和主题切换） ===
    const topBar = document.createElement('div');
    topBar.className = 'top-bar';
    topBar.id = 'top-bar';
    topBar.innerHTML = `
        <div class="top-bar-inner">
            <button class="hamburger-btn" id="hamburger-btn" aria-label="打开导航">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </button>
            <a href="/index.html" class="top-bar-logo" style="text-decoration: none;">
                <div style="width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--accent-gradient); flex-shrink: 0;">
                    <span style="font-size:14px; color: #fff;"><i class="ri-bar-chart-box-line"></i></span>
                </div>
                <span style="font-family: var(--font-serif); font-weight: 600; font-size: 16px; color: var(--text-primary); letter-spacing: -0.01em;">Buffett Wisdom</span>
            </a>
            <button id="theme-toggle" class="theme-toggle-btn" title="切换主题">
                <i class="ri-moon-line"></i>
            </button>
        </div>
    `;

    // === 将页面现有内容包裹到 page-wrapper 中 ===
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'page-wrapper';
    pageWrapper.id = 'page-wrapper';

    // 将 body 中所有现有子节点移入 pageWrapper
    while (document.body.firstChild) {
        pageWrapper.appendChild(document.body.firstChild);
    }

    // 按顺序插入：导航面板 -> 顶部栏（独立于page-wrapper） -> 页面包裹器
    document.body.appendChild(navPanel);
    document.body.appendChild(topBar);       // top-bar 直接挂在 body 下，避免 page-wrapper 的 will-change:transform 破坏 fixed 定位
    document.body.appendChild(pageWrapper);

    // === 交互逻辑 ===
    const hamburger = document.getElementById('hamburger-btn');
    const navPanelEl = document.getElementById('nav-panel');
    const pageWrapperEl = document.getElementById('page-wrapper');
    const closeBtn = document.getElementById('nav-panel-close');

    let isNavOpen = false;

    function openNav() {
        if (isNavOpen) return;
        isNavOpen = true;
        document.body.classList.add('nav-open');
        document.body.style.overflow = 'hidden';

        // 逐个显示导航链接
        const links = navPanelEl.querySelectorAll('.nav-panel-link');
        links.forEach((link, i) => {
            setTimeout(() => {
                link.classList.add('visible');
            }, 80 + i * 50);
        });
    }

    function closeNav() {
        if (!isNavOpen) return;
        isNavOpen = false;
        document.body.classList.remove('nav-open');
        document.body.style.overflow = '';

        // 重置链接动画
        const links = navPanelEl.querySelectorAll('.nav-panel-link');
        links.forEach(link => {
            link.classList.remove('visible');
        });
    }

    // 汉堡按钮点击
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isNavOpen) {
            closeNav();
        } else {
            openNav();
        }
    });

    // 关闭按钮
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeNav();
    });

    // 点击右侧模糊区域关闭
    pageWrapperEl.addEventListener('click', (e) => {
        if (isNavOpen) {
            e.preventDefault();
            e.stopPropagation();
            closeNav();
        }
    });

    // 导航链接点击：先关闭导航，再跳转（带过渡动画）
    const navLinks = navPanelEl.querySelectorAll('.nav-panel-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // 如果是当前页面，只关闭导航
            if (link.classList.contains('active')) {
                e.preventDefault();
                closeNav();
                return;
            }
            // 否则先播放关闭动画，再使用过渡跳转
            e.preventDefault();
            closeNav();
            // 等导航关闭动画完成后，启动页面过渡
            setTimeout(() => {
                // 重置 isTransitioning 以确保可以跳转
                isTransitioning = false;
                navigateWithTransition(href);
            }, 350);
        });
    });

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isNavOpen) {
            closeNav();
        }
    });

    // 主题切换
    initTheme();

    // 初始化全局交互动画
    initGlobalAnimations();

    // 初始化页面跳转过渡系统
    initPageTransition();
}

export function initTheme() {
    const saved = localStorage.getItem('buffett-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    setTimeout(() => {
        // 顶部栏主题按钮
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTheme();
            });
        }
        // 导航面板内主题按钮
        const navBtn = document.getElementById('nav-theme-toggle');
        if (navBtn) {
            navBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTheme();
            });
        }
    }, 0);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('buffett-theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    setTimeout(() => {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.innerHTML = theme === 'dark' ? '<i class="ri-moon-line"></i>' : '<i class="ri-sun-line"></i>';
        }
        const navBtn = document.getElementById('nav-theme-toggle');
        if (navBtn) {
            navBtn.innerHTML = theme === 'dark'
                ? '<i class="ri-moon-line"></i> <span>切换主题</span>'
                : '<i class="ri-sun-line"></i> <span>切换主题</span>';
        }
    }, 0);
}

// 全局交互动画增强
function initGlobalAnimations() {
    const isTouchDevice = window.matchMedia('(hover: none)').matches;

    if (!isTouchDevice) {
        // === 鼠标光标跟随光晕 ===
        const cursorGlow = document.createElement('div');
        cursorGlow.className = 'cursor-glow';
        document.getElementById('page-wrapper').appendChild(cursorGlow);

        let cursorX = 0, cursorY = 0, glowX = 0, glowY = 0;

        document.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            if (!cursorGlow.classList.contains('visible')) {
                cursorGlow.classList.add('visible');
            }
        });

        document.addEventListener('mouseleave', () => {
            cursorGlow.classList.remove('visible');
        });

        function animateCursorGlow() {
            glowX += (cursorX - glowX) * 0.08;
            glowY += (cursorY - glowY) * 0.08;
            cursorGlow.style.left = glowX + 'px';
            cursorGlow.style.top = glowY + 'px';
            requestAnimationFrame(animateCursorGlow);
        }
        animateCursorGlow();

        // === 磁性按钮效果 ===
        document.querySelectorAll('.btn-primary, .btn-ghost').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px) scale(1.02)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
                btn.style.transition = 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
            });
            btn.addEventListener('mouseenter', () => {
                btn.style.transition = 'all 0.12s ease-out';
            });
        });

        // === 卡片3D倾斜 + 光泽跟随 ===
        document.querySelectorAll('.card').forEach(card => {
            const shine = document.createElement('div');
            shine.className = 'card-shine';
            card.appendChild(shine);

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                const rotateX = (y - 0.5) * -6;
                const rotateY = (x - 0.5) * 6;
                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
                card.style.setProperty('--mouse-x', (x * 100) + '%');
                card.style.setProperty('--mouse-y', (y * 100) + '%');
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.transition = 'all 0.55s cubic-bezier(0.4, 0, 0.2, 1)';
            });
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'all 0.1s ease-out';
            });
        });
    }

    // === 涟漪点击效果 ===
    document.querySelectorAll('.btn-primary, .btn-ghost, .filter-btn, .tab-btn').forEach(el => {
        el.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.4;
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // === 滚动进度条 ===
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.width = '0%';
    document.body.appendChild(progressBar);

    // === 导航栏滚动效果 + 进度条 + 缩窄效果 ===
    const topBarEl = document.getElementById('top-bar');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
                progressBar.style.width = scrollPercent + '%';
                if (topBarEl) {
                    if (scrollY > 60) {
                        topBarEl.classList.add('top-bar-scrolled');
                        topBarEl.classList.add('top-bar-compact');
                    } else if (scrollY > 20) {
                        topBarEl.classList.add('top-bar-scrolled');
                        topBarEl.classList.remove('top-bar-compact');
                    } else {
                        topBarEl.classList.remove('top-bar-scrolled');
                        topBarEl.classList.remove('top-bar-compact');
                    }
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // === 首页hero标题闪光效果 ===
    const heroTitle = document.querySelector('.hero-title .text-gradient');
    if (heroTitle) {
        heroTitle.classList.add('shimmer-text');
    }

    // === 主题切换时的全局过渡动画 ===
    const themeTransitionStyle = document.createElement('style');
    themeTransitionStyle.textContent = `
        html.theme-transitioning,
        html.theme-transitioning *,
        html.theme-transitioning *::before,
        html.theme-transitioning *::after {
            transition: background-color 0.5s ease,
                        color 0.5s ease,
                        border-color 0.5s ease,
                        box-shadow 0.5s ease,
                        fill 0.5s ease,
                        stroke 0.5s ease !important;
        }
    `;
    document.head.appendChild(themeTransitionStyle);

    const origSetAttr = document.documentElement.setAttribute.bind(document.documentElement);
    document.documentElement.setAttribute = function(name, value) {
        if (name === 'data-theme') {
            document.documentElement.classList.add('theme-transitioning');
            origSetAttr(name, value);
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transitioning');
            }, 550);
        } else {
            origSetAttr(name, value);
        }
    };
}

// 滚动揭示动画
export function initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// 创建页脚
export function createFooter() {
    const _lang = getGlobalLang();
    const _isEn = _lang === 'en';
    const footer = document.createElement('footer');
    footer.style.cssText = 'padding: 48px 24px; text-align: center; border-top: 1px solid var(--border-color); margin-top: 80px;';
    footer.innerHTML = `
        <div style="max-width: 1280px; margin: 0 auto;">
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; margin-bottom: 24px;">
                <a href="/index.html" class="nav-link"><i class="ri-home-4-line"></i> ${_isEn ? 'Home' : '首页'}</a>
                <a href="/letters.html" class="nav-link"><i class="ri-file-text-line"></i> ${_isEn ? 'Letters' : '股东信'}</a>
                <a href="/meetings.html" class="nav-link"><i class="ri-mic-line"></i> ${_isEn ? 'Meetings' : '股东大会'}</a>
                <a href="/glossary.html" class="nav-link"><i class="ri-book-2-line"></i> ${_isEn ? 'Glossary' : '名词解释'}</a>
                <a href="/people.html" class="nav-link"><i class="ri-user-star-line"></i> ${_isEn ? 'People' : '人物简介'}</a>
                <a href="/games.html" class="nav-link"><i class="ri-gamepad-line"></i> ${_isEn ? 'Games' : '休闲游戏'}</a>
            </div>
            <p style="color: var(--text-tertiary); font-size: 13px; line-height: 1.6;">
                ${_isEn ? 'Content is for educational purposes only and does not constitute investment advice.<br>Original shareholder letters are copyrighted by Berkshire Hathaway Inc.' : '本站内容仅供学习研究使用，不构成投资建议。<br>股东信原文版权归 Berkshire Hathaway Inc. 所有。'}
            </p>
            <p style="color: var(--text-tertiary); font-size: 12px; margin-top: 12px;">
                由 <a href="https://with.woa.com/" style="color: #8B5CF6;" target="_blank">With</a> 通过自然语言生成
            </p>
        </div>
    `;

    // 页脚需要添加到 page-wrapper 内
    const wrapper = document.getElementById('page-wrapper');
    if (wrapper) {
        wrapper.appendChild(footer);
    } else {
        document.body.appendChild(footer);
    }

    // 创建全局返回顶部按钮（如果页面没有自定义的）
    createGlobalBackToTop();
}

// 全局返回顶部按钮
function createGlobalBackToTop() {
    // 如果页面已经有自定义的返回顶部按钮（如letters.html），则不重复创建
    if (document.getElementById('back-to-top')) return;

    const btn = document.createElement('button');
    btn.id = 'global-back-to-top';
    btn.title = '返回顶部';
    btn.innerHTML = '<i class="ri-arrow-up-line"></i>';
    btn.style.cssText = `
        position: fixed;
        bottom: 32px;
        right: 32px;
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: var(--glass-bg);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid var(--glass-border);
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 24px;
        z-index: 56;
        opacity: 0;
        transform: translateY(20px) scale(0.8);
        pointer-events: none;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    `;
    document.body.appendChild(btn);

    // 滚动监听
    window.addEventListener('scroll', () => {
        if (window.scrollY > window.innerHeight) {
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0) scale(1)';
            btn.style.pointerEvents = 'auto';
        } else {
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px) scale(0.8)';
            btn.style.pointerEvents = 'none';
        }
    }, { passive: true });

    // 悬停效果
    btn.addEventListener('mouseenter', () => {
        btn.style.color = 'var(--text-primary)';
        btn.style.borderColor = 'rgba(99, 102, 241, 0.3)';
        btn.style.background = 'rgba(99, 102, 241, 0.1)';
        btn.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.2)';
        btn.style.transform = 'translateY(-4px) scale(1.05)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.color = 'var(--text-secondary)';
        btn.style.borderColor = 'var(--glass-border)';
        btn.style.background = 'var(--glass-bg)';
        btn.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.15)';
        if (window.scrollY > window.innerHeight) {
            btn.style.transform = 'translateY(0) scale(1)';
        }
    });

    // 点击回到顶部
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}