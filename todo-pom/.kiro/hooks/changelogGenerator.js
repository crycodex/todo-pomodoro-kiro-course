/**
 * Changelog Generator Hook
 * Runs on PostFileSave for .ts and .vue files
 * Updates docs/CHANGELOG.md with the changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.log('No file path provided. Skipping changelog generation.');
  process.exit(0);
}

// Extract relevant information from the file
function extractFileInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  const ext = path.extname(filePath);
  
  const changes = [];
  
  // Detect Vue component changes
  if (ext === '.vue') {
    if (content.includes('defineProps')) {
      changes.push('New component props defined');
    }
    if (content.includes('defineEmits')) {
      changes.push('New component emits defined');
    }
    if (content.includes('import { onMounted') || content.includes('onMounted')) {
      changes.push('Lifecycle hooks added');
    }
  }
  
  // Detect TypeScript changes
  if (ext === '.ts') {
    if (content.includes('export function') || content.includes('export const')) {
      changes.push('New function or constant exported');
    }
    if (content.includes('interface') || content.includes('type')) {
      changes.push('New types defined');
    }
    if (content.includes('Pinia') || content.includes('defineStore')) {
      changes.push('Store logic added/modified');
    }
  }
  
  // Detect major changes
  if (content.includes('import') || content.includes('export')) {
    changes.push('Dependencies modified');
  }
  if (content.includes('ref(') || content.includes('reactive(')) {
    changes.push('Reactive state added');
  }
  
  return {
    filename,
    path: filePath.replace('/Volumes/Second Memory/dev/web/vue/todo-pomodoro/todo-pom/', ''),
    changes,
    timestamp: new Date().toISOString()
  };
}

// Generate changelog entry
function generateChangelogEntry(fileInfo) {
  const date = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let entry = `## [${date}] ${fileInfo.path}\n\n`;
  
  if (fileInfo.changes.length > 0) {
    entry += '### Cambios detectados:\n\n';
    fileInfo.changes.forEach(change => {
      entry += `- ${change}\n`;
    });
  } else {
    entry += '### Modificación de archivo\n\n';
    entry += `- Archivo modificado sin cambios funcionales evidentes\n`;
  }
  
  entry += '\n---\n';
  
  return entry;
}

// Update CHANGELOG.md
function updateChangelog(entry, fileInfo) {
  const changelogPath = path.join(__dirname, '../../docs/CHANGELOG.md');
  
  // Read existing changelog or create new one
  let changelogContent = '';
  if (fs.existsSync(changelogPath)) {
    changelogContent = fs.readFileSync(changelogPath, 'utf-8');
  }
  
  // Prepend new entry
  const updatedChangelog = entry + '\n' + changelogContent;
  
  // Write back
  fs.writeFileSync(changelogPath, updatedChangelog);
  
  console.log(`✅ Changelog entry added for ${fileInfo.path}`);
  console.log(`📄 Changelog saved to docs/CHANGELOG.md`);
}

try {
  const fileInfo = extractFileInfo(filePath);
  const entry = generateChangelogEntry(fileInfo);
  
  if (fileInfo.changes.length > 0 || fileInfo.path.includes('src')) {
    updateChangelog(entry, fileInfo);
  } else {
    console.log('No significant changes detected. Skipping changelog update.');
  }
} catch (error) {
  console.error('Error generating changelog:', error.message);
  process.exit(1);
}
