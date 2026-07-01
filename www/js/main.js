const STORAGE_ITEMS = 'shoppingList.items';
const STORAGE_CASH = 'shoppingList.cash';

const itemsListEl = document.getElementById('itemsList');
const cashInput = document.getElementById('cashInput');
const totalOut = document.getElementById('totalOut');
const cashOut = document.getElementById('cashOut');
const balanceOut = document.getElementById('balanceOut');
const budgetFill = document.getElementById('budgetFill');
const budgetPct = document.getElementById('budgetPct');
const budgetStatus = document.getElementById('budgetStatus');
const itemCount = document.getElementById('itemCount');
const addItemForm = document.getElementById('addItemForm');
const descInput = document.getElementById('descInput');
const qtyInput = document.getElementById('qtyInput');
const amountInput = document.getElementById('amountInput');
const clearBtn = document.getElementById('clearBtn');

const ICON_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

let items = [];
let editingId = null;

function loadState(){
try{
    const raw = localStorage.getItem(STORAGE_ITEMS);
    items = raw ? JSON.parse(raw) : [];
}catch(e){ items = []; }
const cash = localStorage.getItem(STORAGE_CASH);
cashInput.value = cash !== null ? cash : '';
}

function saveItems(){ localStorage.setItem(STORAGE_ITEMS, JSON.stringify(items)); }
function saveCash(){ localStorage.setItem(STORAGE_CASH, cashInput.value || '0'); }

function money(n){
return '$' + n.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

function renderRow(item){
const li = document.createElement('li');

if(item.id === editingId){
    li.className = 'item-row editing';
    li.innerHTML = `
    <div class="edit-grid">
        <input class="edit-input full" id="edit-desc-${item.id}" type="text" value="${escapeAttr(item.desc)}" maxlength="60">
        <input class="edit-input mono" id="edit-qty-${item.id}" type="number" step="1" min="1" value="${item.qty}">
        <input class="edit-input mono" id="edit-amount-${item.id}" type="number" step="0.01" min="0" value="${item.amount}">
    </div>
    <div class="item-actions edit-actions">
        <button class="icon-btn confirm" data-action="save" data-id="${item.id}" aria-label="Save changes">${ICON_CHECK}</button>
        <button class="icon-btn" data-action="cancel" data-id="${item.id}" aria-label="Cancel edit">${ICON_X}</button>
    </div>
    `;
} else {
    li.className = 'item-row';
    li.innerHTML = `
    <div class="item-main">
        <div class="item-desc">${escapeHtml(item.desc)}</div>
        <div class="item-meta">${item.qty} × ${money(item.amount)}</div>
    </div>
    <div class="item-total">${money(item.qty * item.amount)}</div>
    <div class="item-actions">
        <button class="icon-btn" data-action="edit" data-id="${item.id}" aria-label="Edit ${escapeAttr(item.desc)}">${ICON_EDIT}</button>
        <button class="icon-btn danger" data-action="delete" data-id="${item.id}" aria-label="Delete ${escapeAttr(item.desc)}">${ICON_TRASH}</button>
    </div>
    `;
}
return li;
}

function escapeHtml(str){
const div = document.createElement('div');
div.textContent = str;
return div.innerHTML;
}
function escapeAttr(str){
return String(str).replace(/"/g, '&quot;');
}

function render(){
itemsListEl.innerHTML = '';

if(items.length === 0){
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No items yet — add your first one above.';
    itemsListEl.appendChild(empty);
} else {
    items.forEach(item => itemsListEl.appendChild(renderRow(item)));
}

itemCount.textContent = items.length + (items.length === 1 ? ' item' : ' items');

const total = items.reduce((sum, i) => sum + (i.qty * i.amount), 0);
const cash = parseFloat(cashInput.value) || 0;
const balance = cash - total;
const pct = cash > 0 ? Math.min((total / cash) * 100, 100) : (total > 0 ? 100 : 0);

totalOut.textContent = money(total);
cashOut.textContent = money(cash);
balanceOut.textContent = (balance < 0 ? '-' : '') + money(Math.abs(balance));

const balanceValueEl = document.querySelector('.stat.remaining .stat-value');
balanceValueEl.classList.remove('warn', 'over');
budgetFill.classList.remove('warn', 'over');
budgetStatus.classList.remove('warn', 'over', 'ok');

if(balance < 0){
    balanceValueEl.classList.add('over');
    budgetFill.classList.add('over');
    budgetStatus.classList.add('over');
    budgetStatus.textContent = 'Over budget';
} else if(pct >= 80){
    balanceValueEl.classList.add('warn');
    budgetFill.classList.add('warn');
    budgetStatus.classList.add('warn');
    budgetStatus.textContent = 'Almost there';
} else {
    budgetStatus.classList.add('ok');
    budgetStatus.textContent = 'On track';
}

budgetFill.style.width = pct + '%';
budgetPct.textContent = Math.round(pct) + '% of cash used';
}

itemsListEl.addEventListener('click', (e) => {
const btn = e.target.closest('button[data-action]');
if(!btn) return;
const id = btn.dataset.id;
const action = btn.dataset.action;

if(action === 'edit'){
    editingId = id;
    render();
    const descEl = document.getElementById(`edit-desc-${id}`);
    if(descEl){ descEl.focus(); descEl.select(); }
} else if(action === 'cancel'){
    editingId = null;
    render();
} else if(action === 'delete'){
    items = items.filter(i => i.id !== id);
    saveItems();
    render();
} else if(action === 'save'){
    const desc = document.getElementById(`edit-desc-${id}`).value.trim();
    const qty = parseFloat(document.getElementById(`edit-qty-${id}`).value);
    const amount = parseFloat(document.getElementById(`edit-amount-${id}`).value);
    if(!desc || isNaN(qty) || qty <= 0 || isNaN(amount) || amount < 0) return;

    const item = items.find(i => i.id === id);
    item.desc = desc;
    item.qty = qty;
    item.amount = amount;
    saveItems();
    editingId = null;
    render();
}
});

addItemForm.addEventListener('submit', (e) => {
e.preventDefault();
const desc = descInput.value.trim();
const qty = parseFloat(qtyInput.value);
const amount = parseFloat(amountInput.value);
if(!desc || isNaN(qty) || qty <= 0 || isNaN(amount) || amount < 0) return;

items.push({ id: Date.now() + Math.random().toString(16).slice(2), desc, qty, amount });
saveItems();
render();

addItemForm.reset();
qtyInput.value = 1;
descInput.focus();
});

cashInput.addEventListener('input', () => {
saveCash();
render();
});

clearBtn.addEventListener('click', () => {
if(items.length === 0) return;
if(confirm('Clear all items from the list?')){
    items = [];
    editingId = null;
    saveItems();
    render();
}
});

loadState();
render();