// State Management
let appState = {
    listName: "My List",
    features: [], // { id, name }
    items: [],    // { id, name, imageBase64, tags: [{name, color}], scores: { featureId: scoreValue } }
    passwordHash: null
};

// DOM Elements
const views = {
    welcome: document.getElementById('welcome-view'),
    dashboard: document.getElementById('dashboard-view'),
    itemEditor: document.getElementById('item-editor-view'),
    featureConfig: document.getElementById('feature-config-view'),
    scoring: document.getElementById('scoring-view'),
    saveModal: document.getElementById('save-modal'),
    smartCompare: document.getElementById('smart-compare-modal'),
    createList: document.getElementById('create-list-view'),
    analytics: document.getElementById('analytics-view'),
    fullscreen: document.getElementById('fullscreen-overlay')
};

// Navigation
function showView(viewName) {
    Object.values(views).forEach(v => {
        if (v && v.classList) v.classList.add('hidden');
    });
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
        if (viewName === 'dashboard') {
            renderDashboard();
        }
        if (viewName === 'welcome') {
            renderWelcomeSession();
        }
    }
}

// Initialization & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Welcome View
    document.getElementById('btn-create-new').addEventListener('click', openCreateListModal);


    document.getElementById('btn-load-example').addEventListener('click', () => {
        if (appState.items.length > 0 || appState.features.length > 0) {
            if (!confirm("Caution: This will override your current list and any unsaved changes will be lost. Do you want to continue?")) return;
        }
        loadExampleList();
    });

    document.getElementById('file-upload').addEventListener('change', handleFileUpload);
    document.getElementById('btn-load-submit').addEventListener('click', handleFileDecrypt);

    // Dashboard View
    document.getElementById('list-title-input').addEventListener('input', (e) => {
        appState.listName = e.target.value;
    });
    document.getElementById('btn-return-home').addEventListener('click', () => {
        showView('welcome');
    });

    document.getElementById('btn-edit-features').addEventListener('click', () => showView('featureConfig'));
    document.getElementById('btn-add-item').addEventListener('click', () => openItemEditor(null));
    document.getElementById('btn-save-list').addEventListener('click', () => showView('saveModal'));
    document.getElementById('search-input').addEventListener('input', renderDashboard);
    document.getElementById('btn-smart-compare').addEventListener('click', startSmartCompare);
    document.getElementById('btn-analytics').addEventListener('click', openAnalytics);
    document.getElementById('btn-close-analytics').addEventListener('click', () => showView('dashboard'));
    document.getElementById('analytics-tabs').addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.analytics-tab');
        if (!tabBtn) return;
        analyticsState.tab = tabBtn.dataset.tab;
        document.querySelectorAll('.analytics-tab').forEach(b => b.classList.toggle('active', b === tabBtn));
        renderAnalytics();
    });

    // Create List View
    document.getElementById('btn-close-create-list').addEventListener('click', () => showView('welcome'));
    document.getElementById('btn-add-feature-new').addEventListener('click', addFeatureToNewList);
    document.getElementById('new-list-feature-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addFeatureToNewList();
    });
    document.getElementById('btn-execute-create').addEventListener('click', executeCreateNewList);

    // Feature Config View
    document.getElementById('btn-close-feature-config').addEventListener('click', () => {

        if (appState.features.length === 0) {
            alert("Please add at least one scoring feature.");
            return;
        }
        showView('dashboard');
    });
    document.getElementById('btn-add-feature').addEventListener('click', addFeature);
    // Enter key feature add
    document.getElementById('new-feature-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addFeature();
    });

    // Item Editor View
    document.getElementById('btn-close-item-editor').addEventListener('click', () => showView('dashboard'));
    document.getElementById('btn-add-tag').addEventListener('click', addTagToItemEditor);
    document.getElementById('existing-tags-dropdown').addEventListener('change', addExistingTagToItemEditor);
    document.getElementById('btn-save-item').addEventListener('click', saveItem);
    setupImageDropZone('item-image-drop-zone', 'item-image-input', 'item-image-preview');

    // Scoring View
    document.getElementById('btn-close-scoring').addEventListener('click', () => {
        saveScoresToState();
        showView('dashboard');
    });

    // Save Modal
    document.getElementById('btn-close-save').addEventListener('click', () => showView('dashboard'));
    document.getElementById('btn-execute-save').addEventListener('click', executeSave);

    // Smart Compare Modal
    document.getElementById('btn-close-smart-compare').addEventListener('click', () => showView('dashboard'));
    document.getElementById('btn-start-smart-compare').addEventListener('click', executeSmartCompareStep);
    document.getElementById('btn-finish-compare').addEventListener('click', () => showView('dashboard'));

    // Fullscreen Overlay
    document.getElementById('scoring-item-image').addEventListener('click', (e) => openFullscreenImage(e.target.src));
    document.getElementById('compare-img-a').addEventListener('click', (e) => openFullscreenImage(e.target.src));
    document.getElementById('compare-img-b').addEventListener('click', (e) => openFullscreenImage(e.target.src));

    document.querySelector('.fullscreen-bg').addEventListener('click', closeFullscreenImage);
    document.querySelector('.fullscreen-close').addEventListener('click', closeFullscreenImage);
});

function openFullscreenImage(src) {
    if (!src) return;
    const overlay = document.getElementById('fullscreen-overlay');
    const img = document.getElementById('fullscreen-img');
    img.src = src;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeFullscreenImage() {
    const overlay = document.getElementById('fullscreen-overlay');
    overlay.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
}

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    document.getElementById('themeToggle').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggle');
    btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// --- New List Creation Flow ---
let tempNewListState = {
    name: "My List",
    features: []
};

function openCreateListModal() {
    tempNewListState = {
        name: "My List",
        features: []
    };
    document.getElementById('new-list-name-input').value = tempNewListState.name;
    renderNewListFeatures();
    showView('createList');
}

function addFeatureToNewList() {
    const input = document.getElementById('new-list-feature-name');
    const name = input.value.trim();
    if (!name) return;

    if (tempNewListState.features.some(f => f.name.toLowerCase() === name.toLowerCase())) {
        alert("This feature already exists.");
        return;
    }

    tempNewListState.features.push({
        id: 'feat_' + Date.now(),
        name: name
    });
    input.value = '';
    renderNewListFeatures();
}

function removeFeatureFromNewList(id) {
    tempNewListState.features = tempNewListState.features.filter(f => f.id !== id);
    renderNewListFeatures();
}

function renderNewListFeatures() {
    const list = document.getElementById('new-list-features-list');
    list.innerHTML = '';
    tempNewListState.features.forEach(feat => {
        const d = document.createElement('div');
        d.className = 'form-group';
        d.style.display = 'flex';
        d.style.alignItems = 'center';
        d.style.gap = '10px';
        d.style.background = 'var(--tertiary-bg)';
        d.style.padding = '8px 12px';
        d.style.borderRadius = '5px';
        d.style.marginBottom = '5px';

        d.innerHTML = `
            <div style="flex-grow:1; font-weight:600; font-size:0.9em;">${feat.name}</div>
            <button class="btn-close" style="font-size:1em;" onclick="removeFeatureFromNewList('${feat.id}')"><i class="fas fa-times"></i></button>
        `;
        list.appendChild(d);
    });
}

function executeCreateNewList() {
    const name = document.getElementById('new-list-name-input').value.trim();
    if (!name) {
        alert("Please enter a name for your list.");
        return;
    }
    if (tempNewListState.features.length === 0) {
        alert("Please add at least one scoring feature (e.g., Graphics, Quality, etc.)");
        return;
    }

    appState = {
        listName: name,
        features: [...tempNewListState.features],
        items: [],
        passwordHash: null
    };

    document.getElementById('list-title-input').value = appState.listName;
    showView('dashboard');
}

function renderWelcomeSession() {
    const container = document.getElementById('active-list-card-container');
    if (appState && appState.items && (appState.items.length > 0 || appState.features.length > 0)) {
        container.innerHTML = `
            <div class="card clickable" style="border: 2px solid var(--accent-color); background: rgba(156, 163, 175, 0.1); margin-bottom: 20px;">
                <i class="fas fa-play-circle card-icon" style="color: var(--accent-color);"></i>
                <h3 class="card-title">Continue: ${appState.listName}</h3>
                <p class="card-description">Your currently loaded list is ready. Quick enter without password.</p>
                <button class="btn" style="margin-top: 15px;" onclick="showView('dashboard')">Open List</button>
            </div>
            <div style="margin: 20px 0; text-align: center; border-bottom: 1px solid var(--border-color); line-height: 0.1em;">
                <span style="background: var(--dark-bg); padding: 0 10px; opacity: 0.5;">OR</span>
            </div>
        `;
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function loadExampleList() {
    appState = {
        listName: "Vegetables vs Fruits",
        features: [
            { id: "feat_1", name: "Taste" },
            { id: "feat_2", name: "Price / Value" }
        ],
        items: [
            {
                id: "item_1", name: "Apple", imageBase64: "./apple.webp",
                tags: [{ name: "Fruit", color: "#e84118" }, { name: "Vitamin C", color: "#fbc531" }],
                scores: { "feat_1": 8, "feat_2": 6 }
            },
            {
                id: "item_2", name: "Banana", imageBase64: "./banana.webp",
                tags: [{ name: "Fruit", color: "#e84118" }, { name: "Potassium", color: "#8c7ae6" }],
                scores: { "feat_1": 9, "feat_2": 8 }
            },
            {
                id: "item_3", name: "Broccoli", imageBase64: "./brocoli.webp",
                tags: [{ name: "Vegetable", color: "#44bd32" }, { name: "Iron", color: "#7f8fa6" }],
                scores: { "feat_1": 5, "feat_2": 6.5 }
            },
            {
                id: "item_4", name: "Carrot", imageBase64: "./carrot.webp",
                tags: [{ name: "Vegetable", color: "#44bd32" }, { name: "Vitamin A", color: "#e1b12c" }],
                scores: { "feat_1": 7, "feat_2": 9 }
            }
        ],
        passwordHash: null
    };
    document.getElementById('list-title-input').value = appState.listName;
    showView('dashboard');
}

// --- Image Drop Zone Helper ---
function setupImageDropZone(zoneId, inputId, previewId) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageFile(e.dataTransfer.files[0], preview, zone);
        }
    });

    input.addEventListener('change', () => {
        if (input.files && input.files[0]) {
            handleImageFile(input.files[0], preview, zone);
        }
    });
}

function handleImageFile(file, previewEl, zoneEl) {
    if (!file.type.match('image.*')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewEl.src = e.target.result;
        previewEl.style.display = 'block';
        zoneEl.querySelector('i').style.display = 'none';
        let p = zoneEl.querySelector('p');
        if (p) p.style.display = 'none';

        previewEl.dataset.base64 = e.target.result;
    };
    reader.readAsDataURL(file);
}

// --- File Save / Load (Encryption) ---
let encryptedFileContent = null;

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.encrypted) {
                encryptedFileContent = data.ciphertext;
                document.getElementById('password-prompt').classList.remove('hidden');
            } else {
                appState = data;
                if (!appState.listName) appState.listName = "Loaded List";
                document.getElementById('list-title-input').value = appState.listName;
                showView('dashboard');
            }
        } catch (err) {
            alert('Invalid file format.');
        }
    };
    reader.readAsText(file);
}

function handleFileDecrypt() {
    const pwd = document.getElementById('load-password').value;
    const errorMsg = document.getElementById('load-error');

    if (!pwd) {
        errorMsg.textContent = "Please enter password.";
        return;
    }

    try {
        const bytes = CryptoJS.AES.decrypt(encryptedFileContent, pwd);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedStr) throw new Error("Wrong password");

        appState = JSON.parse(decryptedStr);
        if (!appState.listName) appState.listName = "Loaded List";
        document.getElementById('list-title-input').value = appState.listName;

        errorMsg.textContent = "";
        document.getElementById('load-password').value = "";
        showView('dashboard');
    } catch (err) {
        errorMsg.textContent = "Wrong password or corrupted file!";
    }
}

function executeSave() {
    const pwd = document.getElementById('save-password').value;
    let filename = document.getElementById('save-filename').value || 'score_list';
    if (!filename.endsWith('.json')) filename += '.json';

    if (!pwd) {
        alert("Please enter a password to encrypt the list.");
        return;
    }

    const jsonStr = JSON.stringify(appState);
    const ciphertext = CryptoJS.AES.encrypt(jsonStr, pwd).toString();

    const exportData = {
        encrypted: true,
        ciphertext: ciphertext
    };

    const blob = new Blob([JSON.stringify(exportData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.getElementById('save-password').value = "";
    showView('dashboard');
}

// --- Feature Configuration ---
function renderFeaturesList() {
    const list = document.getElementById('features-list');
    list.innerHTML = '';
    appState.features.forEach(feat => {
        const d = document.createElement('div');
        d.className = 'form-group';
        d.style.display = 'flex';
        d.style.alignItems = 'center';
        d.style.gap = '10px';
        d.style.background = 'var(--tertiary-bg)';
        d.style.padding = '10px';
        d.style.borderRadius = '5px';

        d.innerHTML = `
            <div style="flex-grow:1; font-weight:bold;">${feat.name}</div>
            <button class="btn-close" onclick="confirmRemoveFeature('${feat.id}', '${feat.name}')"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(d);
    });
}

function confirmRemoveFeature(id, name) {
    if (confirm(`Are you sure you want to delete the feature "${name}"? This will remove its score data from ALL items completely.`)) {
        appState.features = appState.features.filter(f => f.id !== id);
        appState.items.forEach(item => {
            if (item.scores[id] !== undefined) delete item.scores[id];
        });
        renderFeaturesList();
    }
}

function addFeature() {
    const nameInput = document.getElementById('new-feature-name');
    const name = nameInput.value.trim();
    if (!name) return;

    appState.features.push({
        id: 'feat_' + Date.now(),
        name: name
    });

    nameInput.value = '';
    renderFeaturesList();
}

const originalShowView = showView;
showView = function (viewName) {
    if (viewName === 'featureConfig') renderFeaturesList();
    originalShowView(viewName);
}

// --- Item Editor ---
let currentEditorItemTags = [];

function updateExistingTagsDropdown() {
    const select = document.getElementById('existing-tags-dropdown');
    select.innerHTML = '<option value="">Select existing tag...</option>';

    const allTagsMap = new Map();
    appState.items.forEach(item => {
        item.tags.forEach(t => allTagsMap.set(t.name, t.color));
    });

    allTagsMap.forEach((color, name) => {
        let existsInCurrent = currentEditorItemTags.some(t => t.name === name);
        if (!existsInCurrent) {
            let opt = document.createElement('option');
            opt.value = name;
            opt.dataset.color = color;
            opt.textContent = name;
            select.appendChild(opt);
        }
    });
}

function openItemEditor(itemId = null) {
    const nameInput = document.getElementById('editor-item-name');
    const preview = document.getElementById('item-image-preview');
    const idInput = document.getElementById('editor-item-id');
    const tagsContainer = document.getElementById('item-tags-container');
    const zoneIcon = document.getElementById('item-image-drop-zone').querySelector('i');
    const zoneText = document.getElementById('item-image-drop-zone').querySelector('p');

    tagsContainer.innerHTML = '';
    currentEditorItemTags = [];

    if (itemId && typeof itemId === 'string') {
        const item = appState.items.find(i => i.id === itemId);
        if (item) {
            idInput.value = item.id;
            nameInput.value = item.name;
            currentEditorItemTags = [...item.tags];
            if (item.imageBase64) {
                preview.src = item.imageBase64;
                preview.dataset.base64 = item.imageBase64;
                preview.style.display = 'block';
                zoneIcon.style.display = 'none';
                zoneText.style.display = 'none';
            } else {
                preview.src = '';
                preview.dataset.base64 = '';
                preview.style.display = 'none';
                zoneIcon.style.display = 'inline-block';
                zoneText.style.display = 'block';
            }
        }
    } else {
        idInput.value = '';
        nameInput.value = '';
        preview.src = '';
        preview.dataset.base64 = '';
        preview.style.display = 'none';
        zoneIcon.style.display = 'inline-block';
        zoneText.style.display = 'block';
    }

    updateExistingTagsDropdown();
    renderEditorTags();
    showView('itemEditor');
}

function addExistingTagToItemEditor() {
    const select = document.getElementById('existing-tags-dropdown');
    if (!select.value) return;

    const selectedOpt = select.options[select.selectedIndex];
    const name = selectedOpt.value;
    const color = selectedOpt.dataset.color;

    if (name && !currentEditorItemTags.find(t => t.name === name)) {
        currentEditorItemTags.push({ name: name, color: color });
        updateExistingTagsDropdown();
        renderEditorTags();
    }
    select.value = "";
}

function addTagToItemEditor() {
    const tagInput = document.getElementById('new-tag-input');
    const colorInput = document.getElementById('new-tag-color');
    const name = tagInput.value.trim();

    if (name && !currentEditorItemTags.find(t => t.name === name)) {
        currentEditorItemTags.push({ name: name, color: colorInput.value });
        tagInput.value = '';
        updateExistingTagsDropdown();
        renderEditorTags();
    }
}

function removeTagFromEditor(tagName) {
    currentEditorItemTags = currentEditorItemTags.filter(t => t.name !== tagName);
    updateExistingTagsDropdown();
    renderEditorTags();
}

function renderEditorTags() {
    const c = document.getElementById('item-tags-container');
    c.innerHTML = '';
    currentEditorItemTags.forEach(tag => {
        const s = document.createElement('span');
        s.className = 'tag';
        s.style.backgroundColor = tag.color;
        s.innerHTML = `${tag.name} <span class="remove-tag" onclick="removeTagFromEditor('${tag.name}')"><i class="fas fa-times"></i></span>`;
        c.appendChild(s);
    });
}

function saveItem() {
    const id = document.getElementById('editor-item-id').value;
    const name = document.getElementById('editor-item-name').value.trim();
    const preview = document.getElementById('item-image-preview');
    const base64 = preview.dataset.base64 || null;

    if (!name) {
        alert("Please enter an item name.");
        return;
    }

    if (id) {
        const idx = appState.items.findIndex(i => i.id === id);
        if (idx !== -1) {
            appState.items[idx].name = name;
            appState.items[idx].tags = [...currentEditorItemTags];
            if (base64) appState.items[idx].imageBase64 = base64;
        }
    } else {
        appState.items.push({
            id: 'item_' + Date.now(),
            name: name,
            imageBase64: base64,
            tags: [...currentEditorItemTags],
            scores: {}
        });
    }

    showView('dashboard');
}

function confirmDeleteItem(itemId, itemName) {
    if (confirm(`Are you sure you want to completely delete "${itemName}"? This item's score data and tags will be removed.`)) {
        appState.items = appState.items.filter(i => i.id !== itemId);
        renderDashboard();
    }
}

// --- Dashboard ---
function renderDashboard() {
    const c = document.getElementById('items-grid');
    const searchQ = document.getElementById('search-input').value.toLowerCase();

    const addCard = document.getElementById('btn-add-item');
    c.innerHTML = '';

    const allTagsMap = new Map();

    appState.items.forEach(item => {
        let avg = 0;
        let count = 0;
        appState.features.forEach(f => {
            if (item.scores[f.id] !== undefined) {
                avg += item.scores[f.id];
                count++;
            }
        });
        avg = count > 0 ? (avg / count).toFixed(1) : 'New';

        item.tags.forEach(t => allTagsMap.set(t.name, t.color));

        const matchesSearch = item.name.toLowerCase().includes(searchQ) || item.tags.some(t => t.name.toLowerCase().includes(searchQ));
        if (!matchesSearch) return;

        const card = document.createElement('div');
        card.className = 'card clickable item-card';
        card.onclick = (e) => {
            if (e.target.closest('.edit-btn-mini')) {
                openItemEditor(item.id);
            } else if (e.target.closest('.delete-btn-mini')) {
                confirmDeleteItem(item.id, item.name);
            } else {
                openScoring(item.id);
            }
        };

        const imgHtml = item.imageBase64
            ? `<img src="${item.imageBase64}" class="item-card-image">`
            : `<div class="item-card-image-placeholder"><i class="fas fa-image"></i></div>`;

        let tagsHtml = item.tags.map(t => `<span class="tag" style="background:${t.color}; padding: 2px 6px; font-size:0.7em;">${t.name}</span>`).join('');

        card.innerHTML = `
            ${imgHtml}
            <div class="item-card-content">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3 class="card-title" style="margin-bottom:5px;">${item.name}</h3>
                    <div style="display:flex; gap: 5px;">
                        <button class="btn-outline edit-btn-mini" style="padding:4px 8px; border-radius:3px; border:1px solid var(--border-color); cursor:pointer;" onclick="event.stopPropagation(); openItemEditor('${item.id}')" title="Edit Item"><i class="fas fa-edit"></i></button>
                        <button class="btn-outline delete-btn-mini" style="padding:4px 8px; border-radius:3px; border:1px solid var(--border-color); cursor:pointer; color: #ff6b6b; border-color: #ff6b6b;" onclick="event.stopPropagation(); confirmDeleteItem('${item.id}', '${item.name}')" title="Delete Item"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="tags-container" style="margin-bottom: 10px;">${tagsHtml}</div>
                <div class="item-card-score">${avg} <span style="font-size:0.5em; color:var(--text-light); font-weight:normal;">/ 10</span></div>
            </div>
        `;
        c.appendChild(card);
    });

    c.appendChild(addCard);
    renderDashboardTags(allTagsMap);
}

function renderDashboardTags(tagsMap) {
    const c = document.getElementById('tags-filter-container');
    c.innerHTML = '<span style="font-size:0.9em; margin-right:10px; opacity:0.7;">Filters:</span>';
    const s = document.createElement('span');
    s.className = 'tag clickable-tag';
    s.style.backgroundColor = 'var(--bg-tertiary)';
    s.style.color = 'var(--text-primary)';
    s.style.border = '1px solid var(--border-color)';
    s.style.cursor = 'pointer';
    s.innerHTML = 'Clear Filters';
    s.onclick = () => {
        document.getElementById('search-input').value = '';
        renderDashboard();
    };
    c.appendChild(s);

    tagsMap.forEach((color, name) => {
        const s = document.createElement('span');
        s.className = 'tag clickable-tag';
        s.style.backgroundColor = color;
        s.style.cursor = 'pointer';
        s.style.opacity = '0.9';
        s.innerHTML = name;
        s.onclick = () => {
            document.getElementById('search-input').value = name;
            renderDashboard();
        };
        c.appendChild(s);
    });
}

// --- Scoring Logic ---
let activeScoringItemId = null;

function openScoring(itemId) {
    activeScoringItemId = itemId;
    const item = appState.items.find(i => i.id === itemId);

    document.getElementById('scoring-item-name').textContent = "Evaluating: " + item.name;

    const imgEl = document.getElementById('scoring-item-image');
    if (item.imageBase64) {
        imgEl.src = item.imageBase64;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    const tagsC = document.getElementById('scoring-item-tags');
    tagsC.innerHTML = item.tags.map(t => `<span class="tag" style="background:${t.color};">${t.name}</span>`).join('');

    renderScoringSliders(item);
    updateOverallAverage(item);

    showView('scoring');
}

function renderScoringSliders(item) {
    const list = document.getElementById('scoring-features-list');
    list.innerHTML = '';

    appState.features.forEach(f => {
        const currentScore = item.scores[f.id] || 5;

        const d = document.createElement('div');
        d.className = 'score-slider-container';

        let suggestionText = getSmartSuggestionForFeature(f.id, currentScore, item.id);

        d.innerHTML = `
            <div class="score-slider-header">
                <div style="font-weight:bold;">${f.name}</div>
                <div style="font-size:1.2em; font-weight:bold; color:var(--accent-color);" id="score-val-${f.id}">${currentScore}</div>
            </div>
            <input type="range" id="slider-${f.id}" min="0" max="10" step="0.5" value="${currentScore}">
            <span class="smart-suggestion" id="sug-${f.id}">${suggestionText}</span>
        `;

        list.appendChild(d);

        const slider = d.querySelector(`#slider-${f.id}`);
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById(`score-val-${f.id}`).textContent = val;
            item.scores[f.id] = val;
            updateOverallAverage(item);
            document.getElementById(`sug-${f.id}`).textContent = getSmartSuggestionForFeature(f.id, val, item.id);
        });
    });
}

function getSmartSuggestionForFeature(featId, currentScore, currentItemId) {
    let others = appState.items.filter(i => i.id !== currentItemId && i.scores[featId] !== undefined);
    if (others.length === 0) return "No other items evaluated yet.";

    others.sort((a, b) => Math.abs(a.scores[featId] - currentScore) - Math.abs(b.scores[featId] - currentScore));

    let closest = others[0];
    let s = closest.scores[featId];
    if (s > currentScore) return `Similar: ${closest.name} (${s}). Is it worse?`;
    if (s < currentScore) return `Similar: ${closest.name} (${s}). Is it better?`;
    return `Equal: ${closest.name} (${s}). Are they the similar?`;
}

function saveScoresToState() {
    if (!activeScoringItemId) return;
    const item = appState.items.find(i => i.id === activeScoringItemId);
    appState.features.forEach(f => {
        const slider = document.getElementById(`slider-${f.id}`);
        if (slider) {
            item.scores[f.id] = parseFloat(slider.value);
        }
    });
}

function updateOverallAverage(item) {
    let avg = 0;
    let count = 0;
    appState.features.forEach(f => {
        if (item.scores[f.id] !== undefined) {
            avg += item.scores[f.id];
            count++;
        }
    });
    const finalAvg = count > 0 ? (avg / count).toFixed(1) : '0.0';
    document.getElementById('scoring-overall-average').textContent = finalAvg;
}

// --- Analytics (read-only visualization, never mutates appState) ---
let analyticsState = {
    tab: 'ranking',
    sortKey: 'avg',      // 'avg' or a feature id
    sortDir: 'desc',
    manualOrder: null,   // array of item ids after user drag-reorder (visual only)
    scatterX: null,
    scatterY: null,
    scatterOffsets: {}   // itemId -> {dx, dy} visual drag offsets
};

function openAnalytics() {
    if (appState.items.length === 0) {
        alert("Add some items first to see analytics.");
        return;
    }
    // Reset transient visual state each time the modal opens
    analyticsState.manualOrder = null;
    analyticsState.scatterOffsets = {};
    if (!appState.features.some(f => f.id === analyticsState.scatterX)) analyticsState.scatterX = appState.features[0] ? appState.features[0].id : null;
    if (!appState.features.some(f => f.id === analyticsState.scatterY)) analyticsState.scatterY = appState.features[1] ? appState.features[1].id : analyticsState.scatterX;
    if (!(analyticsState.sortKey === 'avg' || appState.features.some(f => f.id === analyticsState.sortKey))) analyticsState.sortKey = 'avg';
    showView('analytics');
    renderAnalytics();
}

function getItemAvg(item) {
    let sum = 0, count = 0;
    appState.features.forEach(f => {
        if (item.scores[f.id] !== undefined) { sum += item.scores[f.id]; count++; }
    });
    return count > 0 ? sum / count : null;
}

function getMetricValue(item, key) {
    if (key === 'avg') return getItemAvg(item);
    return item.scores[key] !== undefined ? item.scores[key] : null;
}

function scoreColor(v) {
    // 0 -> red, 5 -> yellow, 10 -> green
    const hue = Math.max(0, Math.min(10, v)) * 12; // 0..120
    return `hsl(${hue}, 65%, 45%)`;
}

function analyticsThumb(item, size) {
    return item.imageBase64
        ? `<img src="${item.imageBase64}" class="rank-thumb" style="width:${size}px;height:${size}px;" alt="">`
        : `<div class="rank-thumb-placeholder" style="width:${size}px;height:${size}px;"><i class="fas fa-image"></i></div>`;
}

function renderAnalytics() {
    const controls = document.getElementById('analytics-controls');
    const body = document.getElementById('analytics-body');
    const hint = document.getElementById('analytics-hint');
    controls.innerHTML = '';
    body.innerHTML = '';
    hint.textContent = '';

    switch (analyticsState.tab) {
        case 'ranking': renderAnalyticsRanking(controls, body, hint); break;
        case 'breakdown': renderAnalyticsBreakdown(controls, body, hint); break;
        case 'scatter': renderAnalyticsScatter(controls, body, hint); break;
        case 'insights': renderAnalyticsInsights(controls, body, hint); break;
    }
}

function buildMetricSelect(id, selected, includeAvg) {
    let opts = includeAvg ? `<option value="avg" ${selected === 'avg' ? 'selected' : ''}>Overall Average</option>` : '';
    appState.features.forEach(f => {
        opts += `<option value="${f.id}" ${selected === f.id ? 'selected' : ''}>${f.name}</option>`;
    });
    return `<select id="${id}" class="input-field">${opts}</select>`;
}

// -- Ranking tab: sortable horizontal bars with drag-reorder --
function renderAnalyticsRanking(controls, body, hint) {
    controls.innerHTML = `
        <label>Sort by</label>
        ${buildMetricSelect('analytics-sort-key', analyticsState.sortKey, true)}
        <button class="btn btn-outline" id="analytics-sort-dir" style="padding: 8px 14px;">
            <i class="fas fa-sort-amount-${analyticsState.sortDir === 'desc' ? 'down' : 'up'}"></i>
            ${analyticsState.sortDir === 'desc' ? 'High → Low' : 'Low → High'}
        </button>
    `;
    controls.querySelector('#analytics-sort-key').addEventListener('change', (e) => {
        analyticsState.sortKey = e.target.value;
        analyticsState.manualOrder = null;
        renderAnalytics();
    });
    controls.querySelector('#analytics-sort-dir').addEventListener('click', () => {
        analyticsState.sortDir = analyticsState.sortDir === 'desc' ? 'asc' : 'desc';
        analyticsState.manualOrder = null;
        renderAnalytics();
    });

    let items = [...appState.items];
    if (analyticsState.manualOrder) {
        items.sort((a, b) => analyticsState.manualOrder.indexOf(a.id) - analyticsState.manualOrder.indexOf(b.id));
    } else {
        items.sort((a, b) => {
            const va = getMetricValue(a, analyticsState.sortKey);
            const vb = getMetricValue(b, analyticsState.sortKey);
            if (va === null && vb === null) return 0;
            if (va === null) return 1;
            if (vb === null) return -1;
            return analyticsState.sortDir === 'desc' ? vb - va : va - vb;
        });
    }

    const list = document.createElement('div');
    items.forEach((item, idx) => {
        const val = getMetricValue(item, analyticsState.sortKey);
        const row = document.createElement('div');
        row.className = 'rank-row';
        row.draggable = true;
        row.dataset.itemId = item.id;
        row.innerHTML = `
            <div class="rank-pos">${idx + 1}</div>
            ${analyticsThumb(item, 44)}
            <div class="rank-info">
                <div class="rank-name">${item.name}</div>
                <div class="rank-bar-track">
                    <div class="rank-bar-fill" style="width:${val === null ? 0 : val * 10}%; background:${val === null ? 'transparent' : scoreColor(val)};"></div>
                </div>
            </div>
            <div class="rank-score" style="color:${val === null ? 'var(--text-light)' : scoreColor(val)};">${val === null ? '—' : val.toFixed(1)}</div>
        `;
        list.appendChild(row);
    });
    body.appendChild(list);
    setupRankDrag(list);

    hint.textContent = 'Drag rows to rearrange them visually. This only changes the display — your saved data is never modified.';
}

function setupRankDrag(list) {
    let draggedId = null;

    list.querySelectorAll('.rank-row').forEach(row => {
        row.addEventListener('dragstart', () => {
            draggedId = row.dataset.itemId;
            row.classList.add('dragging');
        });
        row.addEventListener('dragend', () => {
            draggedId = null;
            row.classList.remove('dragging');
            list.querySelectorAll('.rank-row').forEach(r => r.classList.remove('drag-over'));
        });
        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (row.dataset.itemId !== draggedId) row.classList.add('drag-over');
        });
        row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
        row.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetId = row.dataset.itemId;
            if (!draggedId || draggedId === targetId) return;
            const order = Array.from(list.querySelectorAll('.rank-row')).map(r => r.dataset.itemId);
            const from = order.indexOf(draggedId);
            const to = order.indexOf(targetId);
            order.splice(from, 1);
            order.splice(to, 0, draggedId);
            analyticsState.manualOrder = order;
            renderAnalytics();
        });
    });
}

// -- Breakdown tab: per-item feature bars --
function renderAnalyticsBreakdown(controls, body, hint) {
    controls.innerHTML = `
        <label>Sort by</label>
        ${buildMetricSelect('analytics-sort-key', analyticsState.sortKey, true)}
    `;
    controls.querySelector('#analytics-sort-key').addEventListener('change', (e) => {
        analyticsState.sortKey = e.target.value;
        renderAnalytics();
    });

    const items = [...appState.items].sort((a, b) => {
        const va = getMetricValue(a, analyticsState.sortKey);
        const vb = getMetricValue(b, analyticsState.sortKey);
        return (vb === null ? -1 : vb) - (va === null ? -1 : va);
    });

    items.forEach(item => {
        const avg = getItemAvg(item);
        const card = document.createElement('div');
        card.className = 'breakdown-item';

        let rows = '';
        appState.features.forEach(f => {
            const v = item.scores[f.id];
            rows += `
                <div class="breakdown-feat-row">
                    <div class="breakdown-feat-name">${f.name}</div>
                    <div class="rank-bar-track" style="flex:1;">
                        <div class="rank-bar-fill" style="width:${v === undefined ? 0 : v * 10}%; background:${v === undefined ? 'transparent' : scoreColor(v)};"></div>
                    </div>
                    <div class="breakdown-feat-val">${v === undefined ? '—' : v}</div>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="breakdown-head">
                ${analyticsThumb(item, 40)}
                <div style="flex:1; font-weight:600;">${item.name}</div>
                <div style="font-weight:bold; color:${avg === null ? 'var(--text-light)' : scoreColor(avg)};">${avg === null ? 'New' : avg.toFixed(1)} <span style="font-size:0.7em; opacity:0.6; font-weight:normal;">avg</span></div>
            </div>
            ${rows}
        `;
        body.appendChild(card);
    });

    hint.textContent = 'Every feature score per item, side by side. Colors go from red (low) to green (high).';
}

// -- Scatter tab: two features as X/Y axes, draggable dots (visual only) --
function renderAnalyticsScatter(controls, body, hint) {
    if (!analyticsState.scatterX) {
        body.innerHTML = '<p style="opacity:0.7;">You need at least one scoring feature for the scatter chart.</p>';
        return;
    }

    controls.innerHTML = `
        <label>X axis</label>
        ${buildMetricSelect('analytics-scatter-x', analyticsState.scatterX, false)}
        <label>Y axis</label>
        ${buildMetricSelect('analytics-scatter-y', analyticsState.scatterY, false)}
        <button class="btn btn-outline" id="analytics-scatter-reset" style="padding: 8px 14px;"><i class="fas fa-undo"></i> Reset positions</button>
    `;
    controls.querySelector('#analytics-scatter-x').addEventListener('change', (e) => {
        analyticsState.scatterX = e.target.value;
        analyticsState.scatterOffsets = {};
        renderAnalytics();
    });
    controls.querySelector('#analytics-scatter-y').addEventListener('change', (e) => {
        analyticsState.scatterY = e.target.value;
        analyticsState.scatterOffsets = {};
        renderAnalytics();
    });
    controls.querySelector('#analytics-scatter-reset').addEventListener('click', () => {
        analyticsState.scatterOffsets = {};
        renderAnalytics();
    });

    const W = 720, H = 480, PAD = 50;
    const featX = appState.features.find(f => f.id === analyticsState.scatterX);
    const featY = appState.features.find(f => f.id === analyticsState.scatterY);
    const toX = v => PAD + (v / 10) * (W - PAD * 2);
    const toY = v => H - PAD - (v / 10) * (H - PAD * 2);

    // Grid lines + labels
    let grid = '';
    for (let i = 0; i <= 10; i += 2) {
        grid += `<line x1="${toX(i)}" y1="${PAD}" x2="${toX(i)}" y2="${H - PAD}" stroke="var(--border-color)" stroke-width="0.5" opacity="0.4"/>`;
        grid += `<line x1="${PAD}" y1="${toY(i)}" x2="${W - PAD}" y2="${toY(i)}" stroke="var(--border-color)" stroke-width="0.5" opacity="0.4"/>`;
        grid += `<text x="${toX(i)}" y="${H - PAD + 20}" text-anchor="middle" fill="var(--text-light)" opacity="0.6" font-size="11">${i}</text>`;
        grid += `<text x="${PAD - 12}" y="${toY(i) + 4}" text-anchor="end" fill="var(--text-light)" opacity="0.6" font-size="11">${i}</text>`;
    }

    let nodes = '';
    const scoredItems = appState.items.filter(i => i.scores[analyticsState.scatterX] !== undefined && i.scores[analyticsState.scatterY] !== undefined);
    scoredItems.forEach(item => {
        const off = analyticsState.scatterOffsets[item.id] || { dx: 0, dy: 0 };
        const cx = toX(item.scores[analyticsState.scatterX]) + off.dx;
        const cy = toY(item.scores[analyticsState.scatterY]) + off.dy;
        const avg = getItemAvg(item);
        const imgTag = item.imageBase64
            ? `<image href="${item.imageBase64}" x="-16" y="-16" width="32" height="32" clip-path="circle(16px)" preserveAspectRatio="xMidYMid slice"/>`
            : `<circle r="14" fill="${scoreColor(avg === null ? 5 : avg)}"/>`;
        nodes += `
            <g class="scatter-node" data-item-id="${item.id}" transform="translate(${cx},${cy})">
                <circle r="18" fill="var(--light-bg)" stroke="${scoreColor(avg === null ? 5 : avg)}" stroke-width="2"/>
                ${imgTag}
                <text y="32" text-anchor="middle" fill="var(--text-light)" font-size="11" font-weight="600">${item.name}</text>
            </g>
        `;
    });

    body.innerHTML = `
        <div class="scatter-wrap">
            <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
                ${grid}
                <line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="var(--accent-color)" stroke-width="1.5"/>
                <line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="var(--accent-color)" stroke-width="1.5"/>
                <text x="${W / 2}" y="${H - 8}" text-anchor="middle" fill="var(--text-light)" font-size="13" font-weight="bold">${featX ? featX.name : ''} →</text>
                <text x="14" y="${H / 2}" text-anchor="middle" fill="var(--text-light)" font-size="13" font-weight="bold" transform="rotate(-90 14 ${H / 2})">${featY ? featY.name : ''} →</text>
                ${nodes}
            </svg>
        </div>
    `;

    if (scoredItems.length === 0) {
        body.innerHTML += '<p style="opacity:0.7; text-align:center;">No items have scores for both selected features yet.</p>';
    }

    setupScatterDrag(body.querySelector('svg'), toX, toY);
    hint.textContent = 'Drag the dots around to explore. Positions are visual only — scores in your file never change.';
}

function setupScatterDrag(svg, toX, toY) {
    if (!svg) return;
    let dragNode = null, dragId = null, startPt = null, startOff = null;

    const getPoint = (e) => {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    svg.addEventListener('pointerdown', (e) => {
        const node = e.target.closest('.scatter-node');
        if (!node) return;
        dragNode = node;
        dragId = node.dataset.itemId;
        startPt = getPoint(e);
        startOff = analyticsState.scatterOffsets[dragId] || { dx: 0, dy: 0 };
        svg.setPointerCapture(e.pointerId);
    });

    svg.addEventListener('pointermove', (e) => {
        if (!dragNode) return;
        const pt = getPoint(e);
        const off = { dx: startOff.dx + (pt.x - startPt.x), dy: startOff.dy + (pt.y - startPt.y) };
        analyticsState.scatterOffsets[dragId] = off;
        const item = appState.items.find(i => i.id === dragId);
        const cx = toX(item.scores[analyticsState.scatterX]) + off.dx;
        const cy = toY(item.scores[analyticsState.scatterY]) + off.dy;
        dragNode.setAttribute('transform', `translate(${cx},${cy})`);
    });

    const endDrag = () => { dragNode = null; dragId = null; };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
}

// -- Insights tab: automatic textual analysis --
function renderAnalyticsInsights(controls, body, hint) {
    const scored = appState.items.filter(i => getItemAvg(i) !== null);
    if (scored.length === 0) {
        body.innerHTML = '<p style="opacity:0.7;">Score some items first to see insights.</p>';
        return;
    }

    const cards = [];
    const insightRow = (item, valueText) => `
        <div class="insight-main">${analyticsThumb(item, 36)} <span>${item.name}</span>
        <span style="margin-left:auto; color:var(--accent-color);">${valueText}</span></div>`;

    // Champion & lowest
    const byAvg = [...scored].sort((a, b) => getItemAvg(b) - getItemAvg(a));
    cards.push(`<div class="insight-card"><h4><i class="fas fa-trophy"></i> Top Rated</h4>${insightRow(byAvg[0], getItemAvg(byAvg[0]).toFixed(1))}<p>Highest overall average in the list.</p></div>`);
    if (byAvg.length > 1) {
        const last = byAvg[byAvg.length - 1];
        cards.push(`<div class="insight-card"><h4><i class="fas fa-arrow-down"></i> Lowest Rated</h4>${insightRow(last, getItemAvg(last).toFixed(1))}<p>Lowest overall average — biggest room to improve.</p></div>`);
    }

    // Best per feature
    appState.features.forEach(f => {
        const withScore = scored.filter(i => i.scores[f.id] !== undefined);
        if (withScore.length === 0) return;
        const best = withScore.reduce((a, b) => (b.scores[f.id] > a.scores[f.id] ? b : a));
        cards.push(`<div class="insight-card"><h4><i class="fas fa-star"></i> Best "${f.name}"</h4>${insightRow(best, best.scores[f.id])}<p>Leads all items in this feature.</p></div>`);
    });

    // Most consistent / most polarizing (needs 2+ features)
    if (appState.features.length > 1) {
        const spread = (item) => {
            const vals = appState.features.map(f => item.scores[f.id]).filter(v => v !== undefined);
            if (vals.length < 2) return null;
            return Math.max(...vals) - Math.min(...vals);
        };
        const withSpread = scored.map(i => ({ item: i, s: spread(i) })).filter(x => x.s !== null);
        if (withSpread.length > 0) {
            withSpread.sort((a, b) => a.s - b.s);
            const consistent = withSpread[0];
            const polarizing = withSpread[withSpread.length - 1];
            cards.push(`<div class="insight-card"><h4><i class="fas fa-balance-scale"></i> Most Consistent</h4>${insightRow(consistent.item, '±' + (consistent.s / 2).toFixed(1))}<p>Smallest gap between its best and worst feature.</p></div>`);
            if (polarizing !== consistent && polarizing.s > 0) {
                cards.push(`<div class="insight-card"><h4><i class="fas fa-bolt"></i> Most Polarizing</h4>${insightRow(polarizing.item, '±' + (polarizing.s / 2).toFixed(1))}<p>Biggest gap between its best and worst feature.</p></div>`);
            }
        }

        // Feature averages
        let featRows = '';
        appState.features.forEach(f => {
            const vals = scored.map(i => i.scores[f.id]).filter(v => v !== undefined);
            if (vals.length === 0) return;
            const m = vals.reduce((a, b) => a + b, 0) / vals.length;
            featRows += `
                <div class="breakdown-feat-row">
                    <div class="breakdown-feat-name">${f.name}</div>
                    <div class="rank-bar-track" style="flex:1;">
                        <div class="rank-bar-fill" style="width:${m * 10}%; background:${scoreColor(m)};"></div>
                    </div>
                    <div class="breakdown-feat-val">${m.toFixed(1)}</div>
                </div>`;
        });
        cards.push(`<div class="insight-card" style="grid-column: 1 / -1;"><h4><i class="fas fa-chart-line"></i> Feature Averages</h4>${featRows}<p>How generous your scoring is per feature, across all items.</p></div>`);
    }

    body.innerHTML = `<div class="insights-grid">${cards.join('')}</div>`;
    hint.textContent = 'Insights are computed live from your current scores.';
}

// --- Smart Compare (Pairwise Feature Comparison) ---
let compareQueue = [];
let currentCompare = null;

function startSmartCompare() {
    showView('smartCompare');
    document.getElementById('compare-setup-stage').classList.remove('hidden');
    document.getElementById('compare-active-stage').classList.add('hidden');
    document.getElementById('compare-suggestion-stage').classList.add('hidden');
    document.getElementById('compare-done-stage').classList.add('hidden');
}

function executeSmartCompareStep() {
    compareQueue = [];
    appState.features.forEach(f => {
        let scoredItems = appState.items.filter(i => i.scores[f.id] !== undefined);
        scoredItems.sort((a, b) => a.scores[f.id] - b.scores[f.id]);

        for (let i = 0; i < scoredItems.length - 1; i++) {
            let diff = Math.abs(scoredItems[i].scores[f.id] - scoredItems[i + 1].scores[f.id]);
            if (diff <= 1.0) {
                compareQueue.push({
                    featureId: f.id,
                    featureName: f.name,
                    itemA: scoredItems[i],
                    itemB: scoredItems[i + 1],
                    scoreA: scoredItems[i].scores[f.id],
                    scoreB: scoredItems[i + 1].scores[f.id]
                });
            }
        }
    });

    compareQueue.sort(() => Math.random() - 0.5);

    document.getElementById('compare-setup-stage').classList.add('hidden');
    nextSmartCompare();
}

function nextSmartCompare() {
    document.getElementById('compare-suggestion-stage').classList.add('hidden');

    if (compareQueue.length === 0) {
        document.getElementById('compare-active-stage').classList.add('hidden');
        document.getElementById('compare-done-stage').classList.remove('hidden');
        return;
    }

    currentCompare = compareQueue.shift();

    document.getElementById('compare-active-stage').classList.remove('hidden');
    document.getElementById('compare-feature-name').textContent = `Feature: ${currentCompare.featureName}`;

    document.getElementById('p-score-a').classList.add('hidden');
    document.getElementById('p-score-b').classList.add('hidden');

    setupCompareCard('a', currentCompare.itemA, currentCompare.scoreA);
    setupCompareCard('b', currentCompare.itemB, currentCompare.scoreB);

    document.getElementById('compare-item-a').onclick = () => handleCompareChoice('a');
    document.getElementById('compare-item-b').onclick = () => handleCompareChoice('b');
    document.getElementById('btn-compare-skip').onclick = nextSmartCompare;
}

function setupCompareCard(side, item, score) {
    document.getElementById(`compare-name-${side}`).textContent = item.name;
    document.getElementById(`compare-score-${side}`).textContent = score;
    const imgEl = document.getElementById(`compare-img-${side}`);
    if (item.imageBase64) {
        imgEl.src = item.imageBase64;
        imgEl.classList.remove('hidden');
    } else {
        imgEl.classList.add('hidden');
    }
}

function handleCompareChoice(winnerSide) {
    const isAWinner = winnerSide === 'a';
    const winner = isAWinner ? currentCompare.itemA : currentCompare.itemB;
    const loser = isAWinner ? currentCompare.itemB : currentCompare.itemA;
    const scoreWin = isAWinner ? currentCompare.scoreA : currentCompare.scoreB;
    const scoreLose = isAWinner ? currentCompare.scoreB : currentCompare.scoreA;

    document.getElementById('p-score-a').classList.remove('hidden');
    document.getElementById('p-score-b').classList.remove('hidden');

    if (scoreWin <= scoreLose) {
        const suggestionText = `You decided that <strong>${winner.name}</strong> executes this feature better. 
        However, its current score is ${scoreWin}, while the other item's score is ${scoreLose}. 
        Would you like to adjust the score of <strong>${winner.name}</strong> to <strong>${scoreLose + 0.5}</strong>?`;

        document.getElementById('compare-suggestion-text').innerHTML = suggestionText;
        document.getElementById('compare-suggestion-stage').classList.remove('hidden');

        document.getElementById('btn-accept-suggestion').onclick = () => {
            let itemIndex = appState.items.findIndex(i => i.id === winner.id);
            if (itemIndex !== -1) {
                appState.items[itemIndex].scores[currentCompare.featureId] = scoreLose + 0.5;
            }
            nextSmartCompare();
        };

        document.getElementById('btn-reject-suggestion').onclick = nextSmartCompare;
    } else {
        setTimeout(nextSmartCompare, 1200);
    }
}
