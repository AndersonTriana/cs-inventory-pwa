// Inicialización de base de datos local con Dexie.js
const db = new Dexie('csInventory');

// Definición del esquema (mapeo directo a Excel)
// ++id es auto-incremental. Los siguientes campos son indexados (búsqueda rápida)
db.version(1).stores({
    productos: '++id, nombre',
    clientes: '++id, nombre, celular, debe',
    proveedores: '++id, nombre, celular, url, etiquetas',
    inventario: '++id, nombre, cantidad, valorVenta, valorTotal',
    compras: '++id, numero, proveedor, valor, fechaPedido, fechaLlegada, descripcion, comentarios, factura',
    productosComprados: '++id, compraId, nombre, cantidad, valorUnitario, valorTotal',
    ventas: '++id, producto, cliente, cantidad, valorPagado, valorVenta, valorTotal, debe, comentarios, fecha',
    defectuosos: '++id, compra, producto, cantidad, valorUnitario, valorTotal'
});

// Helper functions for database transactions
db.on('populate', async () => {
    console.log("Inicializando la base de datos con datos semilla...");
    try {
        const response = await fetch('assets/seed.json');
        if (!response.ok) throw new Error("No se pudo cargar seed.json");

        const data = await response.json();

        for (const tableName of Object.keys(data)) {
            if (db[tableName] && data[tableName].length > 0) {
                await db[tableName].bulkAdd(data[tableName]);
            }
        }
        console.log("Datos semilla cargados correctamente.");
    } catch (err) {
        console.error("Error cargando seed.json:", err);
    }
});

window.db = db;
