document.addEventListener('alpine:init', () => {
    Alpine.data('ventasStore', () => ({
        productos: [],
        clientes: [],

        carrito: [],
        clienteId: '',
        clienteStr: '',
        valorPagado: 0,
        comentarios: '',

        formItem: {
            productoId: '',
            productoStr: '',
            cantidad: 1,
            valorVenta: 0
        },

        get valorTotal() {
            return this.carrito.reduce((sum, item) => sum + (item.cantidad * item.valorVenta), 0);
        },

        get debe() {
            const diff = this.valorTotal - (parseFloat(this.valorPagado) || 0);
            return diff > 0 ? diff : 0;
        },

        async loadFormData() {
            this.productos = await db.inventario.toArray();
            this.clientes = await db.clientes.toArray();
        },

        onProductoChange() {
            const p = this.productos.find(x => x.id == this.formItem.productoId);
            if (p) {
                this.formItem.productoStr = p.nombre;
                this.formItem.valorVenta = parseFloat(p.valorVenta) || 0;
            }
        },

        onClienteChange() {
            const cl = this.clientes.find(c => c.id == this.clienteId);
            if (cl) {
                this.clienteStr = cl.nombre;
            }
        },

        agregarAlCarrito() {
            if (!this.formItem.productoStr && !this.formItem.productoId) return alert("Selecciona un producto");

            let productName = this.formItem.productoStr;
            if (!productName && this.formItem.productoId) {
                const pr = this.productos.find(p => p.id == this.formItem.productoId);
                if (pr) productName = pr.nombre;
            }

            this.carrito.push({
                productoId: this.formItem.productoId,
                productoStr: productName,
                cantidad: parseInt(this.formItem.cantidad) || 1,
                valorVenta: parseFloat(this.formItem.valorVenta) || 0
            });

            // Sugerir pago completo cada vez que se agrega al carrito
            this.valorPagado = this.valorTotal;

            // Reset form
            this.formItem = { productoId: '', productoStr: '', cantidad: 1, valorVenta: 0 };
        },

        quitarDelCarrito(index) {
            this.carrito.splice(index, 1);
            this.valorPagado = this.valorTotal;
        },

        async submitVenta() {
            try {
                if (this.carrito.length === 0) return alert('No hay productos en la venta. Usa "Añadir a la Venta"');
                if (!this.clienteStr && !this.clienteId) return alert('Agrega o selecciona un cliente');

                let clientName = this.clienteStr;
                if (!clientName && this.clienteId) {
                    const cl = this.clientes.find(c => c.id == this.clienteId);
                    if (cl) clientName = cl.nombre;
                }

                // Remover Proxies de Alpine para evitar DataCloneError en Dexie
                const carritoRaw = JSON.parse(JSON.stringify(this.carrito));

                // Generar resumen para vistas legacy
                const resumenProductos = carritoRaw.map(item => `${item.cantidad}x ${item.productoStr}`).join(', ');

                const nuevaVenta = {
                    producto: resumenProductos,
                    productosDetalle: carritoRaw,
                    cliente: clientName,
                    cantidad: carritoRaw.reduce((sum, item) => sum + item.cantidad, 0),
                    valorPagado: parseFloat(this.valorPagado) || 0,
                    valorVenta: 0,
                    valorTotal: this.valorTotal,
                    debe: this.debe,
                    comentarios: this.comentarios,
                    fecha: new Date().toISOString()
                };

                await db.ventas.add(nuevaVenta);

                // Descontar Inventario
                for (let item of this.carrito) {
                    if (item.productoId) {
                        const inv = await db.inventario.get(parseInt(item.productoId));
                        if (inv) {
                            const currentQty = parseInt(inv.cantidad) || 0;
                            const newQty = Math.max(0, currentQty - item.cantidad);
                            const newTotal = newQty * (parseFloat(inv.valorVenta) || 0);
                            await db.inventario.update(inv.id, {
                                cantidad: newQty,
                                valorTotal: newTotal
                            });
                        }
                    }
                }

                // Deuda de cliente
                if (nuevaVenta.debe > 0) {
                    const cliObj = await db.clientes.where('nombre').equalsIgnoreCase(clientName).first();
                    if (cliObj) {
                        await db.clientes.update(cliObj.id, {
                            debe: (parseFloat(cliObj.debe) || 0) + nuevaVenta.debe
                        });
                    } else {
                        await db.clientes.add({ nombre: clientName, celular: '', debe: nuevaVenta.debe });
                    }
                } else {
                    const cliObj = await db.clientes.where('nombre').equalsIgnoreCase(clientName).first();
                    if (!cliObj) {
                        await db.clientes.add({ nombre: clientName, celular: '', debe: 0 });
                    }
                }

                alert("¡Venta Registrada Exitosamente!");

                // Reset
                this.carrito = [];
                this.clienteId = '';
                this.clienteStr = '';
                this.valorPagado = 0;
                this.comentarios = '';
                await this.loadFormData();

                // Close Modal
                Alpine.store('app').closeModal();

            } catch (e) {
                console.error(e);
                alert("Error al registrar venta. Revisa la consola.");
            }
        }
    }));
});
