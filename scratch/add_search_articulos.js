const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', '..', '..', '..', '..', 'Documents', 'vscode', 'PAGINAS', 'HazelTest', 'articulos', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Tag all cards with article-card class
html = html.replace(/<a href="\/articulos\/(.*?)" class="block bg-white/g, '<a href="/articulos/$1" class="article-card block bg-white');

// 2. Identify sections
html = html.replace('<!-- Sección 1: Cultura Naval y Doctrina SEMAR (20 Artículos) -->\n        <section class="mb-16">', '<!-- Sección 1: Cultura Naval y Doctrina SEMAR (20 Artículos) -->\n        <section id="section-naval" class="article-section mb-16" data-section="naval">');
html = html.replace('<!-- Sección 2: Psicología, Salud Mental y Psicotecnia (20 Artículos) -->\n        <section class="mb-16">', '<!-- Sección 2: Psicología, Salud Mental y Psicotecnia (20 Artículos) -->\n        <section id="section-psicologia" class="article-section mb-16" data-section="psicologia">');

// 3. Search and filter UI to insert right after the hero subtitle
const searchUI = `
        <!-- Buscador Dinámico en Tiempo Real y Filtros -->
        <div class="max-w-2xl mx-auto mb-12">
            <div class="relative flex items-center shadow-lg rounded-2xl overflow-hidden bg-white border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">
                <span class="pl-4 text-slate-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                <input type="text" id="article-search-input" placeholder="Buscar por tema, héroe naval o concepto psicológico (ej. Ulúa, GAD-7, 1914, autoestima, Baranda)..." 
                       class="w-full py-4 pl-3 pr-10 text-slate-800 text-sm md:text-base focus:outline-none placeholder-slate-400" autocomplete="off">
                <button id="clear-search-btn" class="hidden absolute right-3 text-slate-400 hover:text-slate-600 p-1" aria-label="Limpiar búsqueda">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <!-- Botones de Filtro Rápido por Categoría -->
            <div class="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-semibold">
                <button type="button" class="filter-btn active px-3.5 py-1.5 rounded-full bg-blue-900 text-white transition shadow-sm" data-category="all">
                    Todos (40)
                </button>
                <button type="button" class="filter-btn px-3.5 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200 hover:border-blue-400 transition" data-category="naval">
                    ⚓ Cultura Naval (20)
                </button>
                <button type="button" class="filter-btn px-3.5 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 transition" data-category="psicologia">
                    🧠 Psicología y Emociones (20)
                </button>
            </div>

            <div id="search-counter" class="text-center text-xs text-slate-500 mt-3 font-medium">
                Mostrando los 40 artículos educativos
            </div>
        </div>

        <div id="no-articles-msg" class="hidden py-16 text-center max-w-md mx-auto">
            <div class="text-4xl mb-3">🔍</div>
            <h3 class="text-lg font-bold text-slate-800 mb-1">No se encontraron artículos</h3>
            <p class="text-sm text-slate-500">No encontramos coincidencias para ese término. Prueba con otra palabra como "naval", "ansiedad", "armada" o "personalidad".</p>
            <button id="reset-filter-btn" class="mt-4 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition">
                Ver todos los 40 artículos
            </button>
        </div>
`;

html = html.replace('        <!-- Sección 1: Cultura Naval y Doctrina SEMAR (20 Artículos) -->', searchUI + '\n        <!-- Sección 1: Cultura Naval y Doctrina SEMAR (20 Artículos) -->');

// 4. Client-side Search Script before </body>
const clientScript = `
    <!-- Buscador en tiempo real de artículos -->
    <script>
    (function() {
        const searchInput = document.getElementById('article-search-input');
        const clearBtn = document.getElementById('clear-search-btn');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const searchCounter = document.getElementById('search-counter');
        const noArticlesMsg = document.getElementById('no-articles-msg');
        const resetBtn = document.getElementById('reset-filter-btn');

        const cards = Array.from(document.querySelectorAll('.article-card'));
        const sections = Array.from(document.querySelectorAll('.article-section'));

        let currentCategory = 'all';
        let currentQuery = '';

        function normalizeText(text) {
            return text.toLowerCase()
                .normalize("NFD")
                .replace(/[\\u0300-\\u036f]/g, "");
        }

        function filterArticles() {
            let visibleCount = 0;
            const queryNorm = normalizeText(currentQuery);

            cards.forEach(card => {
                const parentSection = card.closest('.article-section');
                const sectionCategory = parentSection ? parentSection.dataset.section : 'all';

                // Categoría match
                const categoryMatches = (currentCategory === 'all' || currentCategory === sectionCategory);

                // Texto match (título, descripción, badge)
                const textContent = normalizeText(card.textContent);
                const queryMatches = !queryNorm || textContent.includes(queryNorm);

                if (categoryMatches && queryMatches) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            // Ocultar/mostrar encabezados de secciones vacías
            sections.forEach(sec => {
                const hasVisibleCards = sec.querySelectorAll('.article-card:not(.hidden)').length > 0;
                sec.style.display = hasVisibleCards ? '' : 'none';
            });

            // Mensaje de vacíos
            if (visibleCount === 0) {
                noArticlesMsg.classList.remove('hidden');
            } else {
                noArticlesMsg.classList.add('hidden');
            }

            // Actualizar contador
            if (currentQuery) {
                searchCounter.textContent = \`\${visibleCount} artículo\${visibleCount === 1 ? '' : 's'} encontrado\${visibleCount === 1 ? '' : 's'} para "\${currentQuery}"\`;
            } else if (currentCategory !== 'all') {
                searchCounter.textContent = \`Mostrando \${visibleCount} artículos de \${currentCategory === 'naval' ? 'Cultura Naval' : 'Psicología'}\`;
            } else {
                searchCounter.textContent = \`Mostrando los 40 artículos educativos\`;
            }
        }

        searchInput.addEventListener('input', (e) => {
            currentQuery = e.target.value.trim();
            if (currentQuery) {
                clearBtn.classList.remove('hidden');
            } else {
                clearBtn.classList.add('hidden');
            }
            filterArticles();
        });

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentQuery = '';
            clearBtn.classList.add('hidden');
            filterArticles();
            searchInput.focus();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.classList.remove('active', 'bg-blue-900', 'text-white');
                    b.classList.add('bg-white', 'text-slate-700');
                });
                btn.classList.add('active', 'bg-blue-900', 'text-white');
                btn.classList.remove('bg-white', 'text-slate-700');

                currentCategory = btn.dataset.category;
                filterArticles();
            });
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                searchInput.value = '';
                currentQuery = '';
                clearBtn.classList.add('hidden');
                currentCategory = 'all';
                filterBtns.forEach(b => {
                    if (b.dataset.category === 'all') {
                        b.classList.add('active', 'bg-blue-900', 'text-white');
                        b.classList.remove('bg-white', 'text-slate-700');
                    } else {
                        b.classList.remove('active', 'bg-blue-900', 'text-white');
                        b.classList.add('bg-white', 'text-slate-700');
                    }
                });
                filterArticles();
            });
        }
    })();
    </script>
`;

html = html.replace('</body>', clientScript + '\n</body>');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ Buscador dinámico y filtros inyectados correctamente en articulos/index.html');
