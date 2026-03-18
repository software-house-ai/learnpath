const { execSync } = require('child_process');
const fs = require('fs');
try {
  const result = execSync('npx eslint app components lib', { encoding: 'utf8' });
  fs.writeFileSync('eslint-report.txt', result);
  console.log('Linting passed');
} catch (err) {
  fs.writeFileSync('eslint-report.txt', err.stdout);
  console.log('Linting failed. Report saved.');
}
