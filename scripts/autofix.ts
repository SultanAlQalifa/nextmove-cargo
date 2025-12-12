import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function autoFix() {
    console.log('🔧 Starting FX-7 Repair Protocol (Auto-Fix)...\n');

    // 1. Fix ESLint issues
    console.log('📝 Fixing ESLint issues...');
    try {
        await execAsync('npx eslint . --ext .ts,.tsx --fix');
        console.log('✅ ESLint fix complete');
    } catch (e) {
        console.log('⚠️ ESLint fix warnings (check manual logs)');
    }

    // 2. Fix Prettier formatting
    console.log('💅 Fixing formatting (Prettier)...');
    try {
        await execAsync('npx prettier --write "src/**/*.{ts,tsx,js,jsx,css,md}"');
        console.log('✅ Formatting complete');
    } catch (e) {
        console.log('⚠️ Prettier encountered issues');
    }

    // 3. Remove unused imports (if tool available)
    // console.log('🗑️  Removing unused imports...');
    // await execAsync('npx ts-unused-exports tsconfig.json --excludePathsFromReport=src/main.tsx');

    // 4. Run TypeScript Check
    console.log('🔍 Verifying TypeScript health...');
    try {
        await execAsync('npx tsc --noEmit');
        console.log('✅ TypeScript is CLEAN. No errors.');
    } catch (error) {
        console.log('❌ TypeScript errors remain. Manual intervention required.');
    }

    console.log('\n✨ Auto-fix protocol complete!');
}

autoFix().catch(console.error);
