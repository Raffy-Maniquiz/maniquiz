let products = [
	{ name: 'iPhone 15 Pro', category: 'iPhone', price: 999, stock: 8, color: 'dark', badge: 'BESTSELLER', detail: '256 GB · Natural Titanium', icon: '◉' },
	{ name: 'Pixel 9 Pro', category: 'Android', price: 899, stock: 3, color: 'blue', badge: 'NEW', detail: '128 GB · Porcelain', icon: '◉' },
	{ name: 'Galaxy S24', category: 'Android', price: 849, stock: 12, color: 'gold', badge: '', detail: '256 GB · Amber', icon: '◉' },
	{ name: 'iPhone 15', category: 'iPhone', price: 799, stock: 5, color: 'blue', badge: '', detail: '128 GB · Blue', icon: '◉' },
	{ name: 'AirPods Pro', category: 'Accessories', price: 249, stock: 18, color: 'gold', badge: '', detail: '2nd generation · USB-C', icon: '♫' },
	{ name: 'Galaxy Buds FE', category: 'Accessories', price: 99, stock: 2, color: 'dark', badge: 'LOW STOCK', detail: 'Graphite · Noise canceling', icon: '♫' },
];

const orders = [
	{ id: '#GP-2841', time: 'Today, 10:42 AM', customer: 'Maya Thompson', item: 'iPhone 15 Pro', status: 'Ready for pickup', amount: '₱999' },
	{ id: '#GP-2840', time: 'Today, 10:18 AM', customer: 'Ethan Brooks', item: 'Pixel 9 Pro', status: 'In progress', amount: '₱899' },
	{ id: '#GP-2839', time: 'Today, 9:56 AM', customer: 'Olivia Chen', item: 'AirPods Pro', status: 'Ready for pickup', amount: '₱249' },
	{ id: '#GP-2838', time: 'Today, 9:31 AM', customer: 'Noah Williams', item: 'Galaxy S24', status: 'In progress', amount: '₱849' },
];

const root = document.querySelector('#view-root');
const roleSelect = document.querySelector('#role-select');
let activeCategory = 'All phones';
let activeView = 'overview';
let cartCount = 0;
let toastTimer;

const money = (value) => new Intl.NumberFormat('en-PH', {
	style: 'currency',
	currency: 'PHP',
	maximumFractionDigits: 0,
}).format(Number(value));
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function heading(title, subtitle, action = '') {
	return `<div class="page-heading"><div><span class="eyebrow">WALANG PHONE BOSSENG? STORE</span><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div>${action}</div>`;
}

function metric(label, value, foot, icon) {
	return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></article>`;
}

function inventoryRows(items = products.slice(0, 4)) {
	return items.map((product) => `<tr><td><div class="product-cell"><span class="product-thumb">${product.icon}</span><strong>${escapeHTML(product.name)}</strong></div></td><td>${escapeHTML(product.category)}</td><td>${money(product.price)}</td><td><span class="stock-status ${product.stock <= 3 ? 'low' : ''}"><i></i>${product.stock <= 3 ? 'Low stock' : 'In stock'}</span></td><td>${product.stock} units</td></tr>`).join('');
}

function productCard(product, index) {
	return `<article class="phone-card"><div class="phone-art ${product.color}">${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}<span class="phone-device" aria-hidden="true"></span></div><div class="phone-card-body"><div class="product-meta"><span>${escapeHTML(product.category)}</span><span>${product.stock > 0 ? 'In stock' : 'Out of stock'}</span></div><h2>${escapeHTML(product.name)}</h2><p class="product-description">${escapeHTML(product.detail)}</p><div class="product-buy"><span class="product-price">${money(product.price)}</span><button class="button button-primary add-cart" data-index="${index}" ${product.stock < 1 ? 'disabled' : ''}>${product.stock > 0 ? 'Add to bag' : 'Sold out'} <span>+</span></button></div></div></article>`;
}

function adminView() {
	return `${heading('Store overview', 'Here’s what’s happening at your store today.', '<button class="button button-primary" data-action="add-product">＋ &nbsp; Add product <span>↗</span></button>')}
		<div class="metric-grid">${metric('Total revenue', '₱24,680', '<span class="trend">↑ 12.8%</span> vs last month', '↗')}${metric('Orders today', '38', '<span class="trend">↑ 8.2%</span> vs yesterday', '⌑')}${metric('Active products', products.length + 42, '<span>Across 4 categories</span>', '▧')}${metric('Low stock alerts', '6', '<span style="color:#b76544">Needs attention</span>', '⚠')}</div>
		<div class="dashboard-grid admin-dashboard-grid">
		<section class="panel"><header class="panel-header"><div><h2>Recent activity</h2><p>Latest store updates</p></div><button class="text-button" data-view="orders">View all ↗</button></header><div class="activity-list"><div class="activity-item"><span class="activity-icon">✓</span><span class="activity-copy"><strong>Order #GP-2841 completed</strong><span>Maya Thompson · 12 min ago</span></span><span class="activity-amount">+₱999</span></div><div class="activity-item"><span class="activity-icon">＋</span><span class="activity-copy"><strong>New product added</strong><span>iPhone 15 Pro · 38 min ago</span></span></div><div class="activity-item"><span class="activity-icon">♙</span><span class="activity-copy"><strong>New customer registered</strong><span>Lucas Martin · 1 hr ago</span></span></div><div class="activity-item"><span class="activity-icon">↗</span><span class="activity-copy"><strong>Daily sales goal reached</strong><span>Today · 2 hr ago</span></span></div></div></section></div>
		<div class="lower-grid"><section class="panel"><header class="panel-header"><div><h2>Inventory snapshot</h2><p>Keep an eye on your top products</p></div><button class="text-button" data-view="products">Manage inventory ↗</button></header><div class="table-wrap"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STATUS</th><th>QUANTITY</th></tr></thead><tbody>${inventoryRows()}</tbody></table></div></section><section class="panel"><header class="panel-header"><div><h2>Running low</h2><p>Products to restock soon</p></div><span class="stock-status low"><i></i>3 items</span></header><div class="mini-stock">${products.filter((item) => item.stock <= 3).slice(0, 3).map((item) => `<div class="mini-stock-row"><span class="product-thumb">${item.icon}</span><span class="mini-stock-info"><strong>${item.name}</strong><span>${item.category}</span></span><span class="stock-number">${item.stock} left</span></div>`).join('')}</div></section></div>`;
}

function customerView() {
	const categories = ['All phones', 'iPhone', 'Android', 'Accessories'];
	const visible = products.map((product, index) => ({ product, index })).filter(({ product }) => activeCategory === 'All phones' || product.category === activeCategory);
	return `${heading('Find your next favorite.', 'Good tech. Good people. And a little more joy in your pocket.')}
		<div class="catalog-toolbar"><div class="filter-row">${categories.map((category) => `<button class="filter-button ${activeCategory === category ? 'selected' : ''}" data-category="${category}" aria-pressed="${activeCategory === category}">${category}</button>`).join('')}</div><button class="cart-pill" data-action="show-cart">Your bag <strong id="cart-count">${cartCount}</strong></button></div>
		<div class="catalog-grid">${visible.map(({ product, index }) => productCard(product, index)).join('')}</div>`;
}

function staffView() {
	return `${heading('Good morning, Raffy', 'Your shift is off to a great start.', '<button class="button button-primary" data-view="orders">＋ &nbsp; New sale <span>↗</span></button>')}
		<div class="metric-grid">${metric('Orders to fulfill', '4', '<span>2 ready for pickup</span>', '⌑')}${metric('Sales today', '₱2,996', '<span class="trend">↑ 9.4%</span> vs daily average', '↗')}${metric('Customers helped', '12', '<span>Today so far</span>', '♙')}${metric('Items to restock', '3', '<span style="color:#b76544">Low stock alerts</span>', '⚠')}</div>
		<div class="staff-banner"><div><h2>You’re at 72% of your daily goal</h2><p>₱2,996 of your ₱4,150 target. Keep it going!</p></div><button class="button" data-view="orders">View sales <span>↗</span></button></div>
		<div class="dashboard-grid"><section class="panel"><header class="panel-header"><div><h2>Orders to take care of</h2><p>Pickup and in-store orders</p></div><button class="text-button" data-view="orders">View all ↗</button></header><div class="order-list">${orders.map((order, index) => `<div class="order-row"><div class="order-id"><strong>${order.id}</strong><span>${order.time}</span></div><div class="order-customer"><strong>${order.customer}</strong><br>${order.amount}</div><div class="order-item">${order.item}</div><div class="order-actions"><span class="status ${order.status === 'In progress' ? 'pending' : ''}"><i></i>${order.status}</span><button class="small-action" data-order="${index}">${order.status === 'In progress' ? 'Mark ready' : 'Details'}</button></div></div>`).join('')}</div></section>
		<div class="staff-side"><section class="panel goal-panel"><div class="goal-top"><span>Daily sales goal</span><strong>72%</strong></div><div class="progress-track"><div class="progress-fill"></div></div><div class="goal-foot"><span>₱2,996 reached</span><span>₱4,150 goal</span></div></section><section class="panel"><header class="panel-header"><div><h2>Shift checklist</h2><p>Stay on top of the little things</p></div></header><div class="staff-tasks"><div class="task-row"><button class="task-check done" aria-label="Task complete" aria-pressed="true">✓</button><span>Open the store</span></div><div class="task-row"><button class="task-check" aria-label="Task incomplete" aria-pressed="false"></button><span>Check new stock delivery</span></div><div class="task-row"><button class="task-check" aria-label="Task incomplete" aria-pressed="false"></button><span>Restock display wall</span></div><div class="task-row"><button class="task-check" aria-label="Task incomplete" aria-pressed="false"></button><span>Review pickup orders</span></div></div></section></div></div>
		<div class="lower-grid"><section class="panel"><header class="panel-header"><div><h2>Quick inventory check</h2><p>Popular products and current stock</p></div><button class="text-button" data-view="products">View inventory ↗</button></header><div class="table-wrap"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STATUS</th><th>QUANTITY</th></tr></thead><tbody>${inventoryRows()}</tbody></table></div></section><section class="panel"><header class="panel-header"><div><h2>Top seller today</h2><p>Customer favorite</p></div></header><div class="mini-stock"><div class="mini-stock-row"><span class="product-thumb">◉</span><span class="mini-stock-info"><strong>iPhone 15 Pro</strong><span>8 sold today</span></span><span class="stock-number">₱7,992</span></div></div></section></div>`;
}

function render() {
	const role = roleSelect.value;
	const titles = { overview: 'Overview', products: 'Products', orders: 'Orders', customers: 'Customers' };
	document.querySelector('#page-crumb').textContent = role === 'customer' ? 'Products' : titles[activeView];
	document.querySelector('#profile-role').textContent = role === 'admin' ? 'Store admin' : role === 'staff' ? 'Sales staff' : 'Customer';
	document.querySelector('#order-count').textContent = orders.length;
	document.querySelectorAll('.nav-link').forEach((link) => {
		link.hidden = role === 'customer' && link.dataset.view !== 'products';
		link.classList.toggle('active', link.dataset.view === activeView);
	});
	const view = role === 'customer' ? customerView() : activeView === 'overview' ? (role === 'staff' ? staffView() : adminView()) : activeView === 'products' ? productsView() : activeView === 'orders' ? ordersView() : customersView();
	root.innerHTML = view;
	root.style.animation = 'none';
	requestAnimationFrame(() => { root.style.animation = ''; });
}

function productsView() {
	if (roleSelect.value === 'customer') return customerView();
	return `${heading('Products', 'Manage the devices and accessories in your store.', '<button class="button button-primary" data-action="add-product">＋ &nbsp; Add product <span>↗</span></button>')}<section class="panel"><div class="catalog-toolbar inventory-toolbar"><label class="search-box"><span>⌕</span><input id="product-search" type="search" placeholder="Search products" aria-label="Search products"></label><div class="filter-row">${['All phones', 'iPhone', 'Android', 'Accessories'].map((category) => `<button class="filter-button ${activeCategory === category ? 'selected' : ''}" data-category="${category}">${category}</button>`).join('')}</div></div><div class="table-wrap"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STATUS</th><th>QUANTITY</th></tr></thead><tbody>${filteredInventoryRows()}</tbody></table></div></section>`;
}

function filteredInventoryRows() {
	const search = (document.querySelector('#product-search')?.value || '').toLowerCase();
	const filtered = products.filter((product) => (activeCategory === 'All phones' || product.category === activeCategory) && `${product.name} ${product.category}`.toLowerCase().includes(search));
	return filtered.length ? inventoryRows(filtered) : '<tr><td colspan="5"><div class="empty-state">No products found.</div></td></tr>';
}

function ordersView() {
	return `${heading('Orders', 'Track pickup and in-store orders.') }<section class="panel"><div class="order-list">${orders.map((order, index) => `<div class="order-row"><div class="order-id"><strong>${order.id}</strong><span>${order.time}</span></div><div class="order-customer"><strong>${order.customer}</strong><br>${order.amount}</div><div class="order-item">${order.item}</div><div class="order-actions"><span class="status ${order.status === 'In progress' ? 'pending' : ''}"><i></i>${order.status}</span><button class="small-action" data-order="${index}">${order.status === 'In progress' ? 'Mark ready' : 'Details'}</button></div></div>`).join('')}</div></section>`;
}

function customersView() {
	const customers = [...new Map(orders.map((order) => [order.customer, order])).values()];
	return `${heading('Customers', 'A quick look at your recent customers.') }<section class="panel"><div class="table-wrap"><table><thead><tr><th>CUSTOMER</th><th>LATEST ORDER</th><th>PRODUCT</th><th>ORDER TOTAL</th></tr></thead><tbody>${customers.map((customer) => `<tr><td><strong>${customer.customer}</strong></td><td>${customer.id}</td><td>${customer.item}</td><td>${customer.amount}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function showToast(message) {
	const toast = document.querySelector('#toast');
	toast.textContent = message;
	toast.classList.add('show');
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

document.addEventListener('click', (event) => {
	const target = event.target.closest('button');
	if (!target) return;
	if (target.dataset.view) {
			if (roleSelect.value === 'customer' && target.dataset.view !== 'products') return;
			activeView = target.dataset.view;
		render();
	} else if (target.dataset.category) {
		activeCategory = target.dataset.category;
		render();
	} else if (target.dataset.action === 'add-product') {
		document.querySelector('#product-dialog').showModal();
	} else if (target.dataset.action === 'show-cart') {
		showToast(cartCount ? `${cartCount} item${cartCount === 1 ? '' : 's'} in your bag.` : 'Your bag is empty.');
	} else if (target.classList.contains('add-cart')) {
		const product = products[Number(target.dataset.index)];
		if (!product || product.stock < 1) return;
		product.stock -= 1;
		cartCount += 1;
		render();
		showToast(`${product.name} added to your bag.`);
	} else if (target.dataset.order !== undefined) {
		const order = orders[Number(target.dataset.order)];
		if (order.status === 'In progress') {
			order.status = 'Ready for pickup';
			render();
			showToast(`${order.id} is ready for pickup.`);
		} else showToast(`${order.id} for ${order.customer}.`);
	} else if (target.classList.contains('task-check')) {
		const complete = target.classList.toggle('done');
		target.textContent = complete ? '✓' : '';
		target.setAttribute('aria-pressed', String(complete));
		target.setAttribute('aria-label', complete ? 'Task complete' : 'Task incomplete');
	} else if (target.classList.contains('close-dialog')) {
		document.querySelector('#product-dialog').close();
	} else if (target.classList.contains('notification-button')) {
		showToast('You’re all caught up.');
	}
});

document.addEventListener('input', (event) => {
	if (event.target.id === 'product-search') {
		const tbody = root.querySelector('tbody');
		if (tbody) tbody.innerHTML = filteredInventoryRows();
	}
});

roleSelect.addEventListener('change', () => {
	activeView = roleSelect.value === 'customer' ? 'products' : 'overview';
	render();
});

document.querySelector('#product-form').addEventListener('submit', (event) => {
	event.preventDefault();
	const formData = new FormData(event.currentTarget);
	products.unshift({ name: formData.get('name').trim(), category: formData.get('category'), price: Number(formData.get('price')), stock: Number(formData.get('stock')), color: 'gold', badge: 'NEW', detail: formData.get('detail').trim() || 'New arrival', icon: '◉' });
	activeCategory = 'All phones';
	event.currentTarget.reset();
	document.querySelector('#product-dialog').close();
	activeView = 'products';
	render();
	showToast('Product added to inventory.');
});

document.querySelector('.profile-button').addEventListener('click', () => {
	showToast(`Signed in as ${roleSelect.options[roleSelect.selectedIndex].text}.`);
});

render();
