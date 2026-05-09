const defaultInventory = [
    { id: 1, name: "Cola", category: "drinks", price: 1.50, color: "#991b1b" },
    { id: 2, name: "Lemon Soda", category: "drinks", price: 1.50, color: "#a16207" },
    { id: 3, name: "Water", category: "drinks", price: 1.00, color: "#1e40af" },
    { id: 4, name: "Energy Drink", category: "drinks", price: 2.50, color: "#166534" },
    { id: 5, name: "Potato Chips", category: "chips", price: 2.00, color: "#c2410c" },
    { id: 6, name: "Tortilla Chips", category: "chips", price: 2.25, color: "#b91c1c" },
    { id: 7, name: "Cheese Puffs", category: "chips", price: 1.75, color: "#ca8a04" },
    { id: 8, name: "Chocolate Bar", category: "candy", price: 1.25, color: "#6b21a8" },
    { id: 9, name: "Lollipops", category: "candy", price: 0.50, color: "#be123c" }
];

// Initialize global state from LocalStorage
let inventory;
try {
    inventory = JSON.parse(localStorage.getItem('posInventory'));
    if (!Array.isArray(inventory) || inventory.length === 0) {
        inventory = defaultInventory;
        localStorage.setItem('posInventory', JSON.stringify(inventory));
    }
} catch(e) {
    inventory = defaultInventory;
    localStorage.setItem('posInventory', JSON.stringify(inventory));
}

let cart;
try {
    cart = JSON.parse(localStorage.getItem('posCart'));
    if (!Array.isArray(cart)) cart = [];
} catch(e) {
    cart = [];
}

// Global error handler to help debug on mobile
window.addEventListener('error', function(e) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:red;color:white;z-index:9999;padding:10px;font-size:12px;';
    errorDiv.textContent = 'Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno;
    document.body.appendChild(errorDiv);
});

const isInventoryPage = document.body.dataset.page === 'inventory';

if (isInventoryPage) {
    initInventoryPage();
} else {
    initPOSPage();
}

// ==========================================
// POS PAGE LOGIC
// ==========================================
function initPOSPage() {
    renderProducts();
    updateCartUI();
    setupPOSEventListeners();
}

function renderProducts() {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;
    
    productGrid.innerHTML = '';
    
    inventory.forEach(p => {
        const itemInCart = cart.find(item => item.id == p.id);
        const qty = itemInCart ? itemInCart.qty : 0;
        
        const col = document.createElement('div');
        col.className = 'col product-item';
        col.dataset.category = p.category.toLowerCase();
        col.dataset.name = p.name.toLowerCase();
        
        col.innerHTML = `
            <div class="card bg-secondary text-light h-100 product-card border-0 shadow-sm">
                <div class="product-color-box rounded-top" style="background-color: ${p.color}" onclick="addToCart(${p.id})">
                    ${p.name}
                </div>
                <div class="card-body d-flex flex-column justify-content-between p-2">
                    <div class="fw-bold text-light mb-2">₱${parseFloat(p.price).toFixed(2)}</div>
                    <div class="d-flex align-items-center justify-content-between bg-dark rounded border border-secondary p-1">
                        <button class="btn btn-sm btn-secondary qty-btn" onclick="updateQty(${p.id}, -1)">-</button>
                        <span class="fw-bold px-2" id="qty-${p.id}">${qty}</span>
                        <button class="btn btn-sm btn-primary qty-btn" onclick="updateQty(${p.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
        productGrid.appendChild(col);
    });
}

function addToCart(id) {
    updateQty(id, 1);
}

function updateQty(id, change) {
    const product = inventory.find(p => p.id == id);
    if (!product) return;

    const existingItem = cart.find(item => item.id == id);
    
    if (existingItem) {
        existingItem.qty += change;
        if (existingItem.qty <= 0) {
            cart = cart.filter(item => item.id != id);
        }
    } else if (change > 0) {
        cart.push({ ...product, qty: change });
    }

    localStorage.setItem('posCart', JSON.stringify(cart));
    updateCartUI();
    
    const qtyDisplay = document.getElementById(`qty-${id}`);
    if (qtyDisplay) {
        const item = cart.find(i => i.id == id);
        qtyDisplay.textContent = item ? item.qty : 0;
    }
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItemsContainer) return;

    Array.from(cartItemsContainer.children).forEach(child => {
        if (child !== emptyCartMessage) {
            child.remove();
        }
    });
    
    let subtotal = 0;
    let itemCount = 0;

    if (cart.length === 0) {
        emptyCartMessage.classList.remove('d-none');
        checkoutBtn.disabled = true;
    } else {
        emptyCartMessage.classList.add('d-none');
        checkoutBtn.disabled = false;
        
        cart.forEach(item => {
            const itemTotal = parseFloat(item.price) * item.qty;
            subtotal += itemTotal;
            itemCount += item.qty;

            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'bg-secondary rounded p-2 mb-2 border border-dark';
            cartItemEl.innerHTML = `
                <div class="d-flex justify-content-between mb-2">
                    <span class="fw-bold text-white">${item.name}</span>
                    <span class="fw-bold text-white">₱${itemTotal.toFixed(2)}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-light small">₱${parseFloat(item.price).toFixed(2)} each</span>
                    <div class="d-flex align-items-center bg-dark rounded border border-dark p-1">
                        <button class="btn btn-sm btn-secondary p-0" style="width:25px; height:25px;" onclick="updateQty(${item.id}, -1)">-</button>
                        <span class="fw-bold text-center px-2" style="min-width: 30px;">${item.qty}</span>
                        <button class="btn btn-sm btn-primary p-0" style="width:25px; height:25px;" onclick="updateQty(${item.id}, 1)">+</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemEl);
            
            const gridQty = document.getElementById(`qty-${item.id}`);
            if (gridQty) gridQty.textContent = item.qty;
        });
    }

    const total = subtotal;

    const cartSubtotalEl = document.getElementById('cartSubtotal');
    if (cartSubtotalEl) cartSubtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
    
    const cartTaxEl = document.getElementById('cartTax');
    if (cartTaxEl) cartTaxEl.textContent = `₱0.00`;

    document.getElementById('cartTotal').textContent = `₱${total.toFixed(2)}`;
    document.getElementById('mobileCartCount').textContent = itemCount;
    document.getElementById('mobileCartTotal').textContent = `₱${total.toFixed(2)}`;
    document.getElementById('modalTotal').textContent = `₱${total.toFixed(2)}`;
    
    // reset grid elements if not in cart
    inventory.forEach(p => {
        if(!cart.find(i => i.id == p.id)) {
            const gridQty = document.getElementById(`qty-${p.id}`);
            if (gridQty) gridQty.textContent = 0;
        }
    });
}

function setupPOSEventListeners() {
    // Filtering
    const searchInput = document.getElementById('searchInput');
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeBtn = document.querySelector('.category-btn.active');
        const category = activeBtn ? activeBtn.dataset.category : 'all';
        const productItems = document.querySelectorAll('.product-item');

        productItems.forEach(item => {
            const name = item.dataset.name;
            const itemCategory = item.dataset.category;
            const matchesSearch = name.includes(searchTerm);
            const matchesCategory = category === 'all' || itemCategory === category;
            
            if (matchesSearch && matchesCategory) {
                item.classList.remove('d-none');
            } else {
                item.classList.add('d-none');
            }
        });
    }

    searchInput.addEventListener('input', filterProducts);

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryBtns.forEach(b => {
                b.classList.remove('btn-primary', 'active');
                b.classList.add('btn-outline-light');
            });
            const target = e.target;
            target.classList.remove('btn-outline-light');
            target.classList.add('btn-primary', 'active');
            filterProducts();
        });
    });

    // Mobile Panel
    const cartPanel = document.getElementById('cartPanel');
    document.getElementById('mobileCartBtn').addEventListener('click', () => cartPanel.classList.add('show'));
    document.getElementById('closeCartBtn').addEventListener('click', () => cartPanel.classList.remove('show'));

    document.getElementById('clearCartBtn').addEventListener('click', () => {
        if(confirm("Clear cart?")) {
            cart = [];
            localStorage.setItem('posCart', JSON.stringify(cart));
            updateCartUI();
        }
    });

    // Checkout Modal
    const paymentMethods = document.querySelectorAll('.payment-method');
    const completePaymentBtn = document.getElementById('completePaymentBtn');
    const paymentMethodsContainer = document.getElementById('paymentMethods');
    const checkoutMessage = document.getElementById('checkoutMessage');
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    const cashInputSection = document.getElementById('cashInputSection');
    const amountTendered = document.getElementById('amountTendered');
    const changeAmountDisplay = document.getElementById('changeAmountDisplay');
    let selectedPaymentMethod = null;

    function calculateChange() {
        const orderTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
        const tendered = parseFloat(amountTendered.value) || 0;
        const change = tendered - orderTotal;

        if (tendered >= orderTotal && orderTotal > 0) {
            changeAmountDisplay.textContent = `₱${change.toFixed(2)}`;
            changeAmountDisplay.classList.remove('text-danger');
            changeAmountDisplay.classList.add('text-success');
            completePaymentBtn.disabled = false;
        } else {
            changeAmountDisplay.textContent = `₱0.00`;
            changeAmountDisplay.classList.remove('text-success');
            changeAmountDisplay.classList.add('text-danger');
            completePaymentBtn.disabled = true;
        }
    }

    amountTendered.addEventListener('input', calculateChange);

    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('border-primary', 'bg-dark'));
            method.classList.add('border-primary', 'bg-dark');
            selectedPaymentMethod = method.dataset.method;
            
            if (selectedPaymentMethod === 'Cash') {
                cashInputSection.classList.remove('d-none');
                calculateChange();
            } else {
                cashInputSection.classList.add('d-none');
                completePaymentBtn.disabled = false;
            }
        });
    });

    document.getElementById('checkoutModal').addEventListener('show.bs.modal', () => {
        // Hide cart panel on mobile to prevent layering issues
        document.getElementById('cartPanel').classList.remove('show');
        
        completePaymentBtn.classList.remove('d-none');
        completePaymentBtn.disabled = true;
        completePaymentBtn.textContent = 'Complete Payment';
        paymentMethodsContainer.classList.remove('d-none');
        printReceiptBtn.classList.add('d-none');
        checkoutMessage.classList.add('d-none');
        cashInputSection.classList.add('d-none');
        amountTendered.value = '';
        changeAmountDisplay.textContent = '₱0.00';
        changeAmountDisplay.classList.remove('text-danger');
        changeAmountDisplay.classList.add('text-success');
        paymentMethods.forEach(m => m.classList.remove('border-primary', 'bg-dark'));
        selectedPaymentMethod = null;
    });

    completePaymentBtn.addEventListener('click', () => {
        completePaymentBtn.textContent = 'Processing...';
        completePaymentBtn.disabled = true;

        // Simulate network request for offline mode
        setTimeout(() => {
            paymentMethodsContainer.classList.add('d-none');
            completePaymentBtn.classList.add('d-none');
            
            checkoutMessage.classList.remove('d-none', 'alert-danger');
            checkoutMessage.classList.add('alert-success');
            checkoutMessage.textContent = 'Order successful! Offline Mode.';
            
            printReceiptBtn.classList.remove('d-none');
            
            const orderTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
            updateDailyRevenue(orderTotal);

            cart = [];
            localStorage.setItem('posCart', JSON.stringify(cart));
            updateCartUI();
        }, 600);
    });
}

// ==========================================
// INVENTORY PAGE LOGIC
// ==========================================
function initInventoryPage() {
    renderInventoryTable();
    updateRevenueDisplay();
    
    document.getElementById('addSnackForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('addName').value.trim();
        const category = document.getElementById('addCategory').value;
        const price = parseFloat(document.getElementById('addPrice').value);
        
        if (name && price > 0) {
            // Generate a simple numeric ID based on max existing ID
            const newId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
            
            inventory.unshift({
                id: newId,
                name,
                category,
                price
            });
            
            localStorage.setItem('posInventory', JSON.stringify(inventory));
            showMessage('Product added successfully!', 'success');
            e.target.reset();
            renderInventoryTable();
        }
    });
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (inventory.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-5"><i class="bi bi-inboxes display-4 d-block mb-3"></i>No products found in inventory.</td></tr>`;
        return;
    }

    inventory.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-4">${p.id}</td>
            <td class="fw-bold">${p.name}</td>
            <td class="text-capitalize">${p.category}</td>
            <td>₱${parseFloat(p.price).toFixed(2)}</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-danger shadow-sm" onclick="deleteProduct(${p.id})">
                    <i class="bi bi-trash3 me-1"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteProduct = function(id) {
    if (confirm("Are you sure you want to delete this snack?")) {
        inventory = inventory.filter(p => p.id != id);
        localStorage.setItem('posInventory', JSON.stringify(inventory));
        
        // Also remove it from cart if present
        cart = cart.filter(item => item.id != id);
        localStorage.setItem('posCart', JSON.stringify(cart));
        
        showMessage('Product deleted.', 'success');
        renderInventoryTable();
    }
}

function showMessage(msg, type) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `
        <div class='alert alert-${type} alert-dismissible fade show'>
            ${msg}
            <button type='button' class='btn-close' data-bs-dismiss='alert'></button>
        </div>
    `;
    setTimeout(() => {
        container.innerHTML = '';
    }, 3000);
}

function updateDailyRevenue(amount) {
    const today = new Date().toLocaleDateString();
    let revenueData;
    try {
        revenueData = JSON.parse(localStorage.getItem('posDailyRevenue')) || {};
    } catch(e) {
        revenueData = {};
    }

    if (revenueData.date !== today) {
        revenueData = { date: today, total: 0 };
    }
    
    revenueData.total += amount;
    localStorage.setItem('posDailyRevenue', JSON.stringify(revenueData));
}

function updateRevenueDisplay() {
    const today = new Date().toLocaleDateString();
    let revenueData;
    try {
        revenueData = JSON.parse(localStorage.getItem('posDailyRevenue')) || {};
    } catch(e) {
        revenueData = {};
    }

    let dailyTotal = 0;
    if (revenueData.date === today) {
        dailyTotal = revenueData.total;
    }

    const dateDisplay = document.getElementById('todayDateDisplay');
    const revenueDisplay = document.getElementById('dailyRevenueDisplay');
    
    if (dateDisplay) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
    }
    
    if (revenueDisplay) {
        revenueDisplay.textContent = `₱${dailyTotal.toFixed(2)}`;
    }
}