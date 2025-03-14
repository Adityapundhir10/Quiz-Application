const fs = require('fs');
const path = require('path');

function listFilesTree(dir, indent = '') {
  // Check if the directory exists
  if (!fs.existsSync(dir)) {
    console.error(`Error: Path "${dir}" does not exist.`);
    return;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const prefix = indent + (isLast ? '└── ' : '├── ');
    console.log(prefix + item.name);

    // Recursively list subdirectories, skipping node_modules
    if (item.isDirectory() && item.name !== 'node_modules') {
      const newIndent = indent + (isLast ? '    ' : '│   ');
      listFilesTree(path.join(dir, item.name), newIndent);
    }
  });
}

// Use __dirname to start from the current script's directory
const projectPath = path.resolve(__dirname);
console.log(projectPath);
listFilesTree(projectPath);
