const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

const REMOTE_URL = "https://github.com/idrokaiassistant-wq/MasterPrompt.git";
const BRANCH = "main";

console.log(`🚀 Starting Safe Push to ${REMOTE_URL}...`);

// Helper to run commands
function run(command, options = {}) {
    try {
        return execSync(command, { stdio: 'pipe', encoding: 'utf8', ...options }).trim();
    } catch (error) {
        return null;
    }
}

// 1. Check for uncommitted changes
const status = run('git status -s');
if (status) {
    console.log("⚠️  You have uncommitted changes.");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("Do you want to commit them now? (y/n) ", (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y') {
            const rl2 = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl2.question("Enter commit message: ", (msg) => {
                rl2.close();
                try {
                    execSync('git add .', { stdio: 'inherit' });
                    execSync(`git commit -m "${msg}"`, { stdio: 'inherit' });
                    proceedWithPush();
                } catch (e) {
                    console.error("❌ Commit failed.");
                    process.exit(1);
                }
            });
        } else {
            console.log("❌ Push aborted. Please commit or stash your changes.");
            process.exit(1);
        }
    });
} else {
    proceedWithPush();
}

function proceedWithPush() {
    // 2. Validation
    console.log("🔍 Running validation checks...");
    
    console.log("   Running lint...");
    try {
        execSync('pnpm lint', { stdio: 'inherit' });
        console.log("✅ Lint passed.");
    } catch (e) {
        console.error("❌ Lint failed. Please fix errors before pushing.");
        process.exit(1);
    }

    // 3. Push to Remote
    console.log(`📤 Pushing to ${BRANCH}...`);

    // Check remote
    const currentRemote = run('git remote get-url origin');
    if (currentRemote !== REMOTE_URL) {
        console.log("⚠️  Remote URL mismatch. Updating remote...");
        try {
            execSync(`git remote set-url origin ${REMOTE_URL}`, { stdio: 'inherit' });
        } catch (e) {
            console.error("❌ Failed to update remote URL.");
            process.exit(1);
        }
    }

    try {
        execSync(`git push -u origin ${BRANCH}`, { stdio: 'inherit' });
        console.log("✅ Successfully pushed to GitHub!");
    } catch (e) {
        console.error("❌ Push failed. Please check your network connection or credentials.");
        process.exit(1);
    }
}
