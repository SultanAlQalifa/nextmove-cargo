const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processTailwindClasses(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Grid anti-patterns: grid-cols-[2-6] without responsive prefix
    content = content.replace(/(?<![a-z0-9-]:)\bgrid-cols-([2-6])\b/g, (match, p1) => {
        return `grid-cols-1 md:grid-cols-${p1}`;
    });

    // 2. Fixed widths that break mobile: w-96, w-[...px]
    content = content.replace(/\bw-96\b/g, 'w-full max-w-sm');
    content = content.replace(/\bw-\[([0-9]{3,}px)\]\b/g, (match, p1) => {
        return `w-full max-w-[${p1}]`;
    });

    // 3. Inputs with text-xs or text-sm -> text-base md:text-sm
    content = content.replace(/<input([^>]+?)className=["']([^"']*)["']/gi, (match, beforeAttrs, classList) => {
        let newClassList = classList
            .replace(/\btext-sm\b/g, 'text-base md:text-sm')
            .replace(/\btext-xs\b/g, 'text-base md:text-sm');
        // Ensure text-base if none exists
        if (!newClassList.includes('text-base') && !newClassList.includes('text-lg') && !newClassList.includes('text-xl')) {
            newClassList += ' text-base';
        }
        return `<input${beforeAttrs}className="${newClassList}"`;
    });

    content = content.replace(/<select([^>]+?)className=["']([^"']*)["']/gi, (match, beforeAttrs, classList) => {
        let newClassList = classList
            .replace(/\btext-sm\b/g, 'text-base md:text-sm')
            .replace(/\btext-xs\b/g, 'text-base md:text-sm');
        if (!newClassList.includes('text-base') && !newClassList.includes('text-lg') && !newClassList.includes('text-xl')) {
            newClassList += ' text-base';
        }
        return `<select${beforeAttrs}className="${newClassList}"`;
    });

    // 4. Buttons missing min-height for touch targets (44px min in iOS)
    content = content.replace(/<button([^>]+?)className=["']([^"']*)["']/gi, (match, beforeAttrs, classList) => {
        // Avoid small icon buttons or pagination buttons that are intentionally small
        if (!classList.includes('min-h-') && !classList.includes('w-8') && !classList.includes('h-8') && !classList.includes('w-6') && !classList.includes('h-6') && !classList.includes('text-[10px]')) {
            return `<button${beforeAttrs}className="${classList} min-h-[44px]"`;
        }
        return match;
    });

    // 5. Tables missing overflow-x-auto wrapper (Simple heuristic: wrap naked <table>)
    // Hard to do with regex without breaking JSX. We will instead look for <div className="overflow-hidden"> tables
    // and add overflow-x-auto.
    content = content.replace(/className=["']([^"']*)overflow-hidden([^"']*)["']([^>]*>\s*<table)/g, 'className="$1overflow-x-auto overflow-hidden$2"$3');

    // 6. Modals without max-h-screen overflow-y-auto. Usually these have "fixed inset-0" and a child div "bg-white rounded...".
    // Looking for common modal container classes:
    content = content.replace(/className=["']([^"']*)bg-white rounded-2xl w-full max-w-([^"']*)["']/g, (match, before, maxW) => {
        let classList = `${before}bg-white rounded-2xl w-full max-w-${maxW}`;
        if (!classList.includes('max-h-')) {
            classList += ' max-h-[90vh] overflow-y-auto';
        }
        return `className="${classList}"`;
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

console.log('Starting Mobile UX Audit Code fixes...');
walkDir('./src/components', processTailwindClasses);
walkDir('./src/pages', processTailwindClasses);
console.log('Mobile UX Audit Code fixes completed.');
