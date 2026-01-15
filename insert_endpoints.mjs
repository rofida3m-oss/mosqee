import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the index.js file
const indexPath = path.join(__dirname, 'server', 'index.js');
const endpointsPath = path.join(__dirname, 'server', 'lessons_endpoints.js');

let indexContent = fs.readFileSync(indexPath, 'utf8');
const endpointsContent = fs.readFileSync(endpointsPath, 'utf8');

// Find the position to insert (before "// Debug endpoint")
const insertMarker = '// Debug endpoint';
const insertPosition = indexContent.indexOf(insertMarker);

if (insertPosition !== -1) {
    // Insert the endpoints code
    const before = indexContent.substring(0, insertPosition);
    const after = indexContent.substring(insertPosition);

    indexContent = before + '\n' + endpointsContent + '\n' + after;

    // Write back
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log('✅ API endpoints added successfully!');
} else {
    console.error('❌ Could not find insertion point');
}
