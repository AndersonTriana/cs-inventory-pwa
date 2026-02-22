document.addEventListener('alpine:init', () => {
    // Define the global store for app-wide state
    Alpine.store('app', {
        currentPage: 'dashboard',
        activeModal: null,
        modalData: {},
        stats: {
            totalVentas: 0,
            totalCompras: 0,
            totalOwed: 0,
            totalInventoryValue: 0,
            lowStockCount: 0
        },

        initApp() {
            this.loadStats();
            this.registerServiceWorker();

            // Listen for page changes to close modals
            window.addEventListener('popstate', () => {
                this.closeModal();
            });
        },

        setPage(page) {
            this.currentPage = page;
            this.closeModal();
            // Scroll to top
            window.scrollTo(0, 0);
        },

        openModal(modalName, data = {}) {
            this.activeModal = modalName;
            this.modalData = data;
            document.body.style.overflow = 'hidden';

            // Ensure child components can react
            window.dispatchEvent(new CustomEvent('modal-opened', { detail: { name: modalName, data } }));
        },

        closeModal() {
            this.activeModal = null;
            this.modalData = {};
            document.body.style.overflow = '';
        },

        getPageTitle() {
            const titles = {
                'dashboard': 'CS Inventory',
                'inventario': 'Stock / Inventario',
                'ventas': 'Módulo Ventas',
                'compras': 'Módulo Compras',
                'historialVentas': 'Historial Ventas',
                'historialCompras': 'Historial Compras',
                'deben': 'Deudores',
                'clientes': 'Directorio Clientes',
                'proveedores': 'Directorio Proveedores',
                'defectuosos': 'Productos Defectuosos',
                'config': 'Configuración'
            };
            return titles[this.currentPage] || 'CS Inventory';
        },

        async loadStats() {
            try {
                const stock = await db.inventario.toArray();
                this.stats.totalInventoryValue = stock.reduce((s, i) => s + (parseFloat(i.valorTotal) || 0), 0);
                this.stats.lowStockCount = stock.filter(i => (parseInt(i.cantidad) || 0) <= 2).length;

                const clients = await db.clientes.toArray();
                this.stats.totalOwed = clients.reduce((s, c) => s + (parseFloat(c.debe) || 0), 0);
            } catch (e) { console.error(e); }
        },

        registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                if (window.location.protocol === 'file:') {
                    console.warn('Service Worker registration skipped: Running from file://');
                    return;
                }
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('SW Registered', reg.scope))
                    .catch(err => console.error('SW Registration failed', err));
            }
        }
    });

    // Main controller data
    Alpine.data('appStore', () => ({
        // State proxies
        get currentPage() { return Alpine.store('app').currentPage },
        get activeModal() { return Alpine.store('app').activeModal },
        get modalData() { return Alpine.store('app').modalData },
        get stats() { return Alpine.store('app').stats },
        get totalInventoryValue() { return this.stats.totalInventoryValue },
        get totalOwed() { return this.stats.totalOwed },
        get lowStockCount() { return this.stats.lowStockCount },

        // Method proxies
        initApp() { Alpine.store('app').initApp() },
        setPage(p) { Alpine.store('app').setPage(p) },
        openModal(n, d) { Alpine.store('app').openModal(n, d) },
        closeModal() { Alpine.store('app').closeModal() },
        getPageTitle() { return Alpine.store('app').getPageTitle() },

        // Helpers
        formatCurrency(v) { return window.helpers.formatCurrency(v) },
        formatDate(d) { return window.helpers.formatDate(d) },

        // Local logic
        showSubmenu: false,
        toggleSubmenu() { this.showSubmenu = !this.showSubmenu; }
    }));
});
