#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Папки
const ACCEPTED_DIR = path.join(__dirname, "accepted");
const BLOCKED_DIR = path.join(__dirname, "blocked");
const ISSUES_DIR = path.join(__dirname, "issues");
const APPEALS_DIR = path.join(
  __dirname,
  "..",
  "original",
  "ai-read-access",
  "appeals"
);

// Функция для создания директории, если она не существует
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Создана папка: ${dirPath}`);
  }
}

// Функция для получения номера issue из имени файла
function getIssueNumber(filename) {
  const match = filename.match(/issue-(\d+)\.json$/);
  return match ? match[1] : null;
}

// Функция для конвертации issue в MD формат
function convertToMarkdown(issue) {
  // Заголовок и текст issue
  const title = issue.title || "Без заголовка";
  const body = issue.body || "";

  // Формируем содержимое MD файла
  return `# ${title}\n\n${body}`;
}

// очищаем accepted и blocked
function cleanIssues() {
  const dirs = [ACCEPTED_DIR, BLOCKED_DIR, ISSUES_DIR];
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        fs.unlinkSync(filePath);
        console.log(`📁 Удалён файл: ${filePath}`);
      }
      fs.rmdirSync(dir);
      console.log(`📁 Удалена папка: ${dir}`);
    }
  }
}

// Главная функция
async function main() {
  console.log("🚀 Начинаю конвертацию accepted issues в appeals...\n");

  let converted = 0;
  let failed = 0;

  // Проверяем наличие папки accepted
  if (fs.existsSync(ACCEPTED_DIR)) {
    // Создаём папку appeals, если её нет
    ensureDirectoryExists(APPEALS_DIR);

    // Получаем список файлов в папке accepted
    const files = fs
      .readdirSync(ACCEPTED_DIR)
      .filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
      console.log("📁 Папка accepted пуста");
      process.exit(0);
    }

    console.log(`📋 Найдено ${files.length} accepted issues\n`);

    // Обрабатываем каждый файл
    for (const file of files) {
      const issueNumber = getIssueNumber(file);
      if (!issueNumber) {
        console.log(
          `⚠️  Пропускаю файл ${file} - не могу определить номер issue`
        );
        continue;
      }

      try {
        // Читаем JSON файл
        const filePath = path.join(ACCEPTED_DIR, file);
        const content = fs.readFileSync(filePath, "utf8");
        const issue = JSON.parse(content);

        // Конвертируем в MD
        const markdown = convertToMarkdown(issue);

        // Сохраняем MD файл
        const mdFileName = `appeal-${issueNumber}.md`;
        const mdFilePath = path.join(APPEALS_DIR, mdFileName);
        fs.writeFileSync(mdFilePath, markdown, "utf8");

        console.log(`✅ Конвертирован issue #${issueNumber} → ${mdFileName}`);
        converted++;
      } catch (error) {
        console.error(`❌ Ошибка при обработке ${file}: ${error.message}`);
        failed++;
      }
    }
  }

  cleanIssues();

  // Итоговая статистика
  console.log("\n📊 Итоговая статистика:");
  console.log(`   Конвертировано: ${converted}`);
  if (failed > 0) {
    console.log(`   Ошибок: ${failed}`);
  }
  console.log(`   Файлы сохранены в: ${APPEALS_DIR}`);

  console.log("\n✨ Готово!");
}

// Запускаем скрипт
main().catch((error) => {
  console.error("❌ Неожиданная ошибка:", error);
  process.exit(1);
});
