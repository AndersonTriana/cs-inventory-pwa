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

window.db = db;
