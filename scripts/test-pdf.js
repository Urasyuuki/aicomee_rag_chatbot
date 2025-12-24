const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Create a dummy PDF buffer or use a real one if available
// For simplicity, we just test if the module loads. 
// If we had a test PDF, we could parse it.

console.log('pdf-parse loaded successfully');
console.log('Type of pdf:', typeof pdf);
console.log('Export:', pdf);


try {
    // Basic API check
    if (typeof pdf !== 'function') {
        throw new Error('pdf-parse export is not a function');
    }
    console.log('pdf-parse export is correct');
} catch (e) {
    console.error(e);
    process.exit(1);
}
