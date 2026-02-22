const ImportExport = {
    exportToExcel: async () => {
        if (!window.XLSX) return alert("Error: La librería de Excel no ha cargado.");

        try {
            const wb = XLSX.utils.book_new();

            const tables = ['productos', 'clientes', 'proveedores', 'inventario', 'compras', 'productosComprados', 'ventas', 'defectuosos'];
            const sheetNames = ['Productos', 'Clientes', 'Proveedores', 'Inventario', 'Compras', 'Productos Comprados', 'Ventas', 'Productos Defectuosos'];

            for (let i = 0; i < tables.length; i++) {
                const records = await db[tables[i]].toArray();
                // Remove Dexie's internal 'id' before exporting so it matches original format mostly
                const cleanRecords = records.map(r => {
                    const obj = { ...r };
                    delete obj.id;
                    return obj;
                });
                const ws = XLSX.utils.json_to_sheet(cleanRecords);
                XLSX.utils.book_append_sheet(wb, ws, sheetNames[i]);
            }

            // Calculate 'Deben' sheet
            const ventas = await db.ventas.toArray();
            const deudores = ventas.filter(v => helpers.parseCurrency(v.debe) > 0);

            const sumDebe = {};
            for (let v of deudores) {
                const cli = v.cliente || 'Desconocido';
                sumDebe[cli] = (sumDebe[cli] || 0) + helpers.parseCurrency(v.debe);
            }

            const debenRecords = Object.keys(sumDebe).map(c => ({ Cliente: c, Debe: sumDebe[c] }));
            const wsDeben = XLSX.utils.json_to_sheet(debenRecords);
            XLSX.utils.book_append_sheet(wb, wsDeben, "Deben");

            const dateStr = helpers.formatDate(new Date());
            XLSX.writeFile(wb, `CS-Inventario-${dateStr}.xlsx`);
        } catch (e) {
            console.error(e);
            alert("Error exportando a Excel");
        }
    },

    importFromExcel: async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.XLSX) return alert("Error: La librería de Excel no ha cargado.");

        if (!confirm("⚠️ ATENCIÓN: ¿Estás seguro de que quieres SOBREESCRIBIR todos los datos actuales con este backup? Esta acción no se puede deshacer.")) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const tables = ['productos', 'clientes', 'proveedores', 'inventario', 'compras', 'productosComprados', 'ventas', 'defectuosos'];
                const sheetNames = ['Productos', 'Clientes', 'Proveedores', 'Inventario', 'Compras', 'Productos Comprados', 'Ventas', 'Productos Defectuosos'];

                for (let i = 0; i < tables.length; i++) {
                    const sheetName = sheetNames[i];
                    const tableName = tables[i];

                    if (workbook.Sheets[sheetName] && window.db[tableName]) {
                        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

                        await window.db[tableName].clear();
                        if (json.length > 0) {
                            // Dexie bulkAdd will auto-generate keys if they are omitted, 
                            // but if the excel has them, it might depend on schema.
                            // The export removes 'id', so bulkAdd will naturally auto-increment.
                            await window.db[tableName].bulkAdd(json);
                        }
                    }
                }

                alert("Backup restaurado con éxito. La aplicación se recargará para mostrar los cambios.");
                window.location.reload();

            } catch (err) {
                console.error(err);
                alert("Error al importar el archivo: Asegúrate de que es un backup válido.");
            }
            event.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    }
};

window.ImportExport = ImportExport;
