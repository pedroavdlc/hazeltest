/**
 * HazelTest App Core: PWA, Gamificación (Rachas + XP + Rangos) y Modo Oscuro
 */
(function() {
    'use strict';

    // 1. Registro de Service Worker para PWA Offline con auto-actualización
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Purgar cachés antiguas si existen
            if ('caches' in window) {
                caches.keys().then(keys => {
                    keys.forEach(key => {
                        if (key.startsWith('hazeltest-cache-') && key !== 'hazeltest-cache-v4') {
                            console.log('Limpiando caché antigua del navegador:', key);
                            caches.delete(key);
                        }
                    });
                });
            }

            navigator.serviceWorker.register('/sw.js?v=4.2')
                .then(reg => {
                    console.log('✓ Service Worker v4.2 registrado:', reg.scope);
                    reg.update(); // Forzar verificación de actualización
                })
                .catch(err => console.debug('Service Worker no registrado:', err));
        });

        // Cuando el nuevo SW tome el control, refrescar para mostrar la interfaz más reciente
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    }

    // 2. Sistema de Gamificación (Rachas, XP y Rangos Navales)
    const RANGOS_NAVALES = [
        { nombre: 'Grumete', minXP: 0, icon: '⚓', maxXP: 99 },
        { nombre: 'Marinero', minXP: 100, icon: '🎖️', maxXP: 249 },
        { nombre: 'Cabo', minXP: 250, icon: '🥉', maxXP: 499 },
        { nombre: 'Oficial', minXP: 500, icon: '🥈', maxXP: 999 },
        { nombre: 'Capitán', minXP: 1000, icon: '🥇', maxXP: 2499 },
        { nombre: 'Almirante', minXP: 2500, icon: '👑', maxXP: Infinity }
    ];

    function calcularRacha() {
        const hoy = new Date().toISOString().split('T')[0];
        const ultimaVisita = localStorage.getItem('ht_last_visit');
        let racha = parseInt(localStorage.getItem('ht_streak') || '0', 10);

        if (!ultimaVisita) {
            racha = 1;
            localStorage.setItem('ht_last_visit', hoy);
            localStorage.setItem('ht_streak', '1');
        } else if (ultimaVisita !== hoy) {
            const fechaUltima = new Date(ultimaVisita);
            const fechaHoy = new Date(hoy);
            const diffDias = Math.round((fechaHoy - fechaUltima) / (1000 * 60 * 60 * 24));

            if (diffDias === 1) {
                racha += 1;
            } else if (diffDias > 1) {
                racha = 1;
            }
            localStorage.setItem('ht_last_visit', hoy);
            localStorage.setItem('ht_streak', racha.toString());
        }
        return racha;
    }

    function obtenerXP() {
        return parseInt(localStorage.getItem('ht_xp') || '25', 10);
    }

    function obtenerRango(xp) {
        for (let i = RANGOS_NAVALES.length - 1; i >= 0; i--) {
            if (xp >= RANGOS_NAVALES[i].minXP) {
                return RANGOS_NAVALES[i];
            }
        }
        return RANGOS_NAVALES[0];
    }

    function sumarXP(puntos) {
        const actual = obtenerXP();
        const nuevo = actual + puntos;
        localStorage.setItem('ht_xp', nuevo.toString());
        actualizarBadgeUI();
        mostrarNotificacionXP(`+${puntos} XP Ganados`);
    }

    function mostrarNotificacionXP(texto) {
        let toast = document.getElementById('ht-xp-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'ht-xp-toast';
            toast.className = 'fixed bottom-5 right-5 bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg shadow-xl z-50 transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none text-sm flex items-center space-x-2';
            document.body.appendChild(toast);
        }
        toast.textContent = `⭐ ${texto}`;
        toast.classList.remove('translate-y-10', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
        }, 2200);
    }

    // 3. Modo Oscuro
    function initDarkMode() {
        const theme = localStorage.getItem('ht_theme') || 'light';
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    function toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('ht_theme', isDark ? 'dark' : 'light');
        actualizarBotonTema(isDark);
    }

    function actualizarBotonTema(isDark) {
        const btn = document.getElementById('ht-theme-toggle');
        if (btn) {
            btn.innerHTML = isDark
                ? `<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>`
                : `<svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>`;
            btn.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        }
    }

    // 4. Inyección del Widget de Gamificación y Tema en la Barra Superior
    function actualizarBadgeUI() {
        const streak = calcularRacha();
        const xp = obtenerXP();
        const rango = obtenerRango(xp);

        const streakEl = document.getElementById('ht-streak-count');
        const rangoEl = document.getElementById('ht-rank-name');
        const xpEl = document.getElementById('ht-xp-count');

        if (streakEl) streakEl.textContent = streak;
        if (rangoEl) rangoEl.textContent = `${rango.icon} ${rango.nombre}`;
        if (xpEl) xpEl.textContent = `${xp} XP`;
    }

    function renderTopbarControls() {
        const nav = document.querySelector('header nav');
        if (!nav || document.getElementById('ht-topbar-controls')) return;

        const controls = document.createElement('div');
        controls.id = 'ht-topbar-controls';
        controls.className = 'flex items-center space-x-3 text-xs md:text-sm';

        const xp = obtenerXP();
        const rango = obtenerRango(xp);
        const streak = calcularRacha();
        const isDark = document.documentElement.classList.contains('dark');

        controls.innerHTML = `
            <div class="hidden sm:flex items-center space-x-2 bg-indigo-50 dark:bg-gray-800 text-indigo-900 dark:text-indigo-200 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-gray-700 shadow-sm">
                <span title="Días consecutivos de estudio">🔥 <strong id="ht-streak-count">${streak}</strong> d</span>
                <span class="text-gray-300 dark:text-gray-600">|</span>
                <span id="ht-rank-name" class="font-semibold" title="Rango naval">${rango.icon} ${rango.nombre}</span>
                <span class="text-gray-300 dark:text-gray-600">|</span>
                <span id="ht-xp-count" class="text-indigo-600 dark:text-indigo-400 font-bold">${xp} XP</span>
            </div>
            <button id="ht-theme-toggle" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none" aria-label="Cambiar tema">
            </button>
        `;

        // Insertar antes del botón móvil o al final
        const mobileBtn = nav.querySelector('.md\\:hidden');
        if (mobileBtn) {
            nav.insertBefore(controls, mobileBtn);
        } else {
            nav.appendChild(controls);
        }

        actualizarBotonTema(isDark);
        document.getElementById('ht-theme-toggle').addEventListener('click', toggleDarkMode);
    }

    // 5. Aviso Interactivo de Cookies (Google AdSense & GDPR / ePrivacy)
    function renderCookieBanner() {
        const consent = localStorage.getItem('ht_cookies_consent');
        if (consent || document.getElementById('ht-cookie-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'ht-cookie-banner';
        banner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xl z-50 transition-all duration-500 transform translate-y-6 opacity-0';
        banner.innerHTML = `
            <div class="flex items-start space-x-3">
                <span class="text-2xl flex-shrink-0">🍪</span>
                <div class="flex-grow text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong class="text-sm font-bold text-slate-900 dark:text-white block mb-1">Aviso de Cookies y Privacidad</strong>
                    Utilizamos cookies propias y de terceros (Google AdSense, Google Analytics) para analizar el tráfico, recordar tus preferencias de estudio y mostrarte anuncios personalizados acordes a tus intereses. Consulta nuestra <a href="/privacidad.html" class="text-blue-600 dark:text-blue-400 font-semibold underline hover:text-blue-800">Política de Privacidad y Cookies</a>.
                    <div class="mt-4 flex flex-wrap gap-2">
                        <button id="ht-cookie-accept" class="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg transition shadow-sm text-xs">
                            Aceptar todas
                        </button>
                        <button id="ht-cookie-essential" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition text-xs">
                            Solo necesarias
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        // Animar entrada suave
        setTimeout(() => {
            banner.classList.remove('translate-y-6', 'opacity-0');
        }, 300);

        function closeBanner(type) {
            localStorage.setItem('ht_cookies_consent', type);
            banner.classList.add('translate-y-6', 'opacity-0');
            setTimeout(() => {
                if (banner.parentNode) banner.parentNode.removeChild(banner);
            }, 400);
        }

        document.getElementById('ht-cookie-accept').addEventListener('click', () => closeBanner('all'));
        document.getElementById('ht-cookie-essential').addEventListener('click', () => closeBanner('essential'));
    }

    // Inicialización inmediata
    initDarkMode();

    document.addEventListener('DOMContentLoaded', () => {
        renderTopbarControls();
        actualizarBadgeUI();
        renderCookieBanner();
    });

    // Exponer API global para los quizzes
    window.HazelTestApp = {
        addXP: sumarXP,
        getXP: obtenerXP,
        getRank: () => obtenerRango(obtenerXP()),
        getStreak: calcularRacha
    };
})();
