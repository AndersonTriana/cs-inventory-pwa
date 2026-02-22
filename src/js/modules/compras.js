document.addEventListener('alpine:init', () => {
    Alpine.data('comprasStore', () => ({
        proveedores: [],
        productos: [],

        carrito: [],
        proveedorId: '',
        proveedorStr: '',
        detalles: '',

        formItem: {
            productoId: '',
            productoStr: '',
            cantidad: 1,
            valorUnitario: 0
        },

        get valorTotal() {
            return this.carrito.reduce((sum, item) => sum + (item.cantidad * item.valorUnitario), 0);
        },

        async loadFormData() {
            this.proveedores = await db.proveedores.toArray();
            this.productos = await db.inventario.toArray();
        },

        onProductoChange() {
            const p = this.productos.find(x => x.id == this.formItem.productoId);
            if (p) {
                this.formItem.productoStr = p.nombre;
            }
        },

        onProveedorChange() {
            const pr = this.proveedores.find(p => p.id == this.proveedorId);
            if (pr) {
                this.proveedorStr = pr.nombre;
            }
        },

        agregarAlCarrito() {
            if (!this.formItem.productoStr && !this.formItem.productoId) return alert('Indica el nombre del producto nuevo o existente');
            let productName = this.formItem.productoStr;
            if (!productName && this.formItem.productoId) {
                const pr = this.productos.find(p => p.id == this.formItem.productoId);
                if (pr) productName = pr.nombre;
            }
            this.carrito.push({
                productoId: this.formItem.productoId,
                productoStr: productName,
                cantidad: parseInt(this.formItem.cantidad) || 1,
                valorUnitario: parseFloat(this.formItem.valorUnitario) || 0
            });
            this.formItem = { productoId: '', productoStr: '', cantidad: 1, valorUnitario: 0 };
        },

        quitarDelCarrito(index) {
            this.carrito.splice(index, 1);
        },

        async submitCompra() {
            try {
                if (this.carrito.length === 0) return alert('Debes agregar al menos un producto a la compra');
                if (!this.proveedorStr) return alert('Falta el proveedor');

                const numeroCompra = "C-" + helpers.generateId().substring(0, 6).toUpperCase();

                // Cabecera Compra
                await db.compras.add({
                    numero: numeroCompra,
                    proveedor: this.proveedorStr,
                    valor: this.valorTotal,
                    fechaPedido: window.helpers.formatDate(new Date()),
                    descripcion: this.detalles
                });

                // Detalle e Inventario
                for (let item of this.carrito) {
                    await db.productosComprados.add({
                        compraId: numeroCompra,
                        nombre: item.productoStr,
                        cantidad: item.cantidad,
                        valorUnitario: item.valorUnitario,
                        valorTotal: item.cantidad * item.valorUnitario
                    });

                    const invObj = await db.inventario.where('nombre').equalsIgnoreCase(item.productoStr).first();
                    if (invObj) {
                        const newQty = (parseInt(invObj.cantidad) || 0) + item.cantidad;
                        const newTotal = newQty * (parseFloat(invObj.valorVenta) || 0);
                        await db.inventario.update(invObj.id, {
                            cantidad: newQty,
                            valorTotal: newTotal
                        });
                    } else {
                        await db.inventario.add({
                            nombre: item.productoStr,
                            cantidad: item.cantidad,
                            valorVenta: 0,
                            valorTotal: 0
                        });
                    }
                }

                alert("¡Compra Registrada y Stock de todos los productos fue Aumentado!");

                this.carrito = [];
                this.proveedorId = '';
                this.proveedorStr = '';
                this.detalles = '';
                await this.loadFormData();

                // Close Modal
                Alpine.store('app').closeModal();

            } catch (e) {
                console.error(e);
                alert("Error al registrar compra.");
            }
        }
    }));
});
