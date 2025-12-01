// ----------------------------------------------------
// 1. STATIC DATA
// ----------------------------------------------------

const glossaryData = [
    { term: "Clause", def: "A unit of meaning with a verb. Can be independent (stand-alone) or dependent (requires another clause)." },
    { term: "Cohesion", def: "How information flows in a text using pronouns, synonyms, and transition words." },
    { term: "Modality", def: "Degree of certainty/obligation (e.g., must, should, might)." },
    { term: "Morphology", def: "Study of word parts (prefixes, suffixes, roots) and how they form words." },
    { term: "Nominalization", def: "Turning actions into nouns (e.g., destroy -> destruction). Common in academic text." },
    { term: "Register", def: "Changing vocabulary/grammar to fit a context (e.g., chatting vs. essay writing)." },
    { term: "Scaffolding", def: "Temporary assistance enabling students to do tasks they couldn't do alone." }
].sort((a, b) => a.term.localeCompare(b.term)); // Alphabetize

const supportData = [
    { level: "Emerging", type: "Substantial Support", desc: "One-on-one assistance, sensory supports, sentence frames, L1 support." },
    { level: "Expanding", type: "Moderate Support", desc: "Small groups, graphic organizers, sentence starters, peer collaboration." },
    { level: "Bridging", type: "Light Support", desc: "Occasional prompting, peer feedback, self-correction checklists." }
];

const aboutContent = `
    <div class="info-block">
        <div class="info-title">Definition of Standards</div>
        <div class="info-text">The CA ELD Standards describe the key knowledge, skills, and abilities that students who are learning English as a new language need in order to access, engage with, and achieve in grade-level academic content.</div>
    </div>
    <div class="info-block">
        <div class="info-title">Purposes & Intended Users</div>
        <div class="info-text">These standards are designed to reflect expectations of what ELs should know, set clear developmental benchmarks, and provide teachers with a foundation for delivering rich instruction.</div>
    </div>
    <a href="https://www.cde.ca.gov/sp/ml/eldstandards.asp" target="_blank" class="download-link">
        📥 Download Official PDF
    </a>
    <div class="credit">
        Co-adapted by <a href="https://kevindublin.com" target="_blank">Kevin Dublin</a> with <a href="https://gemini.google.com" target="_blank">Gemini</a> & vibes ✨
    </div>
`;

let eldData = [];
let overviewData = [];

// ----------------------------------------------------
// 2. INIT & STATE
// ----------------------------------------------------

async function init() {
    try {
        const responseStandards = await fetch('eld-data.json');
        if (!responseStandards.ok) throw new Error("Ensure eld-data.json is in the folder");
        eldData = await responseStandards.json();

        const responseOverviews = await fetch('eld-overviews.json');
        if (responseOverviews.ok) overviewData = await responseOverviews.json();
        
        populateControls();
        restoreState();
        
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
    } catch (e) {
        document.getElementById('results-area').innerHTML = 
        `<p style="color:var(--pink); text-align:center; font-family:monospace;">ERROR: ${e.message}<br>Use a Local Server.</p>`;
    }
}

function populateControls() {
    const gradeSel = document.getElementById('grade-select');
    const partSel = document.getElementById('part-select');

    const grades = [...new Set(eldData.map(d => d.grade))].sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
    const parts = [...new Set(eldData.map(d => d.part))];

    grades.forEach(g => gradeSel.add(new Option(g, g)));
    parts.forEach(p => partSel.add(new Option(p, p)));

    const update = () => { saveState(); render(); };
    gradeSel.addEventListener('change', update);
    partSel.addEventListener('change', update);
}

function saveState() {
    localStorage.setItem('eld_grade', document.getElementById('grade-select').value);
    localStorage.setItem('eld_part', document.getElementById('part-select').value);
}

function restoreState() {
    const savedGrade = localStorage.getItem('eld_grade');
    const savedPart = localStorage.getItem('eld_part');
    if (savedGrade) document.getElementById('grade-select').value = savedGrade;
    if (savedPart) document.getElementById('part-select').value = savedPart;
    if (savedGrade && savedPart) render();
}

// ----------------------------------------------------
// 3. RENDERING
// ----------------------------------------------------

function render() {
    const grade = document.getElementById('grade-select').value;
    const part = document.getElementById('part-select').value;
    const area = document.getElementById('results-area');

    if (!grade || !part) return;

    area.innerHTML = '';

    // Render Overview
    const overview = overviewData.find(o => o.grade === grade);
    if (overview) {
        area.innerHTML += `
            <div class="card" style="border-color: #fff;">
                <div class="card-header" style="background: #333; color: #fff;"><span>${grade} Overview</span></div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;"><h4 style="color: var(--cyan); margin-top: 0;">GOAL</h4><p style="font-size: 0.95rem;">${overview.goal}</p></div>
                    <div><h4 style="color: var(--pink); margin-top: 0;">CRITICAL PRINCIPLES</h4><p style="font-size: 0.95rem;">${overview.critical_principles}</p></div>
                </div>
            </div>`;
    }

    // Render Standards
    const filtered = eldData
        .filter(d => d.grade === grade && d.part === part)
        .sort((a,b) => a.number - b.number);

    if (filtered.length === 0) {
        area.innerHTML += "<p style='text-align:center; font-family:monospace; margin-top:20px;'>NO STANDARDS DATA FOUND.</p>";
        return;
    }

    area.innerHTML += filtered.map(std => `
        <div class="card">
            <div class="card-header">
                <span>${std.number}. ${std.title}</span>
                <span class="strand-meta">${std.mode}</span>
            </div>
            <div class="ccss-box">
                <span class="ccss-label">CORE ALIGNMENT (CCSS ELA)</span>
                <span class="ccss-data"><a href="https://www.thecorestandards.org/ELA-Literacy/" target="_blank" class="extras-link">${std.ccss_ela || "N/A"}</a></span>
            </div>
            <div class="proficiency-grid">
                <div class="col"><span class="label">Emerging</span><div>${std.emerging}</div></div>
                <div class="col"><span class="label">Expanding</span><div>${std.expanding}</div></div>
                <div class="col"><span class="label bridging">Bridging</span><div>${std.bridging}</div></div>
            </div>
        </div>
    `).join('');
}

// ----------------------------------------------------
// 4. SIDEBAR LOGIC
// ----------------------------------------------------

function openSidebar(mode) {
    const sidebar = document.getElementById('sidebar');
    const title = document.getElementById('sidebar-title');
    const body = document.getElementById('sidebar-body');

    sidebar.classList.add('active');

    if (mode === 'glossary') {
        title.innerText = "📚 Glossary";
        body.innerHTML = glossaryData.map(item => `
            <div class="info-block">
                <div class="info-title" style="color:var(--pink)">${item.term}</div>
                <div class="info-text">${item.def}</div>
            </div>
        `).join('');
    } else if (mode === 'support') {
        title.innerText = "🏗️ Support Levels";
        body.innerHTML = supportData.map(item => `
            <div class="info-block">
                <div class="info-title" style="color:#fff">${item.level}</div>
                <div style="color:var(--cyan); font-size:0.9em; margin-bottom:5px; font-family:monospace;">${item.type}</div>
                <div class="info-text">${item.desc}</div>
            </div>
        `).join('');
    } else if (mode === 'about') {
        title.innerText = "ℹ️ About";
        body.innerHTML = aboutContent;
    }
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
}

// Start
init();