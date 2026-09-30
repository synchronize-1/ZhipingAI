// 校验 .vue 单文件组件能否通过 Vue SFC 编译（替代沙箱内无法运行的 vite build）
const fs = require('fs');
const path = require('path');
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('用法: node scripts/_check_sfc.cjs <file.vue> [...]');
  process.exit(1);
}

let failed = 0;

for (const file of files) {
  const abs = path.resolve(file);
  const source = fs.readFileSync(abs, 'utf8');
  const id = path.basename(abs);

  try {
    const { descriptor, errors } = parse(source, { filename: abs });
    if (errors.length) throw new Error(errors.map((e) => e.message).join('; '));

    const script = compileScript(descriptor, { id });
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: abs,
      id,
      compilerOptions: { bindingMetadata: script.bindings }
    });
    if (template.errors.length) {
      throw new Error(template.errors.map((e) => e.message || e).join('; '));
    }

    console.log(`✅ ${id}  编译通过`);
  } catch (err) {
    failed++;
    console.error(`❌ ${id}  编译失败: ${err.message}`);
  }
}

process.exit(failed ? 1 : 0);