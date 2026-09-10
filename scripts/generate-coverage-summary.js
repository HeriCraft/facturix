const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.log('No coverage summary found at', summaryPath);
  process.exit(0);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const total = summary.total;

let md = `## 📊 Facturix Code Coverage Summary\n\n`;
md += `| Category | Total | Covered | Skipped | Percentage |\n`;
md += `| :--- | :---: | :---: | :---: | :---: |\n`;
md += `| **Statements** | ${total.statements.total} | ${total.statements.covered} | ${total.statements.skipped} | **${total.statements.pct}%** |\n`;
md += `| **Branches** | ${total.branches.total} | ${total.branches.covered} | ${total.branches.skipped} | **${total.branches.pct}%** |\n`;
md += `| **Functions** | ${total.functions.total} | ${total.functions.covered} | ${total.functions.skipped} | **${total.functions.pct}%** |\n`;
md += `| **Lines** | ${total.lines.total} | ${total.lines.covered} | ${total.lines.skipped} | **${total.lines.pct}%** |\n\n`;

md += `### 📁 Per-File Coverage Breakdown\n\n`;
md += `| File / Module | Stmts % | Branch % | Funcs % | Lines % |\n`;
md += `| :--- | :---: | :---: | :---: | :---: |\n`;

const files = Object.keys(summary).filter((k) => k !== 'total');
files.sort();

for (const file of files) {
  const item = summary[file];
  const relative = file.replace(/.*\/src\//, 'src/');
  md += `| \`${relative}\` | ${item.statements.pct}% | ${item.branches.pct}% | ${item.functions.pct}% | ${item.lines.pct}% |\n`;
}

console.log(md);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}
