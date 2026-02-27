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
    smartCompare: document.getElementById('smart-compare-modal')
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
    document.getElementById('btn-create-new').addEventListener('click', () => {
        if (appState.items.length > 0 && !confirm("Starting a new list will replace your current one. Continue?")) return;
        appState = { listName: "My List", features: [], items: [], passwordHash: null };
        document.getElementById('list-title-input').value = appState.listName;
        showView('featureConfig'); // force user to setup features first
    });

    document.getElementById('btn-load-example').addEventListener('click', loadExampleList);

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
});

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

// --- Session & Example List Data ---
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
