// ─── Data State ────────────────────────────────────
let state = {
    seriesListActive: [],
    movieListActive:[],
    seriesListPlanned: [],
    movieListPlanned: []
};

const ALL_LISTS =['seriesListActive', 'movieListActive', 'seriesListPlanned', 'movieListPlanned'];
const MOVIE_LISTS =['movieListActive', 'movieListPlanned'];
const SERIES_LISTS =['seriesListActive', 'seriesListPlanned'];

let currentSort = 'order-desc';
let currentTab = 'series';
let visibleStatuses = ['watching', 'completed', 'on-hold', 'dropped', 'planned'];

const ratingValues = {
    '💀': 1, '😕': 2, '🙂': 3, '😀': 4, '😁': 5, '😍': 6
};

let editingItemId = null;
let currentTags =[];

// Mode State
let isLibraryMode = true; 

// ─── DOM Refs ──────────────────────────────────────
const appContainer = document.getElementById('app-container');
const appSubtitle = document.getElementById('app-subtitle');
const toggleBtn = document.getElementById('toggle-view-btn');
const editorActions = document.querySelector('.editor-actions');
const editorView = document.getElementById('editor-view');
const libraryView = document.getElementById('library-view');

const editorModal = document.getElementById('editor-modal');
const groupListEl = document.getElementById('group-list');
const seriesFieldsEl = document.getElementById('series-fields');

const sortableListEls = {};
document.querySelectorAll('.sortable-list').forEach(el => {
    sortableListEls[el.id] = el;
});

function toggleViewMode() {
    isLibraryMode = !isLibraryMode;
    
    if (isLibraryMode) {
        document.body.classList.add('view-library');
        document.body.classList.remove('view-editor');
        if (appContainer) appContainer.classList.add('wide');
        if (appSubtitle) appSubtitle.textContent = 'Library';
        if (toggleBtn) toggleBtn.textContent = 'Open Editor';
        if (editorActions) editorActions.style.display = 'none';
        if (editorView) editorView.style.display = 'none';
        if (libraryView) libraryView.style.display = '';
        renderLibrary();
    } else {
        document.body.classList.add('view-editor');
        document.body.classList.remove('view-library');
        if (appContainer) appContainer.classList.remove('wide');
        if (appSubtitle) appSubtitle.textContent = 'Editor';
        if (toggleBtn) toggleBtn.textContent = 'View Library';
        if (editorActions) editorActions.style.display = 'flex';
        if (editorView) editorView.style.display = 'block';
        if (libraryView) libraryView.style.display = 'none';
        switchTab(currentTab);
        renderLists();
    }
}

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

// ─── Helpers ───────────────────────────────────────
function allItems() {
    return ALL_LISTS.flatMap(l => state[l]);
}

function isMovieTab(tab) {
    return tab === 'movies' || tab === 'planned-movies';
}

function isMovieList(listName) {
    return MOVIE_LISTS.includes(listName);
}

function findItem(id) {
    for (const listName of ALL_LISTS) {
        const item = state[listName].find(i => i._id === id);
        if (item) return { item, listName };
    }
    return null;
}

function getTargetListForTab(tab) {
    switch (tab) {
        case 'series': return 'seriesListActive';
        case 'movies': return 'movieListActive';
        case 'planned-series': return 'seriesListPlanned';
        case 'planned-movies': return 'movieListPlanned';
        default: return 'seriesListActive';
    }
}

function getDefaultStatusForTab(tab) {
    return (tab === 'planned-series' || tab === 'planned-movies') ? 'planned' : 'watching';
}

function getNextOrder(listName) {
    if (state[listName].length === 0) return 1;
    return Math.max(...state[listName].map(i => i.order || 0)) + 1;
}

// ─── Initialization ────────────────────────────────
function init() {
    loadFromLocalStorage();

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = currentSort;
    
    document.querySelectorAll('.status-toggles input').forEach(cb => {
        cb.checked = visibleStatuses.includes(cb.value);
    });

    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleViewMode);
    }
    
    // Initial render layout setup
    isLibraryMode = false;
    toggleViewMode(); // This flips it to true, showing Library correctly.
    
    setupEventListeners();
}

// ─── Tabs (Editor Only) ────────────────────────────
function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.tab === tabName)
    );
    document.querySelectorAll('.tab-panel').forEach(panel =>
        panel.classList.toggle('active', panel.id === 'panel-' + tabName)
    );
}

// ─── Local Storage ─────────────────────────────────
function saveToLocalStorage() {
    localStorage.setItem('anison_data', JSON.stringify({
        state,
        currentSort,
        currentTab,
        visibleStatuses
    }));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('anison_data');
    if (!data) return;
    try {
        const parsed = JSON.parse(data);

        // New 4-list format
        if (parsed.state && parsed.state.seriesListActive !== undefined) {
            state.seriesListActive = parsed.state.seriesListActive || [];
            state.movieListActive = parsed.state.movieListActive ||[];
            state.seriesListPlanned = parsed.state.seriesListPlanned ||[];
            state.movieListPlanned = parsed.state.movieListPlanned ||[];
            currentSort = parsed.currentSort || 'order-desc';
            currentTab = parsed.currentTab || 'series';
            visibleStatuses = parsed.visibleStatuses ||['watching', 'completed', 'on-hold', 'dropped', 'planned'];
        }
        // Legacy formats fallback...
        else if (parsed.state && (parsed.state.seriesList || parsed.state.movieList)) {
            (parsed.state.seriesList ||[]).forEach(item => {
                if (item.status === 'planned') state.seriesListPlanned.push(item);
                else state.seriesListActive.push(item);
            });
            (parsed.state.movieList ||[]).forEach(item => {
                if (item.status === 'planned') state.movieListPlanned.push(item);
                else state.movieListActive.push(item);
            });
            currentSort = parsed.currentSort || 'order-desc';
            currentTab = parsed.currentTab || 'series';
            visibleStatuses = parsed.visibleStatuses || ['watching', 'completed', 'on-hold', 'dropped', 'planned'];
        }

        allItems().forEach(item => {
            if (!item._id) item._id = generateId();
        });
    } catch (e) {
        console.error("Local storage load error", e);
    }
}


// ─── Sorting & Ordering ────────────────────────────
function sortItems(items) {
    return [...items].sort((a, b) => {
        if (currentSort === 'order-desc') return b.order - a.order;
        if (currentSort === 'order-asc') return a.order - b.order;
        if (currentSort === 'name-asc') return a.title.localeCompare(b.title);
        if (currentSort === 'name-desc') return b.title.localeCompare(a.title);
        if (currentSort === 'rating-desc') {
            const d = getRatingValue(b.rating) - getRatingValue(a.rating);
            return d !== 0 ? d : b.order - a.order;
        }
        if (currentSort === 'rating-asc') {
            const d = getRatingValue(a.rating) - getRatingValue(b.rating);
            return d !== 0 ? d : b.order - a.order;
        }
        return 0;
    });
}

function getRatingValue(rating) {
    if (!rating || !rating.overall) return 0;
    return ratingValues[rating.overall] || 0;
}

function reorderAllLists() {
    ALL_LISTS.forEach(listName => {
        const len = state[listName].length;
        state[listName].forEach((item, i) => { item.order = len - i; });
    });
}

function handleDragEnd(evt) {
    if (currentSort !== 'order-desc') {
        alert("Please set sorting to 'Custom Order (Newest First)' to manually reorder items.");
        renderLists();
        return;
    }

    const listEl = evt.to;
    let listName = '';
    if (listEl.id === 'list-planned-series') listName = 'seriesListPlanned';
    else if (listEl.id === 'list-planned-movies') listName = 'movieListPlanned';
    
    if (!listName) return;

    const orderedIds = Array.from(listEl.children).map(c => c.dataset.id);

    state[listName].sort((a,b) => {
        return orderedIds.indexOf(a._id) - orderedIds.indexOf(b._id);
    });

    reorderAllLists();
    renderLists();
}

function initSortable() {
    ['list-planned-series', 'list-planned-movies'].forEach(id => {
        const el = document.getElementById(id);
        if (el && typeof Sortable !== 'undefined') {
            new Sortable(el, {
                group: id,
                animation: 150,
                onEnd: handleDragEnd
            });
        }
    });
}

// ─── Rendering Library ─────────────────────────────
function renderLibrary() {
    const seriesContainer = document.getElementById('library-series-content');
    const moviesContainer = document.getElementById('library-movies-content');
    if (!seriesContainer || !moviesContainer) return;

    seriesContainer.innerHTML = '';
    moviesContainer.innerHTML = '';

    const statuses =['watching', 'completed', 'on-hold', 'dropped', 'planned'];

    statuses.forEach(status => {
        if (!visibleStatuses.includes(status)) return;

        // Series
        const seriesItems =[...state.seriesListActive, ...state.seriesListPlanned]
            .filter(i => i.status === status);
        
        if (seriesItems.length > 0) {
            seriesContainer.insertAdjacentHTML('beforeend', createLibrarySection(status, seriesItems, false));
        }

        // Movies
        const movieItems = [...state.movieListActive, ...state.movieListPlanned]
            .filter(i => i.status === status);
            
        if (movieItems.length > 0) {
            moviesContainer.insertAdjacentHTML('beforeend', createLibrarySection(status, movieItems, true));
        }
    });

    saveToLocalStorage();
}

function createLibrarySection(status, items, isMovie) {
    const sorted = sortItems(items);
    return `
        <div class="library-status-group">
            <div class="status-divider divider-${status}">${status} <span class="divider-count">${items.length}</span></div>
            <div class="library-grid ${isMovie ? 'grid-small' : 'grid-large'}">
                ${sorted.map(item => createGridCardHtml(item)).join('')}
            </div>
        </div>
    `;
}

function createGridCardHtml(item) {
    if (!item._id) item._id = generateId();
    const bgImg = item.image_url ? `style="background-image: url('${item.image_url}')"` : '';
    const hasRating = item.rating && item.rating.overall;
    const isSeries = item.seasons || item.episodes;

    return `
        <div class="grid-card ${item.is_nsfw ? 'nsfw-card' : ''}" onclick="openInfoModal('${item._id}')" style="cursor: pointer;">
            <div class="grid-card-inner" ${bgImg}>
                ${isSeries ? `
                    <div class="grid-stats-top-left">
                        ${item.seasons ? `S${item.seasons}` : ''}${item.seasons && item.episodes ? ' ' : ''}${item.episodes ? `E${item.episodes}` : ''}
                    </div>
                ` : ''}
                ${hasRating ? `<div class="grid-rating-top-right">${item.rating.overall}</div>` : ''}
                <div class="grid-title-overlay">
                    <div class="grid-title">${item.waiting ? '<span title="Waiting for next season">⏱️</span> ' : ''}${escapeHtml(item.title)}</div>
                </div>
            </div>
        </div>
    `;
}

// ─── Rendering Editor ──────────────────────────────
function renderLists() {

    const activeStatuses = ['watching', 'completed', 'on-hold', 'dropped'];

    // Clear all sortable lists
    Object.values(sortableListEls).forEach(el => { el.innerHTML = ''; });

    // Visibility toggles for active status dividers
    activeStatuses.forEach(status => {['series', 'movies'].forEach(prefix => {
            const listId = `list-${prefix}-${status}`;
            const listEl = sortableListEls[listId];
            const divider = listEl ? listEl.previousElementSibling : null;
            const visible = visibleStatuses.includes(status);
            if (divider) divider.classList.toggle('status-section-hidden', !visible);
            if (listEl) listEl.classList.toggle('status-section-hidden', !visible);
        });
    });

    // Render each list
    ALL_LISTS.forEach(listName => {
        const sorted = sortItems(state[listName]);
        sorted.forEach(item => {
            const status = item.status || 'watching';
            let listId;
            if (listName === 'seriesListActive') listId = 'list-series-' + status;
            else if (listName === 'movieListActive') listId = 'list-movies-' + status;
            else if (listName === 'seriesListPlanned') listId = 'list-planned-series';
            else if (listName === 'movieListPlanned') listId = 'list-planned-movies';

            const listEl = sortableListEls[listId];
            if (listEl) listEl.insertAdjacentHTML('beforeend', createCardHtml(item, isMovieList(listName)));
        });
    });

    // Divider counts
    Object.values(sortableListEls).forEach(listEl => {
        const countEl = listEl.previousElementSibling
            ? listEl.previousElementSibling.querySelector('.divider-count')
            : null;
        if (countEl) countEl.textContent = listEl.children.length;
    });

    updateTabCounts();
    saveToLocalStorage();
}

function updateTabCounts() {
    document.getElementById('tab-count-series').textContent = state.seriesListActive.length;
    document.getElementById('tab-count-movies').textContent = state.movieListActive.length;
    document.getElementById('tab-count-planned-series').textContent = state.seriesListPlanned.length;
    document.getElementById('tab-count-planned-movies').textContent = state.movieListPlanned.length;
}

function createCardHtml(item, isMovie) {
    if (!item._id) item._id = generateId();
    const bgImg = item.image_url
        ? `style="background-image: url('${item.image_url}'); background-size: cover; background-position: center;"`
        : '';

    return `
        <div class="anime-card" data-id="${item._id}">
            <div class="card-order">${item.order}</div>
            <div class="card-image" ${bgImg}></div>
            <div class="card-content">
                <div class="card-title">${escapeHtml(item.title)}</div>
                <div class="card-meta">
                    <span class="badge status-${item.status}">${item.status}</span>
                    ${item.waiting ? `<span class="badge status-waiting" title="Waiting for next season">⏱️</span>` : ''}
                    ${item.rating && item.rating.overall ? `<span>${item.rating.overall}</span>` : ''}
                    ${!isMovie && item.seasons ? `<span>S${item.seasons}</span>` : ''}
                    ${!isMovie && item.episodes ? `<span>E${item.episodes}</span>` : ''}
                </div>
            </div>
            <div class="card-actions">
                <button class="edit-btn" onclick="openModal('${item._id}')">⚙️</button>
            </div>
        </div>
    `;
}



// ─── Info Modal ────────────────────────────────────
const infoModal = document.getElementById('info-modal');

function openInfoModal(itemId) {
    const found = findItem(itemId);
    if (!found) return;
    const item = found.item;

    const body = document.getElementById('info-body');
    let html = '<div class="info-list">';
    
    // Full Title
    if (item.title) {
        html += `<div class="info-item"><span class="info-label">Full Title</span> <span class="info-value info-title-value">${escapeHtml(item.title)}</span></div>`;
    }

    // Progress
    const isMovie = isMovieList(found.listName);
    if (!isMovie && (item.seasons || item.episodes)) {
        html += `<div class="info-item"><span class="info-label">Progress</span> <span class="info-value">${item.seasons ? `S${item.seasons}` : ''}${item.seasons && item.episodes ? ' ' : ''}${item.episodes ? `E${item.episodes}` : ''}</span></div>`;
    }
    
    // Rating
    if (item.rating && item.rating.overall) {
        html += `<div class="info-item"><span class="info-label">Rating</span> <div class="info-rating">${item.rating.overall}</div></div>`;
    }
    
    // Sub Ratings
    if (item.rating && (item.rating.art || item.rating.story || item.rating.characters || item.rating.music)) {
        let srHtml = '<div class="info-sub-ratings">';
        if (item.rating.art) srHtml += `<div class="sub-rating-badge"><span>Art</span> <span class="sub-rating-emoji">${item.rating.art}</span></div>`;
        if (item.rating.story) srHtml += `<div class="sub-rating-badge"><span>Story</span> <span class="sub-rating-emoji">${item.rating.story}</span></div>`;
        if (item.rating.characters) srHtml += `<div class="sub-rating-badge"><span>Characters</span> <span class="sub-rating-emoji">${item.rating.characters}</span></div>`;
        if (item.rating.music) srHtml += `<div class="sub-rating-badge"><span>Music</span> <span class="sub-rating-emoji">${item.rating.music}</span></div>`;
        srHtml += '</div>';
        html += `<div class="info-item"><span class="info-label">Sub Ratings</span> ${srHtml}</div>`;
    }
    
    // Group
    if (item.group) {
        html += `<div class="info-item"><span class="info-label">Group</span> <span class="info-value">${escapeHtml(item.group)}</span></div>`;
    }
    
    // Tags
    if (item.tags && item.tags.length > 0) {
        const tagsHtml = item.tags.map(t => `<span class="tag-item">${escapeHtml(t)}</span>`).join('');
        html += `<div class="info-item"><span class="info-label">Tags</span> <div class="tags-container info-tags">${tagsHtml}</div></div>`;
    }
    
    // Note
    if (item.note) {
        html += `<div class="info-item info-note-item"><span class="info-label">Note</span> <div class="info-value info-note">${escapeHtml(item.note)}</div></div>`;
    }
    
    html += '</div>';
    body.innerHTML = html;
    
    if (infoModal) infoModal.classList.add('active');
}

function closeInfoModal() {
    if (infoModal) infoModal.classList.remove('active');
}

// ─── Modal ─────────────────────────────────────────
function openModal(itemId) {
    editingItemId = itemId;
    currentTags =[];
    resetForm();

    const statuses = document.querySelectorAll('.status-btn');
    const overalls = document.querySelectorAll('.overall-rating .rating-emoji');
    const waitingBtn = document.getElementById('item-waiting');
    let showSeriesFields = !isMovieTab(currentTab);

    if (itemId) {
        document.getElementById('modal-title').textContent = 'Edit Item';
        const found = findItem(itemId);
        if (found) {
            const item = found.item;
            showSeriesFields = !isMovieList(found.listName);

            document.getElementById('delete-item-btn').style.display = 'inline-block';
            document.getElementById('item-title').value = item.title || '';
            document.getElementById('item-image').value = item.image_url || '';
            document.getElementById('item-group').value = item.group || '';

            if (item.tags && Array.isArray(item.tags)) {
                currentTags = [...item.tags];
                currentTags.sort((a,b) => a.localeCompare(b));
            }
            renderTags();

            statuses.forEach(btn => btn.classList.toggle('selected', btn.dataset.value === item.status));
            if (waitingBtn) waitingBtn.classList.toggle('selected', !!item.waiting);
            overalls.forEach(btn => btn.classList.toggle('selected', item.rating && btn.dataset.value === item.rating.overall));

            if (item.rating) {
                setBonusRating('rating-art', item.rating.art);
                setBonusRating('rating-story', item.rating.story);
                setBonusRating('rating-characters', item.rating.characters);
                setBonusRating('rating-music', item.rating.music);
            }

            document.getElementById('item-seasons').value = item.seasons || '';
            document.getElementById('item-episodes').value = item.episodes || '';
            document.getElementById('item-note').value = item.note || '';
            document.getElementById('item-nsfw').checked = !!item.is_nsfw;
        }
    } else {
        document.getElementById('modal-title').textContent = 'Add Item';
        document.getElementById('delete-item-btn').style.display = 'none';
        const defaultStatus = getDefaultStatusForTab(currentTab);
        statuses.forEach(btn => btn.classList.toggle('selected', btn.dataset.value === defaultStatus));
        if (waitingBtn) waitingBtn.classList.remove('selected');
        renderTags();
    }

    seriesFieldsEl.style.display = showSeriesFields ? '' : 'none';
    editorModal.classList.add('active');
}

function closeModal() {
    if (editorModal) editorModal.classList.remove('active');
}

function resetForm() {
    document.getElementById('item-form').reset();
    document.querySelectorAll('.rating-emoji.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.status-btn.selected').forEach(el => el.classList.remove('selected'));
    document.getElementById('tags-container').innerHTML = '';
}

function setBonusRating(containerId, val) {
    document.querySelectorAll(`#${containerId} .rating-emoji`).forEach(btn =>
        btn.classList.toggle('selected', btn.dataset.value === val)
    );
}

function getSelectedBonus(containerId) {
    const sel = document.querySelector(`#${containerId} .rating-emoji.selected`);
    return sel ? sel.dataset.value : null;
}

function saveItem() {
    const title = document.getElementById('item-title').value.trim();
    if (!title) { alert("Title is required!"); return; }

    const image_url = document.getElementById('item-image').value.trim() || null;
    const group = document.getElementById('item-group').value.trim();
    const statusSel = document.querySelector('.status-btn.selected');
    const status = statusSel ? statusSel.dataset.value : 'watching';

    const overallSel = document.querySelector('.overall-rating .rating-emoji.selected');
    const rating = {
        overall: overallSel ? overallSel.dataset.value : null,
        art: getSelectedBonus('rating-art'),
        story: getSelectedBonus('rating-story'),
        characters: getSelectedBonus('rating-characters'),
        music: getSelectedBonus('rating-music')
    };

    const note = document.getElementById('item-note').value.trim();
    const is_nsfw = document.getElementById('item-nsfw').checked;

    const waitingBtn = document.getElementById('item-waiting');
    const waiting = waitingBtn ? waitingBtn.classList.contains('selected') : false;

    const buildItem = {
        title, image_url, group, tags: [...currentTags],
        status, waiting, rating, note, is_nsfw
    };

    let targetListName;

    if (editingItemId) {
        const found = findItem(editingItemId);
        if (found) {
            const isSeries = SERIES_LISTS.includes(found.listName);

            if (isSeries) {
                let seasons = document.getElementById('item-seasons').value;
                buildItem.seasons = seasons ? parseInt(seasons) : null;
                let episodes = document.getElementById('item-episodes').value;
                buildItem.episodes = episodes ? parseInt(episodes) : null;
            }

            Object.assign(found.item, buildItem);

            const wasPlanned = found.listName.includes('Planned');
            const nowPlanned = status === 'planned';

            if (wasPlanned !== nowPlanned) {
                const idx = state[found.listName].findIndex(i => i._id === editingItemId);
                if (idx !== -1) state[found.listName].splice(idx, 1);

                if (isSeries) {
                    targetListName = nowPlanned ? 'seriesListPlanned' : 'seriesListActive';
                } else {
                    targetListName = nowPlanned ? 'movieListPlanned' : 'movieListActive';
                }
                found.item.order = getNextOrder(targetListName);
                state[targetListName].push(found.item);
            }
        }
    } else {
        buildItem._id = generateId();
        const isSeries = !isMovieTab(currentTab);

        if (isSeries) {
            let seasons = document.getElementById('item-seasons').value;
            buildItem.seasons = seasons ? parseInt(seasons) : null;
            let episodes = document.getElementById('item-episodes').value;
            buildItem.episodes = episodes ? parseInt(episodes) : null;
        }

        if (isSeries) {
            targetListName = status === 'planned' ? 'seriesListPlanned' : 'seriesListActive';
        } else {
            targetListName = status === 'planned' ? 'movieListPlanned' : 'movieListActive';
        }

        buildItem.order = getNextOrder(targetListName);
        buildItem.tags.sort((a,b) => a.localeCompare(b));
        state[targetListName].push(buildItem);
    }

    renderLists();
    renderLibrary();
    closeModal();
}

function deleteItem() {
    if (!editingItemId) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    for (const listName of ALL_LISTS) {
        const idx = state[listName].findIndex(i => i._id === editingItemId);
        if (idx !== -1) {
            state[listName].splice(idx, 1);
            break;
        }
    }
    reorderAllLists();
    renderLists();
    renderLibrary();
    closeModal();
}

// ─── Tags ──────────────────────────────────────────
function renderTags() {
    const container = document.getElementById('tags-container');
    if (!container) return;
    container.innerHTML = currentTags.map((tag, i) => `
        <span class="tag-item" data-tag="${escapeHtml(tag)}">
            ${escapeHtml(tag)}
            <span class="tag-remove" onclick="removeTag(${i})">&times;</span>
        </span>
    `).join('');
}

function addTag(tagText) {
    if (tagText && !currentTags.includes(tagText)) {
        currentTags.push(tagText);
        currentTags.sort((a,b) => a.localeCompare(b));
        renderTags();
    }
}

window.removeTag = function (index) {
    currentTags.splice(index, 1);
    renderTags();
};

// ─── Utilities ─────────────────────────────────────
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getAllTags() {
    const tags = new Set();
    allItems().forEach(item => {
        if (item.tags) item.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
}

function showTagSuggestions(query) {
    const tagSuggestions = document.getElementById('tag-suggestions');
    const tagInput = document.getElementById('tag-input');
    if (!tagSuggestions || !tagInput) return;
    
    const allTags = getAllTags();
    const filtered = allTags.filter(t => (!query || t.toLowerCase().includes(query.toLowerCase())) && !currentTags.includes(t));
    
    if (filtered.length === 0) {
        tagSuggestions.style.display = 'none';
        return;
    }
    
    tagSuggestions.innerHTML = filtered.map(t => `<div class="tag-suggestion-item" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</div>`).join('');
    tagSuggestions.style.display = 'block';
    
    tagSuggestions.querySelectorAll('.tag-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            addTag(item.dataset.tag);
            tagInput.value = '';
            tagSuggestions.style.display = 'none';
            tagInput.focus();
        });
    });
}

function getAllGroups() {
    const groups = new Set();
    allItems().forEach(item => { if (item.group) groups.add(item.group); });
    return Array.from(groups).sort();
}

function showGroupSuggestions(query) {
    const groupSuggestions = document.getElementById('group-suggestions');
    const groupInput = document.getElementById('item-group');
    if (!groupSuggestions || !groupInput) return;
    
    const allGroups = getAllGroups();
    const isExactMatch = allGroups.includes(query);
    
    // If empty or perfectly matches an existing group (e.g. clicking a pre-filled input), show all options
    const filtered = allGroups.filter(g => !query || isExactMatch || g.toLowerCase().includes(query.toLowerCase()));
    
    if (filtered.length === 0) {
        groupSuggestions.style.display = 'none';
        return;
    }
    
    groupSuggestions.innerHTML = filtered.map(g => `<div class="tag-suggestion-item" data-group="${escapeHtml(g)}">${escapeHtml(g)}</div>`).join('');
    groupSuggestions.style.display = 'block';
    
    groupSuggestions.querySelectorAll('.tag-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            groupInput.value = item.dataset.group;
            groupSuggestions.style.display = 'none';
            groupInput.focus();
        });
    });
}

// ─── File I/O ──────────────────────────────────────
function exportJson() {
    const stripAndSort = list => [...list].sort((a, b) => a.order - b.order).map(item => {
        const out = {};
        if (item.title !== undefined) out.title = item.title;
        if (item.image_url !== undefined) out.image_url = item.image_url;
        if (item.group !== undefined) out.group = item.group;
        if (item.tags !== undefined) out.tags = item.tags;
        if (item.status !== undefined) out.status = item.status;
        out.waiting = item.waiting || false;
        if (item.rating !== undefined) out.rating = item.rating;
        if (item.seasons !== undefined) out.seasons = item.seasons;
        if (item.episodes !== undefined) out.episodes = item.episodes;
        if (item.note !== undefined) out.note = item.note;
        if (item.is_nsfw !== undefined) out.is_nsfw = item.is_nsfw;
        if (item.order !== undefined) out.order = item.order;
        return out;
    });
    const data = {
        seriesListActive: stripAndSort(state.seriesListActive),
        movieListActive: stripAndSort(state.movieListActive),
        seriesListPlanned: stripAndSort(state.seriesListPlanned),
        movieListPlanned: stripAndSort(state.movieListPlanned)
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anison_list.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const parsed = JSON.parse(e.target.result);

            if (parsed.seriesListActive !== undefined) {
                state.seriesListActive = parsed.seriesListActive ||[];
                state.movieListActive = parsed.movieListActive || [];
                state.seriesListPlanned = parsed.seriesListPlanned ||[];
                state.movieListPlanned = parsed.movieListPlanned ||[];
            } else if (parsed.seriesList || parsed.movieList) {
                state.seriesListActive = []; state.movieListActive = [];
                state.seriesListPlanned =[]; state.movieListPlanned = [];
                (parsed.seriesList ||[]).forEach(item => {
                    if (item.status === 'planned') state.seriesListPlanned.push(item);
                    else state.seriesListActive.push(item);
                });
                (parsed.movieList ||[]).forEach(item => {
                    if (item.status === 'planned') state.movieListPlanned.push(item);
                    else state.movieListActive.push(item);
                });
            }

            // Sort incoming arrays descending by order so that reorderAllLists assigns them correctly
            ALL_LISTS.forEach(listName => {
                if (state[listName] && state[listName].length > 0) {
                    state[listName].sort((a, b) => (b.order || 0) - (a.order || 0));
                }
            });

            allItems().forEach(item => { item._id = generateId(); });
            reorderAllLists();
            renderLists();
            renderLibrary();
        } catch (err) {
            alert("Error parsing JSON file!");
            console.error(err);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ─── Event Listeners ───────────────────────────────
function setupEventListeners() {
    // Toolbar: Shared
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderLibrary(); renderLists();
        });
    }

    document.querySelectorAll('.status-toggles input').forEach(cb => {
        cb.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (!visibleStatuses.includes(e.target.value)) visibleStatuses.push(e.target.value);
            } else {
                visibleStatuses = visibleStatuses.filter(s => s !== e.target.value);
            }
            renderLibrary(); renderLists();
        });
    });

    const infoModalEl = document.getElementById('info-modal');
    if (infoModalEl) {
        infoModalEl.addEventListener('click', (e) => {
            if (e.target === infoModalEl) closeInfoModal();
        });
    }

    if (true) {
        const addBtn = document.getElementById('add-btn');
        if (addBtn) addBtn.addEventListener('click', () => openModal(null));
        document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
        document.getElementById('save-item-btn').addEventListener('click', saveItem);
        document.getElementById('delete-item-btn').addEventListener('click', deleteItem);
        document.getElementById('export-btn').addEventListener('click', exportJson);
        document.getElementById('import-json').addEventListener('change', importJson);

        document.getElementById('clear-local-btn').addEventListener('click', () => {
            if (confirm("Clear all local data?")) {
                localStorage.removeItem('anison_data');
                ALL_LISTS.forEach(l => { state[l] =[]; });
                renderLists();
            }
        });

        const groupInput = document.getElementById('item-group');
        if (groupInput) {
            groupInput.addEventListener('keydown', (e) => {
                const groupSuggestions = document.getElementById('group-suggestions');
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (groupSuggestions) groupSuggestions.style.display = 'none';
                } else if (e.key === 'Escape') {
                    if (groupSuggestions) groupSuggestions.style.display = 'none';
                }
            });
            groupInput.addEventListener('input', (e) => {
                showGroupSuggestions(e.target.value.trim());
            });
            groupInput.addEventListener('focus', (e) => {
                showGroupSuggestions(e.target.value.trim());
            });
            groupInput.addEventListener('click', (e) => {
                showGroupSuggestions(e.target.value.trim());
            });
            document.addEventListener('click', (e) => {
                const groupSuggestions = document.getElementById('group-suggestions');
                if (groupInput && !groupInput.contains(e.target) && groupSuggestions && !groupSuggestions.contains(e.target)) {
                    groupSuggestions.style.display = 'none';
                }
            });
        }

        const tagInput = document.getElementById('tag-input');
        if (tagInput) {
            tagInput.addEventListener('keydown', (e) => {
                const tagSuggestions = document.getElementById('tag-suggestions');
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (tagInput.value.trim()) {
                        addTag(tagInput.value.trim());
                    }
                    tagInput.value = '';
                    if (tagSuggestions) tagSuggestions.style.display = 'none';
                } else if (e.key === 'Escape') {
                    if (tagSuggestions) tagSuggestions.style.display = 'none';
                }
            });
            tagInput.addEventListener('input', (e) => {
                showTagSuggestions(e.target.value.trim());
            });
            tagInput.addEventListener('focus', (e) => {
                showTagSuggestions(e.target.value.trim());
            });
            document.addEventListener('click', (e) => {
                const tagSuggestions = document.getElementById('tag-suggestions');
                if (tagInput && !tagInput.contains(e.target) && tagSuggestions && !tagSuggestions.contains(e.target)) {
                    tagSuggestions.style.display = 'none';
                }
            });
        }

        document.querySelectorAll('.rating-selector').forEach(sel => {
            sel.addEventListener('click', (e) => {
                if (e.target.classList.contains('rating-emoji')) {
                    const wasSelected = e.target.classList.contains('selected');
                    Array.from(sel.children).forEach(c => c.classList.remove('selected'));
                    if (!wasSelected) {
                        e.target.classList.add('selected');
                    }
                }
            });
        });

        const statusSel = document.getElementById('status-selector');
        if (statusSel) {
            statusSel.addEventListener('click', (e) => {
                if (e.target.classList.contains('status-btn')) {
                    document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('selected'));
                    e.target.classList.add('selected');
                } else if (e.target.classList.contains('waiting-btn')) {
                    e.target.classList.toggle('selected');
                }
            });
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchTab(btn.dataset.tab);
                saveToLocalStorage();
            });
        });

        initSortable();
    }
}

// Run
init();