// Funciones de utilidad global

const helpers = {
    /**
     * Formatea un número como moneda colombiana
     */
    formatCurrency: (value) => {
        if (value === undefined || value === null || isNaN(value)) return "$ 0";
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    },

    /**
     * Formatea un timestamp o ISO string a YYYY-MM-DD
     */
    formatDate: (dateVal) => {
        if (!dateVal) return '';
        try {
            const d = new Date(dateVal);
            // Validar si es fecha inválida
            if (isNaN(d.getTime())) return dateVal;
            return d.toISOString().split('T')[0];
        } catch (e) {
            return dateVal;
        }
    },

    /**
     * Formatea un timestamp O ISO a fecha local leíble (ej: 21 feb 2026)
     */
    formatDateLocal: (dateVal) => {
        if (!dateVal) return '';
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return dateVal;
            return new Intl.DateTimeFormat('es-CO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(d);
        } catch (e) {
            return dateVal;
        }
    },

    /**
     * Convierte fecha Excel serial a Date obj
     */
    excelDateToJSDate: (serial) => {
        if (!serial || isNaN(serial)) return null;
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
    },

    /**
     * Genera un string de ID único
     */
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    },

    /**
     * Limpia string de número y retorna int
     */
    parseCurrency: (str) => {
        if (typeof str === 'number') return str;
        if (!str) return 0;
        const cleaned = str.toString().replace(/[^0-9-]/g, '');
        return parseInt(cleaned, 10) || 0;
    }
};

// Export to global scope for Alpine.js
window.helpers = helpers;
