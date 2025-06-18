#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Папки с отсортированными issues
const ACCEPTED_DIR = path.join(__dirname, 'accepted');
const BLOCKED_DIR = path.join(__dirname, 'blocked');

// Функция для выполнения команды с обработкой ошибок
function runCommand(command, errorMessage) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    console.error(`❌ ${errorMessage}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Функция для получения номера issue из имени файла
function getIssueNumber(filename) {
  const match = filename.match(/issue-(\d+)\.json$/);
  return match ? match[1] : null;
}

// Функция для закрытия issue
function closeIssue(issueNumber, reason) {
  const reasonFlag = reason === 'completed' ? '--reason completed' : '--reason \"not planned\"';
  
  try {
    console.log(`  Закрываю issue #${issueNumber} как ${reason}...`);
    execSync(`gh issue close ${issueNumber} ${reasonFlag}`, { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    });
    console.log(`  ✅ Issue #${issueNumber} закрыт`);
    return true;
  } catch (error) {
    console.error(`  ❌ Не удалось закрыть issue #${issueNumber}: ${error.message}`);
    return false;
  }
}

// Функция для обработки issues в папке
function processIssuesInFolder(folderPath, reason) {
  if (!fs.existsSync(folderPath)) {
    console.log(`📁 Папка ${path.basename(folderPath)} не найдена, пропускаю...`);
    return { processed: 0, failed: 0 };
  }

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log(`📁 Папка ${path.basename(folderPath)} пуста`);
    return { processed: 0, failed: 0 };
  }

  console.log(`\n📁 Обрабатываю папку ${path.basename(folderPath)} (${files.length} issues):`);
  
  let processed = 0;
  let failed = 0;

  for (const file of files) {
    const issueNumber = getIssueNumber(file);
    if (issueNumber) {
      if (closeIssue(issueNumber, reason)) {
        processed++;
      } else {
        failed++;
      }
    } else {
      console.log(`  ⚠️  Пропускаю файл ${file} - не могу определить номер issue`);
    }
  }

  return { processed, failed };
}

// Главная функция
async function main() {
  console.log('🚀 Начинаю закрытие отсортированных issues...\n');

  // Проверяем, что мы в git репозитории
  try {
    runCommand('git rev-parse --git-dir', 'Не найден git репозиторий');
  } catch (error) {
    console.error('❌ Этот скрипт должен быть запущен из git репозитория');
    process.exit(1);
  }

  // Проверяем, что gh установлен и авторизован
  try {
    runCommand('gh auth status', 'GitHub CLI не установлен или не авторизован');
  } catch (error) {
    console.error('❌ Установите GitHub CLI: https://cli.github.com/');
    console.error('❌ Затем авторизуйтесь: gh auth login');
    process.exit(1);
  }

  // Получаем информацию о репозитории
  let repoInfo;
  try {
    const repoJson = runCommand('gh repo view --json nameWithOwner', 'Не удалось получить информацию о репозитории');
    repoInfo = JSON.parse(repoJson);
    console.log(`📍 Репозиторий: ${repoInfo.nameWithOwner}`);
  } catch (error) {
    console.error('❌ Не удалось определить GitHub репозиторий');
    process.exit(1);
  }

  // Обрабатываем accepted issues
  const acceptedStats = processIssuesInFolder(ACCEPTED_DIR, 'completed');
  
  // Обрабатываем blocked issues
  const blockedStats = processIssuesInFolder(BLOCKED_DIR, 'not planned');

  // Итоговая статистика
  console.log('\n📊 Итоговая статистика:');
  console.log(`   Закрыто как completed: ${acceptedStats.processed}`);
  console.log(`   Закрыто как not planned: ${blockedStats.processed}`);
  
  const totalFailed = acceptedStats.failed + blockedStats.failed;
  if (totalFailed > 0) {
    console.log(`   ❌ Не удалось закрыть: ${totalFailed}`);
  }

  console.log('\n✨ Готово!');
}

// Запускаем скрипт
main().catch(error => {
  console.error('❌ Неожиданная ошибка:', error);
  process.exit(1);
});