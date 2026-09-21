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

    // 5. Sistema de Compartición Social Viral (WhatsApp, Telegram, Facebook, Clipboard)
    function renderShareWidget(targetContainer, options = {}) {
        const container = typeof targetContainer === 'string' ? document.querySelector(targetContainer) : targetContainer;
        if (!container) return;

        const currentUrl = options.url || window.location.href.split('#')[0];
        const title = options.title || document.title.split('|')[0].trim();
        const resultText = options.resultText ? ` Mi resultado fue: "${options.resultText}".` : '';
        const shareMessage = options.message || `Acabo de realizar el "${title}" en HazelTest.${resultText} ¿Te animas a descubrir el tuyo? ¡Hazlo gratis aquí! 👉 ${currentUrl}`;
        
        const encodedMsg = encodeURIComponent(shareMessage);
        const encodedUrl = encodeURIComponent(currentUrl);

        container.innerHTML = `
            <div class="ht-share-box bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-5 md:p-6 shadow-sm my-6 text-center">
                <div class="inline-flex items-center space-x-1.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-xs font-bold px-3 py-1 rounded-full mb-2.5">
                    <span>📢 ¡Comparte tu resultado!</span>
                </div>
                <h4 class="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1">¡Reta a tus amigos y compañeros!</h4>
                <p class="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                    Comparte tu resultado en WhatsApp o redes para ver qué obtienen los demás:
                </p>
                
                <div class="flex flex-wrap justify-center items-center gap-2.5">
                    <!-- WhatsApp -->
                    <a href="https://api.whatsapp.com/send?text=${encodedMsg}" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center space-x-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-md transition transform hover:-translate-y-0.5 active:scale-95" aria-label="Compartir en WhatsApp">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        <span>WhatsApp</span>
                    </a>

                    <!-- Telegram -->
                    <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center space-x-2 bg-[#229ED9] hover:bg-[#1e8ec3] text-white px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-md transition transform hover:-translate-y-0.5 active:scale-95" aria-label="Compartir en Telegram">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z"/></svg>
                        <span>Telegram</span>
                    </a>

                    <!-- Facebook -->
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center space-x-2 bg-[#1877F2] hover:bg-[#166fe5] text-white px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-md transition transform hover:-translate-y-0.5 active:scale-95" aria-label="Compartir en Facebook">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span>Facebook</span>
                    </a>

                    <!-- Copiar Enlace -->
                    <button type="button" class="ht-copy-share-btn inline-flex items-center space-x-1.5 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition active:scale-95">
                        <svg class="w-4 h-4 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        <span class="ht-copy-label">Copiar Enlace</span>
                    </button>
                </div>
            </div>
        `;

        const copyBtn = container.querySelector('.ht-copy-share-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(shareMessage).then(() => {
                    const label = copyBtn.querySelector('.ht-copy-label');
                    if (label) {
                        const original = label.textContent;
                        label.textContent = '¡Copiado! ✓';
                        copyBtn.classList.add('bg-green-50', 'text-green-700', 'border-green-300');
                        setTimeout(() => {
                            label.textContent = original;
                            copyBtn.classList.remove('bg-green-50', 'text-green-700', 'border-green-300');
                        }, 2500);
                    }
                }).catch(() => {
                    prompt('Copia este enlace para compartir:', currentUrl);
                });
            });
        }
    }

    // Auto-observar secciones de resultados en los tests
    function watchResultSections() {
        const resultadosSection = document.getElementById('test-resultados');
        if (!resultadosSection) return;

        const observer = new MutationObserver(() => {
            if (!resultadosSection.classList.contains('hidden') && !resultadosSection.querySelector('.ht-share-box')) {
                // Buscar encabezado o diagnóstico
                const heading = resultadosSection.querySelector('#tipo-personalidad, #nivel-sintomas, #nivel-autoestima, h3, h2');
                const resultText = heading ? heading.textContent.trim() : '';
                
                let shareSlot = document.getElementById('ht-share-container');
                if (!shareSlot) {
                    shareSlot = document.createElement('div');
                    shareSlot.id = 'ht-share-container';
                    shareSlot.className = 'my-6';
                    // Insertar antes del botón de reiniciar o al final de la tarjeta de diagnóstico
                    const restartBtn = document.getElementById('reiniciar-test-btn');
                    if (restartBtn && restartBtn.parentNode) {
                        restartBtn.parentNode.parentNode.insertBefore(shareSlot, restartBtn.parentNode);
                    } else {
                        resultadosSection.appendChild(shareSlot);
                    }
                }
                renderShareWidget(shareSlot, {
                    title: document.title.split('|')[0].trim(),
                    resultText: resultText,
                    url: window.location.href.split('#')[0]
                });
            }
        });

        observer.observe(resultadosSection, { attributes: true, attributeFilter: ['class', 'style'] });
    }

    // Inicialización inmediata
    initDarkMode();

    document.addEventListener('DOMContentLoaded', () => {
        renderTopbarControls();
        actualizarBadgeUI();
        renderCookieBanner();
        watchResultSections();
    });

    // Exponer API global para los quizzes
    window.HazelTestApp = {
        addXP: sumarXP,
        getXP: obtenerXP,
        getRank: () => obtenerRango(obtenerXP()),
        getStreak: calcularRacha
    };

    window.HazelTestShare = {
        render: renderShareWidget
    };
})();
