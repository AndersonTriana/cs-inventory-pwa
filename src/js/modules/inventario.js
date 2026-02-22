document.addEventListener('alpine:init', () => {
    Alpine.data('inventarioStore', () => ({
        stock: [],
        searchQuery: '',

        // State for editing
        editPriceValue: 0,
        defectQty: 1,
        editingId: null,

        async loadInventario() {
            try {
                const data = await db.inventario.toArray();
                this.stock = data;
            } catch (e) {
                console.error("Error cargando inventario", e);
            }
        },

        startEditFromModal(root) {
            // When modal opens, we pick value from modalData in parent appStore
            const data = this.modalData; // Accessible because we're in x-data inside x-data
            if (data && data.valorVenta) {
                this.editPriceValue = data.valorVenta;
            }
        },

        async savePrice(id) {
            try {
                const numericId = parseInt(id);
                const newPrice = parseFloat(this.editPriceValue) || 0;
                const invItem = await db.inventario.get(numericId);
                if (!invItem) {
                    console.warn("Item not found with id", numericId);
                    return;
                }

                const newTotal = (parseInt(invItem.cantidad) || 0) * newPrice;

                await db.inventario.update(numericId, {
                    valorVenta: newPrice,
                    valorTotal: newTotal
                });

                await this.loadInventario();
            } catch (e) {
                console.error(e);
                alert("Error al actualizar precio");
            }
        },

        async reportarDefectuosoModal(item) {
            const numCant = parseInt(this.defectQty);
            if (isNaN(numCant) || numCant <= 0) return alert("Cantidad inválida");
            if (numCant > item.cantidad) return alert("No puedes reportar más de lo que hay en stock");

            try {
                await db.defectuosos.add({
                    compra: 'Desde Inventario',
                    producto: item.nombre,
                    cantidad: numCant,
                    valorUnitario: parseFloat(item.valorVenta) || 0,
                    valorTotal: numCant * (parseFloat(item.valorVenta) || 0),
                    fecha: new Date().toISOString()
                });

                const newQty = item.cantidad - numCant;
                await db.inventario.update(item.id, {
                    cantidad: newQty,
                    valorTotal: newQty * (parseFloat(item.valorVenta) || 0)
                });

                alert("Reportado con éxito");
                this.defectQty = 1;
                await this.loadInventario();
            } catch (e) {
                console.error(e);
                alert("Error al reportar");
            }
        },

        get filteredStock() {
            if (this.searchQuery === '') return this.stock;
            return this.stock.filter(item => {
                return item.nombre && item.nombre.toLowerCase().includes(this.searchQuery.toLowerCase());
            });
        }
    }));
});
