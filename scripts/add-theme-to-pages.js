#!/usr/bin/env node

/**
 * Script to automatically add theme includes to all EJS files
 * This ensures consistent theme support across all pages
 */

const fs = require('fs');
const path = require('path');

const THEME_INCLUDE = `<%- include('../../shared/views/partials/theme-includes') %>`;
const THEME_INCLUDE_SHARED = `<%- include('partials/theme-includes') %>`;

// Patterns to match the head section
const HEAD_PATTERNS = [
    /<link\s+rel="stylesheet"\s+href="https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap@/i,
    /<link\s+href="https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap@/i,
    /<link\s+rel="stylesheet"\s+href="https:\/\/cdnjs\.cloudflare\.com.*bootstrap/i,
];

/**
 * Check if file already has theme includes
 */
function hasThemeInclude(content) {
    return content.includes('theme-dark.css') || 
           content.includes('theme-manager.js') ||
           content.includes('theme-includes');
}

/**
 * Determine the correct include path based on file location
 */
function getIncludePath(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    if (relativePath.includes('shared\\views') || relativePath.includes('shared/views')) {
        return THEME_INCLUDE_SHARED;
    }
    
    return THEME_INCLUDE;
}

/**
 * Add theme include to EJS file
 */
function addThemeInclude(filePath, content) {
    // Check if already has theme includes
    if (hasThemeInclude(content)) {
        console.log(`✓ Skipped (already has theme): ${path.basename(filePath)}`);
        return null;
    }

    // Check if file has a head section
    if (!content.includes('<head>')) {
        console.log(`⚠ Skipped (no <head> section): ${path.basename(filePath)}`);
        return null;
    }

    const includePath = getIncludePath(filePath);
    let modified = false;
    let newContent = content;

    // Try to insert after Bootstrap CSS link
    for (const pattern of HEAD_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
            const lines = content.split('\n');
            const newLines = [];
            let inserted = false;

            for (let i = 0; i < lines.length; i++) {
                newLines.push(lines[i]);
                
                // Check if this line matches Bootstrap and we haven't inserted yet
                if (!inserted && pattern.test(lines[i])) {
                    newLines.push(`    ${includePath}`);
                    inserted = true;
                    modified = true;
                }
            }

            if (inserted) {
                newContent = newLines.join('\n');
                break;
            }
        }
    }

    // If not inserted yet, try to insert after <head> tag
    if (!modified) {
        newContent = content.replace(
            /(<head>)/i,
            `$1\n    ${includePath}`
        );
        
        if (newContent !== content) {
            modified = true;
        }
    }

    if (modified) {
        console.log(`✓ Updated: ${path.basename(filePath)}`);
        return newContent;
    }

    console.log(`⚠ Could not update: ${path.basename(filePath)}`);
    return null;
}

/**
 * Process all EJS files in a directory recursively
 */
function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules and other unnecessary directories
            if (!file.startsWith('.') && file !== 'node_modules') {
                processDirectory(filePath);
            }
        } else if (file.endsWith('.ejs')) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const newContent = addThemeInclude(filePath, content);

                if (newContent) {
                    fs.writeFileSync(filePath, newContent, 'utf8');
                }
            } catch (error) {
                console.error(`✗ Error processing ${filePath}:`, error.message);
            }
        }
    }
}

// Main execution
console.log('🎨 Adding theme support to all EJS files...\n');

const srcDir = path.join(__dirname, '..', 'src');

if (!fs.existsSync(srcDir)) {
    console.error('Error: src directory not found');
    process.exit(1);
}

processDirectory(srcDir);

console.log('\n✅ Theme includes added successfully!');
console.log('📝 Note: Please review the changes and test all pages.');
