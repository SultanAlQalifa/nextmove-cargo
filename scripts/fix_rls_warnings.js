/* global require, __dirname */
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../supabase/migrations');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Use negative lookbehind to ensure we don't wrap things twice
    // e.g. replacing 'auth.uid()' but not '(select auth.uid())' or '(SELECT auth.uid())'

    // auth.uid()
    content = content.replace(/(?<!\(\s*select\s+)(?<!\(\s*SELECT\s+)auth\.uid\(\)/g, '(select auth.uid())');

    // auth.jwt()
    content = content.replace(/(?<!\(\s*select\s+)(?<!\(\s*SELECT\s+)auth\.jwt\(\)/g, '(select auth.jwt())');

    // auth.email()
    content = content.replace(/(?<!\(\s*select\s+)(?<!\(\s*SELECT\s+)auth\.email\(\)/g, '(select auth.email())');

    // auth.role()
    content = content.replace(/(?<!\(\s*select\s+)(?<!\(\s*SELECT\s+)auth\.role\(\)/g, '(select auth.role())');

    // current_setting('request.jwt.claims', true) or similar variants
    content = content.replace(/(?<!\(\s*select\s+)(?<!\(\s*SELECT\s+)(current_setting\('[^']+',\s*(true|false)\))/gi, '(select $1)');
    content = content.replace(/(?<!\(\s*select\s+)(?<!\(\s*SELECT\s+)(current_setting\('[^']+'\))/gi, '(select $1)');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${path.basename(filePath)}`);
    }
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
files.forEach(f => processFile(path.join(migrationsDir, f)));

console.log('Done!');
