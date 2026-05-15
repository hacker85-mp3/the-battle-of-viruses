// ==========================================
// 1. ИГРОВЫЕ ПЕРЕМЕННЫХ И АВТОЗАГРУЗКА
// ==========================================
const arena = document.createElement("div");
arena.style.position = "fixed"; arena.style.top = "0"; arena.style.left = "0";
arena.style.width = "100vw"; arena.style.height = "100vh";
arena.style.backgroundColor = "black"; arena.style.zIndex = "9990";
arena.style.overflow = "hidden"; document.body.appendChild(arena);

window.score = parseInt(localStorage.getItem("virusGame_score")) || 0;
window.unlockedWeapons = JSON.parse(localStorage.getItem("virusGame_weapons")) || ["laser", "bomb_default"];
window.hasDarkBlade = localStorage.getItem("virusGame_hasDarkBlade") === "true";
if (window.hasDarkBlade && !window.unlockedWeapons.includes("darkBlade")) window.unlockedWeapons.push("darkBlade");

window.currentWeapon = "laser"; window.flyingViruses = [];
window.currentRound = 1; window.bombsLeft = 2; window.spawnedThisRound = 0;
window.cooldowns = { staff: 0, lightOfGod: 0, hypnosis: 0 };
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
arena.onmousemove = (e) => { mouseX = e.clientX; mouseY = e.clientY; handleDarkBladeTrace(); };

// ==========================================
// 2. ИНТЕРФЕЙС, ТАБЛО И ИНСТРУКЦИЯ
// ==========================================
const spawnBtn = document.createElement("button");
spawnBtn.style.position = "absolute"; spawnBtn.style.top = "20px"; spawnBtn.style.left = "20px";
spawnBtn.style.padding = "10px 15px"; spawnBtn.style.background = "black"; spawnBtn.style.color = "#00ff00";
spawnBtn.style.border = "2px solid #00ff00"; spawnBtn.style.fontFamily = "monospace"; spawnBtn.style.cursor = "pointer";
spawnBtn.style.fontWeight = "bold"; spawnBtn.style.zIndex = "9999"; arena.appendChild(spawnBtn);

function getMaxViruses() { return window.currentRound % 10 === 0 ? 1 : window.currentRound; }
function updateSpawnButtonText() {
    if (window.currentRound % 10 === 0) spawnBtn.textContent = window.spawnedThisRound > 0 ? "БОСС НА АРЕНЕ" : "ПРИЗВАТЬ БОССА";
    else spawnBtn.textContent = `СПАВН ВИРУСА (${window.spawnedThisRound}/${getMaxViruses()})`;
}
updateSpawnButtonText();

const shopBtn = spawnBtn.cloneNode(true); shopBtn.textContent = "МАГАЗИН ОРУЖИЯ"; shopBtn.style.left = "280px"; arena.appendChild(shopBtn);
const scoreBoard = document.createElement("div"); scoreBoard.style.position = "absolute"; scoreBoard.style.top = "20px"; scoreBoard.style.right = "20px"; scoreBoard.style.color = "#00ff00"; scoreBoard.style.fontFamily = "monospace"; scoreBoard.style.fontSize = "24px"; scoreBoard.style.fontWeight = "bold"; scoreBoard.style.zIndex = "9999"; scoreBoard.textContent = "ОЧКИ: " + window.score; arena.appendChild(scoreBoard);
const roundBoard = scoreBoard.cloneNode(true); roundBoard.style.right = "250px"; roundBoard.textContent = "РАУНД: " + window.currentRound; arena.appendChild(roundBoard);

const infoBox = document.createElement("div"); infoBox.style.position = "absolute"; infoBox.style.bottom = "20px"; infoBox.style.left = "20px"; infoBox.style.width = "450px"; infoBox.style.backgroundColor = "rgba(0,0,0,0.85)"; infoBox.style.border = "1px solid #00ff00"; infoBox.style.zIndex = "9999"; infoBox.style.display = "flex"; infoBox.style.flexDirection = "column"; arena.appendChild(infoBox);
const infoHeader = document.createElement("div"); infoHeader.style.padding = "10px 15px"; infoHeader.style.borderBottom = "1px solid #00ff00"; infoHeader.style.display = "flex"; infoHeader.style.justifyContent = "space-between"; infoHeader.style.alignItems = "center"; infoHeader.style.fontFamily = "monospace"; infoHeader.style.fontWeight = "bold"; infoHeader.style.color = "#00ff00"; infoHeader.style.cursor = "pointer"; infoBox.appendChild(infoHeader);
const infoTitle = document.createElement("span"); infoHeader.appendChild(infoTitle);
const toggleBtn = document.createElement("button"); toggleBtn.textContent = "[-] СВЕРНУТЬ"; toggleBtn.style.background = "transparent"; toggleBtn.style.border = "none"; toggleBtn.style.color = "#00ff00"; toggleBtn.style.fontFamily = "monospace"; toggleBtn.style.cursor = "pointer"; toggleBtn.style.fontWeight = "bold"; infoHeader.appendChild(toggleBtn);
const infoContent = document.createElement("div"); infoContent.style.padding = "15px"; infoContent.style.color = "#00ff00"; infoContent.style.fontFamily = "monospace"; infoContent.style.fontSize = "13px"; infoContent.style.lineHeight = "1.4"; infoContent.style.whiteSpace = "pre-line"; infoBox.appendChild(infoContent);

let isInfoCollapsed = false;
function toggleInfo() { infoContent.style.display = isInfoCollapsed ? "block" : "none"; infoHeader.style.borderBottom = isInfoCollapsed ? "1px solid #00ff00" : "none"; toggleBtn.textContent = isInfoCollapsed ? "[-] СВЕРНУТЬ" : "[+] РАЗВЕРНУТЬ"; isInfoCollapsed = !isInfoCollapsed; }
toggleBtn.onclick = (e) => { e.stopPropagation(); toggleInfo(); }; infoHeader.onclick = toggleInfo;

function updateInterfaceText() {
    infoTitle.textContent = window.currentRound % 10 === 0 ? `⚠️ РАУНД С БОССОМ ${window.currentRound} ⚠️` : `=== РАУНД ${window.currentRound} ===`;
    const weaponsMap = { laser: "ЛАЗЕР", bomb_default: "БОМБА (за очки)", brick: "КИРПИЧ", poison: "ОТРАВА", darkBlade: "КЛИНОК ТЕМНОТЫ", gandalfStaff: "ПОСОХ ГЭНДАЛЬФА", godLight: "СВЕТ БОГА", hypnosis: "ГИПНОЗ" };
    infoContent.textContent = `Оружие [1-8]: ${weaponsMap[window.currentWeapon]} | 'Q' - Бесплатная Бомба (${window.bombsLeft}/2)
ХОТКЕИ: 1:Лазер | 2:Бомба | 3:Кирпич | 4:Отрава | 5:Клинок | 6:Посох | 7:Свет Бога | 8:Гипноз`;
}
updateInterfaceText();
// ==========================================
// 3. ОКНО МАГАЗИНА С СКРОЛЛОМ
// ==========================================
const shopWindow = document.createElement("div");
shopWindow.style.position = "absolute"; shopWindow.style.top = "80px"; shopWindow.style.left = "280px";
shopWindow.style.width = "360px"; shopWindow.style.maxHeight = "400px"; shopWindow.style.background = "rgba(0,0,0,0.95)";
shopWindow.style.border = "2px solid #00ff00"; shopWindow.style.padding = "15px"; shopWindow.style.fontFamily = "monospace";
shopWindow.style.color = "#00ff00"; shopWindow.style.display = "none"; shopWindow.style.zIndex = "10000";
shopWindow.style.overflowY = "auto"; arena.appendChild(shopWindow);

shopBtn.onclick = (e) => { e.stopPropagation(); shopWindow.style.display = shopWindow.style.display === "none" ? "block" : "none"; };

const shopTitle = document.createElement("div"); shopTitle.style.fontWeight = "bold"; shopTitle.style.marginBottom = "15px"; shopTitle.textContent = "=== ОРУЖЕЙНАЯ (СКРОЛЛ ↓) ==="; shopWindow.appendChild(shopTitle);

const shopItems = [
    { id: "brick", name: "Кирпич (300 урона)", cost: 500, desc: "Одиночный бросок тяжелого кирпича.", color: "#cd853f" },
    { id: "poison", name: "Отрава (Лужа яда)", cost: 1000, desc: "Оставляет лужу, бьющую ядом по 100/сек.", color: "#00ff00" },
    { id: "darkBlade", name: "Клинок Темноты", cost: 100000, desc: "Разрезает толпы вирусов движением мыши.", color: "#8a2be2" },
    { id: "gandalfStaff", name: "Посох Гэндальфа", cost: 100000, desc: "Взрыв на 600 урона. Перезарядка 10 сек.", color: "#00ffff" },
    { id: "godLight", name: "Свет Бога (АННИГИЛЯЦИЯ)", cost: 100000000, desc: "Стирает ВСЁ в зоне. Перезарядка 10 сек.", color: "#fff" },
    { id: "hypnosis", name: "Гипноз (Зомби-Вирус)", cost: 10000000000, desc: "Обращает вирус против своих. Перезарядка 10 сек.", color: "#00ffaa" }
];

shopItems.forEach(item => {
    const box = document.createElement("div"); box.style.border = "1px dashed #00ff00"; box.style.padding = "10px"; box.style.marginBottom = "10px"; box.style.display = "flex"; box.style.flexDirection = "column"; box.style.gap = "4px";
    const name = document.createElement("span"); name.style.color = item.color; name.style.fontWeight = "bold"; name.textContent = item.name;
    const desc = document.createElement("span"); desc.style.fontSize = "12px"; desc.style.color = "#aaa"; desc.textContent = item.desc;
    const cost = document.createElement("span"); cost.textContent = `Цена: ${item.cost.toLocaleString()} очков`;
    const btn = document.createElement("button"); btn.style.background = "#222"; btn.style.color = "#00ff00"; btn.style.border = "1px solid #00ff00"; btn.style.cursor = "pointer";
    
    const isUnlocked = window.unlockedWeapons.includes(item.id);
    btn.textContent = isUnlocked ? "КУПЛЕНО" : "КУПИТЬ";
    if (isUnlocked) { btn.style.color = "#555"; btn.style.borderColor = "#555"; }

    btn.onclick = (e) => {
        e.stopPropagation();
        if (window.unlockedWeapons.includes(item.id)) return;
        if (window.score >= item.cost) {
            window.score -= item.cost;
            window.unlockedWeapons.push(item.id);
            if (item.id === "darkBlade") { window.hasDarkBlade = true; localStorage.setItem("virusGame_hasDarkBlade", "true"); }
            scoreBoard.textContent = "ОЧКИ: " + window.score;
            btn.textContent = "КУПЛЕНО"; btn.style.color = "#555"; btn.style.borderColor = "#555";
            localStorage.setItem("virusGame_score", window.score);
            localStorage.setItem("virusGame_weapons", JSON.stringify(window.unlockedWeapons));
            updateInterfaceText();
        } else {
            alert(`Недостаточно очков! Нужно еще ${(item.cost - window.score).toLocaleString()}`);
        }
    };
    box.appendChild(name); box.appendChild(desc); box.appendChild(cost); box.appendChild(btn); shopWindow.appendChild(box);
});

// ==========================================
// 4. СИНТЕЗАТОР ЗВУКОВЫХ ЭФФЕКТОВ (БЕЗ ФАЙЛОВ)
// ==========================================
function playSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'laser') { // Лазер Стар Варс
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
            gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'explosion') { // Взрыв посоха / бомбы
            osc.type = 'triangle'; osc.frequency.setValueAtTime(120, now); osc.frequency.linearRampToValueAtTime(10, now + 0.4);
            gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4); osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'glass') { // Разбивающийся стакан (кирпич)
            osc.type = 'sine'; osc.frequency.setValueAtTime(1500, now); osc.frequency.setValueAtTime(1800, now + 0.05);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'poison') { // Шипение яда
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(250, now); osc.frequency.linearRampToValueAtTime(200, now + 0.2);
            gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2); osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'god') { // Звук бога / Хор
            osc.type = 'sine'; osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(554, now); osc.frequency.setValueAtTime(659, now);
            gain.gain.setValueAtTime(0.4, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.8); osc.start(now); osc.stop(now + 0.8);
        } else if (type === 'zombie') { // Суррогатный звук зомби
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(90, now); osc.frequency.linearRampToValueAtTime(70, now + 0.5);
            gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5); osc.start(now); osc.stop(now + 0.5);
        }
    } catch(e) { console.log("Ошибка аудио:", e); }
}

// ==========================================
// 5. ДВИЖОК И СПАВН ВИРУСОВ
// ==========================================
spawnBtn.onclick = function(e) {
    e.stopPropagation();
    if (window.spawnedThisRound >= getMaxViruses()) return;
    
    window.spawnedThisRound++; updateSpawnButtonText();
    
    const isBossRound = window.currentRound % 10 === 0;
    const bossIndex = window.currentRound / 10;
    const maxHp = isBossRound ? (10000 * Math.pow(10, bossIndex - 1)) : (100 * window.currentRound);
    
    const el = document.createElement("div");
    el.style.position = "absolute"; el.style.backgroundColor = "black"; el.style.fontFamily = "monospace";
    el.style.fontWeight = "bold"; el.style.cursor = "crosshair"; el.style.zIndex = "9995";
    
    if (isBossRound) {
        el.style.border = "4px solid #8a2be2"; el.style.padding = "25px 40px"; el.style.fontSize = "24px"; el.style.color = "#fff"; el.style.boxShadow = "0 0 30px #ff3333";
        el.style.left = (window.innerWidth / 2 - 150) + "px"; el.style.top = (window.innerHeight / 2 - 50) + "px";
        el.textContent = `👑 БОСС [${maxHp}/${maxHp} HP]`;
    } else {
        el.style.border = "1px solid #ff3333"; el.style.padding = "8px"; el.style.color = "#ff3333";
        el.style.left = (Math.random() * (window.innerWidth - 150)) + "px"; el.style.top = (100 + Math.random() * (window.innerHeight - 200)) + "px";
        el.textContent = `🦠 TARGET_${window.spawnedThisRound} [${maxHp}/${maxHp} HP]`;
    }
    arena.appendChild(el);

    const speed = isBossRound ? (14 + bossIndex * 2) : 5 * (1 + window.currentRound * 0.15);
    window.flyingViruses.push({
        element: el, x: parseFloat(el.style.left), y: parseFloat(el.style.top),
        speedX: (Math.random() - 0.5) * speed, speedY: (Math.random() - 0.5) * speed,
        hp: maxHp, maxHp: maxHp, isBoss: isBossRound, id: window.spawnedThisRound, isZombie: false
    });
};

function moveEngine() {
    window.flyingViruses.forEach(item => {
        const rect = item.element.getBoundingClientRect();
        item.x += item.speedX; item.y += item.speedY;
        if (item.x <= 0 || item.x + rect.width >= window.innerWidth) item.speedX *= -1;
        if (item.y <= 0 || item.y + rect.height >= window.innerHeight) item.speedY *= -1;
        item.element.style.left = item.x + "px"; item.element.style.top = item.y + "px";
    });
    requestAnimationFrame(moveEngine);
}
moveEngine();
// ==========================================
// 6. СЛЕД КЛИНИКА ТЕМНОТЫ И СМЕНА КООРДИНАТ
// ==========================================
function handleDarkBladeTrace() {
    if (window.currentWeapon === "darkBlade" && window.unlockedWeapons.includes("darkBlade")) {
        const trace = document.createElement("div");
        trace.style.position = "absolute"; trace.style.left = mouseX + "px"; trace.style.top = mouseY + "px";
        trace.style.width = "6px"; trace.style.height = "6px"; trace.style.borderRadius = "50%";
        trace.style.backgroundColor = "#8a2be2"; trace.style.boxShadow = "0 0 10px #8a2be2";
        trace.style.pointerEvents = "none"; trace.style.zIndex = "9996"; arena.appendChild(trace);
        setTimeout(() => trace.remove(), 200);

        window.flyingViruses.forEach(item => {
            const r = item.element.getBoundingClientRect();
            // Наносим тикающий урон только обычным (не загипнотизированным) вирусам
            if (!item.isZombie && mouseX >= r.left && mouseX <= r.right && mouseY >= r.top && mouseY <= r.bottom) {
                playSound('laser');
                damageVirus(item, 15); 
            }
        });
    }
}

// Движок битвы зомби против вирусов (вызывается каждую секунду)
setInterval(() => {
    const zombies = window.flyingViruses.filter(v => v.isZombie);
    const normals = window.flyingViruses.filter(v => !v.isZombie);

    zombies.forEach(zombie => {
        const zR = zombie.element.getBoundingClientRect();
        const zX = zR.left + zR.width/2, zY = zR.top + zR.height/2;

        normals.forEach(normal => {
            const nR = normal.element.getBoundingClientRect();
            const nX = nR.left + nR.width/2, nY = nR.top + nR.height/2;
            
            // Расстояние между зомби и вирусом
            const dist = Math.sqrt(Math.pow(nX - zX, 2) + Math.pow(nY - zY, 2));
            if (dist <= 150) { // Радиус агрессии
                playSound('zombie');
                damageVirus(normal, 100);  // Зомби бьет вирус на 100
                damageVirus(zombie, 100);  // Вирус бьет зомби на 100 в ответ
            }
        });
    });
}, 1000);

// ==========================================
// 7. КЛИКИ: АТАКА И ИСПОЛЬЗОВАНИЕ ОРУЖИЯ
// ==========================================
arena.onclick = function(e) {
    const targetEl = e.target;
    const isVirus = targetEl && targetEl.textContent && (targetEl.textContent.includes("TARGET") || targetEl.textContent.includes("БОСС") || targetEl.textContent.includes("ZOMBIE"));
    
    // ОРУЖИЕ: КИРПИЧ
    if (window.currentWeapon === "brick" && window.unlockedWeapons.includes("brick")) {
        playSound('glass');
        createFlashEffect(mouseX, mouseY, 40, "#cd853f");
        window.flyingViruses.forEach(item => {
            const r = item.element.getBoundingClientRect();
            if (!item.isZombie && mouseX >= r.left && mouseX <= r.right && mouseY >= r.top && mouseY <= r.bottom) damageVirus(item, 300);
        });
        return;
    }

    // ОРУЖИЕ: ОТРАВА
    if (window.currentWeapon === "poison" && window.unlockedWeapons.includes("poison")) {
        playSound('poison');
        const puddle = document.createElement("div");
        puddle.style.position = "absolute"; puddle.style.left = (mouseX - 60) + "px"; puddle.style.top = (mouseY - 60) + "px";
        puddle.style.width = "120px"; puddle.style.height = "120px"; puddle.style.borderRadius = "50%";
        puddle.style.background = "radial-gradient(circle, rgba(0,255,0,0.5) 0%, transparent 70%)";
        puddle.style.pointerEvents = "none"; puddle.style.zIndex = "9991"; arena.appendChild(puddle);
        
        const poisonInterval = setInterval(() => {
            const pR = puddle.getBoundingClientRect();
            const pX = pR.left + 60, pY = pR.top + 60;
            window.flyingViruses.forEach(item => {
                if (!item.isZombie) {
                    const vR = item.element.getBoundingClientRect();
                    const vX = vR.left + vR.width/2, vY = vR.top + vR.height/2;
                    if (Math.sqrt(Math.pow(vX - pX, 2) + Math.pow(vY - pY, 2)) <= 70) damageVirus(item, 20);
                }
            });
        }, 1000);
        setTimeout(() => { clearInterval(poisonInterval); puddle.remove(); }, 5000);
        return;
    }

    // ОРУЖИЕ: ПОСОХ ГЭНДАЛЬФА
    if (window.currentWeapon === "gandalfStaff" && window.unlockedWeapons.includes("gandalfStaff")) {
        if (Date.now() < window.cooldowns.staff) { alert("Посох перезаряжается!"); return; }
        window.cooldowns.staff = Date.now() + 10000;
        playSound('explosion');
        createFlashEffect(mouseX, mouseY, 250, "#00ffff");
        window.flyingViruses.forEach(item => {
            if (!item.isZombie) {
                const r = item.element.getBoundingClientRect();
                const vX = r.left + r.width/2, vY = r.top + r.height/2;
                if (Math.sqrt(Math.pow(vX - mouseX, 2) + Math.pow(vY - mouseY, 2)) <= 250) damageVirus(item, 600);
            }
        });
        return;
    }

    // ОРУЖИЕ: СВЕТ БОГА
    if (window.currentWeapon === "godLight" && window.unlockedWeapons.includes("godLight")) {
        if (Date.now() < window.cooldowns.lightOfGod) { alert("Свет Бога перезаряжается!"); return; }
        window.cooldowns.lightOfGod = Date.now() + 10000;
        playSound('god');
        createFlashEffect(mouseX, mouseY, 200, "#ffffff");
        window.flyingViruses.forEach(item => {
            if (!item.isZombie) {
                const r = item.element.getBoundingClientRect();
                const vX = r.left + r.width/2, vY = r.top + r.height/2;
                if (Math.sqrt(Math.pow(vX - mouseX, 2) + Math.pow(vY - mouseY, 2)) <= 200) damageVirus(item, item.maxHp);
            }
        });
        return;
    }

    // ОРУЖИЕ: ГИПНОЗ
    if (window.currentWeapon === "hypnosis" && window.unlockedWeapons.includes("hypnosis")) {
        if (Date.now() < window.cooldowns.hypnosis) { alert("Гипноз перезаряжается!"); return; }
        if (isVirus) {
            const virusItem = window.flyingViruses.find(item => item.element === targetEl);
            if (virusItem && !virusItem.isZombie) {
                window.cooldowns.hypnosis = Date.now() + 10000;
                playSound('zombie');
                virusItem.isZombie = true;
                virusItem.element.style.borderColor = "#00ffaa";
                virusItem.element.style.color = "#00ffaa";
                virusItem.element.textContent = `🧟 ZOMBIE [${virusItem.hp}/${virusItem.maxHp} HP]`;
            }
        }
        return;
    }

    // ЛОГИКА СТАНДАРТНЫХ КЛИКОВ (Лазер и Обычная Бомба)
    if (isVirus) {
        e.stopPropagation();
        const virusItem = window.flyingViruses.find(item => item.element === targetEl);
        if (!virusItem || virusItem.isZombie) return; // Своих зомби бить нельзя

        if (window.currentWeapon === "laser") { playSound('laser'); damageVirus(virusItem, 100); }
        if (window.currentWeapon === "bomb_default") { playSound('explosion'); damageVirus(virusItem, 200); }
    }
};

function damageVirus(item, dmg) {
    item.hp -= dmg;
    if (item.hp <= 0) {
        item.element.remove();
        // Награда за убийство: босс дает фиксированную сумму, обычные зависят от раунда
        let reward = item.isBoss ? (100000 * Math.pow(10, (window.currentRound/10) - 1)) : 100 * window.currentRound;
        
        // За убийство собственных зомби очки не дают
        if (!item.isZombie) {
            window.score += reward;
            scoreBoard.textContent = "ОЧКИ: " + window.score;
            localStorage.setItem("virusGame_score", window.score);
        }
        
        window.flyingViruses = window.flyingViruses.filter(v => v !== item);
        checkRoundEnd();
    } else {
        if (item.isZombie) item.element.textContent = `🧟 ZOMBIE [${item.hp}/${item.maxHp} HP]`;
        else if (item.isBoss) item.element.textContent = `👑 БОСС [${item.hp}/${item.maxHp} HP]`;
        else item.element.textContent = `🦠 TARGET_${item.id} [${item.hp}/${item.maxHp} HP]`;
    }
}

function createFlashEffect(x, y, radius, color) {
    const flash = document.createElement("div");
    flash.style.position = "absolute"; flash.style.left = (x - radius) + "px"; flash.style.top = (y - radius) + "px";
    flash.style.width = (radius*2) + "px"; flash.style.height = (radius*2) + "px"; flash.style.borderRadius = "50%";
    flash.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
    flash.style.pointerEvents = "none"; flash.style.zIndex = "9997"; arena.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
}

// ==========================================
// 8. СМЕНА ОРУЖИЯ С КЛАВИАТУРЫ И БОМБА НА Q
// ==========================================
window.onkeydown = function(e) {
    if (e.key === "1") window.currentWeapon = "laser";
    if (e.key === "2") window.currentWeapon = "bomb_default";
    if (e.key === "3" && window.unlockedWeapons.includes("brick")) window.currentWeapon = "brick";
    if (e.key === "4" && window.unlockedWeapons.includes("poison")) window.currentWeapon = "poison";
    if (e.key === "5" && window.unlockedWeapons.includes("darkBlade")) window.currentWeapon = "darkBlade";
    if (e.key === "6" && window.unlockedWeapons.includes("gandalfStaff")) window.currentWeapon = "gandalfStaff";
    if (e.key === "7" && window.unlockedWeapons.includes("godLight")) window.currentWeapon = "godLight";
    if (e.key === "8" && window.unlockedWeapons.includes("hypnosis")) window.currentWeapon = "hypnosis";
    
    // Бесплатная Бомба
    if (e.key.toLowerCase() === "q" || e.key.toLowerCase() === "й") {
        if (window.bombsLeft <= 0) return;
        window.bombsLeft--; updateInterfaceText();
        playSound('explosion');

        const bombEl = document.createElement("div");
        bombEl.style.position = "absolute"; bombEl.style.left = (mouseX - 25) + "px"; bombEl.style.top = (mouseY - 25) + "px";
        bombEl.style.width = "50px"; bombEl.style.height = "50px"; bombEl.style.borderRadius = "50%";
        bombEl.style.backgroundColor = "red"; bombEl.style.border = "3px solid white"; bombEl.style.color = "white";
        bombEl.style.fontFamily = "monospace"; bombEl.style.fontWeight = "bold"; bombEl.style.display = "flex";
        bombEl.style.alignItems = "center"; bombEl.style.justifyContent = "center"; bombEl.style.zIndex = "9998";
        
        let timeLeft = 3; bombEl.textContent = timeLeft; arena.appendChild(bombEl);

        const timerInterval = setInterval(() => {
            timeLeft--; bombEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                const bX = mouseX, bY = mouseY;
                createFlashEffect(bX, bY, 250, "orange"); bombEl.remove();

                window.flyingViruses.forEach(item => {
                    if (!item.isZombie) {
                        const rect = item.element.getBoundingClientRect();
                        const vX = rect.left + rect.width/2, vY = rect.top + rect.height/2;
                        if (Math.sqrt(Math.pow(vX - bX, 2) + Math.pow(vY - bY, 2)) <= 250) damageVirus(item, 600);
                    }
                });
            }
        }, 1000);
    }
    updateInterfaceText();
};

function checkRoundEnd() {
    // Раунд заканчивается, если заспавнены все вирусы и на арене больше никого не осталось
    if (window.spawnedThisRound >= getMaxViruses() && window.flyingViruses.length === 0) {
        window.currentRound++;
        
        if ((window.currentRound - 1) % 10 === 0) {
            const bossIndex = (window.currentRound - 1) / 10;
            alert(`🎉 НЕВЕРОЯТНО! Вы уничтожили БОССА №${bossIndex}! Начинается РАУНД ${window.currentRound}.`);
        } else {
            alert(`🎉 Раунд пройден! Начинается РАУНД ${window.currentRound}. Лимит вирусов увеличен до ${getMaxViruses()}!`);
        }
        
        window.bombsLeft = 2; window.spawnedThisRound = 0;
        roundBoard.textContent = "РАУНД: " + window.currentRound;
        updateSpawnButtonText(); updateInterfaceText();
    }
}
