#!/usr/bin/env node

/**
 * Script to add theme-admin.css to all admin pages
 */

const fs = require('fs');
const path = require('path');

const THEME_ADMIN_CSS = '<link rel="stylesheet" href="/assets/styles/theme-admin.css">';

function addThemeAdminCSS(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has theme-admin.css
    if (content.includes('theme-admin.css')) {
        console.log(`✓ Skipped (already has theme-admin.css): ${path.basename(filePath)}`);
        return;
    }
    
    // Skip if doesn't have Admin.css
    if (!content.includes('Admin.css')) {
        console.log(`⚠ Skipped (not an admin page): ${path.basename(filePath)}`);
        return;
    }
    
    // Add after Admin.css or Admin_Global.css
    const lines = content.split('\n');
    const newLines = [];
    let added = false;
    
    for (let i = 0; i < lines.length; i++) {
        newLines.push(lines[i]);
        
        // Add after Admin.css or Admin_Global.css
        if (!added && (lines[i].includes('Admin.css') || lines[i].includes('Admin_Global.css'))) {
            // Check if next line is not another admin css
            if (i + 1 < lines.length && !lines[i + 1].includes('Admin')) {
                newLines.push(`    ${THEME_ADMIN_CSS}`);
                added = true;
            }
        }
    }
    
    if (added) {
        fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
        console.log(`✓ Updated: ${path.basename(filePath)}`);
    } else {
        console.log(`⚠ Could not update: ${path.basename(filePath)}`);
    }
}

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.ejs')) {
            try {
                addThemeAdminCSS(filePath);
            } catch (error) {
                console.error(`✗ Error processing ${filePath}:`, error.message);
            }
        }
    }
}

console.log('🎨 Adding theme-admin.css to all admin pages...\n');

const adminDir = path.join(__dirname, '..', 'src', 'features', 'admin');

if (!fs.existsSync(adminDir)) {
    console.error('Error: admin directory not found');
    process.exit(1);
}

processDirectory(adminDir);

console.log('\n✅ Admin theme CSS added successfully!');
