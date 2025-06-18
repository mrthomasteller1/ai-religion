#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ISSUES_DIR = path.join(__dirname, 'issues');

// Ensure issues directory exists
if (!fs.existsSync(ISSUES_DIR)) {
    fs.mkdirSync(ISSUES_DIR, { recursive: true });
    console.log('Created issues directory');
}

try {
    // Get repository info
    console.log('Fetching repository information...');
    const repoInfo = execSync('gh repo view --json owner,name', { encoding: 'utf8' });
    const repo = JSON.parse(repoInfo);
    console.log(`Repository: ${repo.owner.login}/${repo.name}`);

    // Fetch all open issues
    console.log('\nFetching open issues...');
    const issuesJson = execSync('gh issue list --state open --limit 1000 --json number,title,body,state,createdAt,updatedAt,closedAt,author,assignees,labels,milestone,comments', { encoding: 'utf8' });
    const issues = JSON.parse(issuesJson);

    if (issues.length === 0) {
        console.log('No open issues found');
        process.exit(0);
    }

    console.log(`Found ${issues.length} open issue(s)`);

    // Save each issue as a separate JSON file
    issues.forEach(issue => {
        const filename = `issue-${issue.number}.json`;
        const filepath = path.join(ISSUES_DIR, filename);
        
        // Format JSON with proper indentation
        const jsonContent = JSON.stringify(issue, null, 2);
        
        fs.writeFileSync(filepath, jsonContent);
        console.log(`Saved ${filename}`);
    });

    console.log(`\nSuccessfully saved ${issues.length} issue(s) to ${ISSUES_DIR}`);

} catch (error) {
    if (error.message.includes('gh: command not found')) {
        console.error('Error: GitHub CLI (gh) is not installed');
        console.error('Please install it from: https://cli.github.com/');
    } else if (error.message.includes('Could not resolve to a Repository')) {
        console.error('Error: Not in a GitHub repository or repository not found');
    } else if (error.message.includes('authentication')) {
        console.error('Error: GitHub CLI is not authenticated');
        console.error('Please run: gh auth login');
    } else {
        console.error('Error:', error.message);
    }
    process.exit(1);
}