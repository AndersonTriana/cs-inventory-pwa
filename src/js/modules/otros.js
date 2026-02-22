document.addEventListener('alpine:init', () => {
    // --- Clientes ---
    Alpine.data('clientesStore', () => ({
        clientes: [],
        async loadData() {
            this.clientes = await db.clientes.toArray();
        }
    }));

    // --- Proveedores ---
    Alpine.data('proveedoresStore', () => ({
        proveedores: [],
        async loadData() {
            this.proveedores = await db.proveedores.toArray();
        }
    }));

    // --- Deben (Deudores) ---
    Alpine.data('debenStore', () => ({
        deudores: [],
        totalDeuda: 0,
        async loadData() {
            const ventas = await db.ventas.toArray();
            const conDeuda = ventas.filter(v => helpers.parseCurrency(v.debe) > 0);

            const sum = {};
            for (let v of conDeuda) {
                const cli = v.cliente || 'Desconocido';
                sum[cli] = (sum[cli] || 0) + helpers.parseCurrency(v.debe);
            }

            this.deudores = Object.keys(sum).map(c => ({ nombre: c, debe: sum[c] })).filter(d => d.debe > 0);
            this.totalDeuda = this.deudores.reduce((acc, obj) => acc + obj.debe, 0);
        }
    }));

    // --- Productos Defectuosos ---
    Alpine.data('defectuososStore', () => ({
        historico: [],
        productos: [],
        compras: [],
        form: {
            compraId: '',
            productoId: '',
            productoStr: '',
            cantidad: 1,
            valorUnitario: 0
        },

        get valorTotal() {
            return (parseInt(this.form.cantidad) || 0) * (parseFloat(this.form.valorUnitario) || 0);
        },

        async loadData() {
            this.historico = await db.defectuosos.reverse().toArray(); // Full history now
            this.productos = await db.inventario.toArray();
            this.compras = await db.compras.reverse().limit(50).toArray();
        },

        onProductoChange() {
            const p = this.productos.find(x => x.id == this.form.productoId);
            if (p) {
                this.form.productoStr = p.nombre;
                this.form.valorUnitario = parseFloat(p.valorVenta) || 0;
            }
        },

        async submitDefectuoso() {
            try {
                if (!this.form.productoStr && !this.form.productoId) return alert('Selecciona el producto');

                let productName = this.form.productoStr;
                if (!productName && this.form.productoId) {
                    const pr = this.productos.find(p => p.id == this.form.productoId);
                    if (pr) productName = pr.nombre;
                }

                await db.defectuosos.add({
                    compra: this.form.compraId || 'Desc',
                    producto: productName,
                    cantidad: parseInt(this.form.cantidad),
                    valorUnitario: parseFloat(this.form.valorUnitario),
                    valorTotal: this.valorTotal,
                    fecha: new Date().toISOString()
                });

                const invObj = await db.inventario.where('nombre').equalsIgnoreCase(productName).first();
                if (invObj) {
                    const newQty = Math.max(0, (parseInt(invObj.cantidad) || 0) - parseInt(this.form.cantidad));
                    const newTotal = newQty * (parseFloat(invObj.valorVenta) || 0);
                    await db.inventario.update(invObj.id, {
                        cantidad: newQty,
                        valorTotal: newTotal
                    });
                }

                alert("¡Reportado exitosamente y stock ajustado!");
                this.form = { compraId: '', productoId: '', productoStr: '', cantidad: 1, valorUnitario: 0 };
                await this.loadData();
            } catch (e) {
                console.error(e);
                alert("Error al reportar");
            }
        }
    }));

    // --- Historial de Ventas ---
    Alpine.data('historialVentasStore', () => ({
        ventas: [],
        async loadData() {
            this.ventas = await db.ventas.reverse().toArray();
        }
    }));

    // --- Historial de Compras ---
    Alpine.data('historialComprasStore', () => ({
        compras: [],
        async loadData() {
            this.compras = await db.compras.reverse().toArray();
        }
    }));

    // --- Módulo Configuración & Import/Export ---
    Alpine.data('configStore', () => ({
        exportarDatos() {
            if (window.ImportExport) {
                window.ImportExport.exportToExcel();
            } else {
                alert("La utilidad de exportación no está disponible");
            }
        }
    }));
});
