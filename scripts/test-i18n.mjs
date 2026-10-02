import { build } from 'esbuild';
import { mkdir, readFile } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import ts from 'typescript';

const dictionary=JSON.parse(await readFile('src/i18n/zh-CN.json','utf8'));
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort();
for(const [key,value] of Object.entries(dictionary)) {
  assert.ok(value.trim(),`Empty Chinese translation: ${key}`);
  assert.deepEqual(placeholders(value),placeholders(key),`Placeholder mismatch: ${key}`);
}
const exemptions=new Set(['中文','English','D','BB','50BB','200BB',"TEXAS HOLD'EM"]);
let count=0;
for(const dir of ['src/components','src/pages'])for(const file of readdirSync(dir).filter(x=>x.endsWith('.tsx'))) {
  const path=`${dir}/${file}`,source=readFileSync(path,'utf8');
  const tree=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function visit(node) {
    if(ts.isJsxText(node)) {
      const text=node.text.trim();
      assert.ok(!/[a-zA-Z]/.test(text)||exemptions.has(text),`Untranslated visible text in ${path}: ${text}`);
    }
    if(ts.isJsxAttribute(node)&&['title','placeholder','aria-label'].includes(node.name.getText(tree))&&node.initializer&&ts.isStringLiteral(node.initializer)) {
      assert.ok(!/[a-zA-Z]/.test(node.initializer.text),`Untranslated attribute in ${path}: ${node.initializer.text}`);
    }
    if(ts.isCallExpression(node)&&node.expression.getText(tree)==='t'&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0])) {
      assert.ok(dictionary[node.arguments[0].text],`Missing key in ${path}: ${node.arguments[0].text}`);count++;
    }
    if(ts.isCallExpression(node)&&node.expression.getText(tree)==='setError'&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0])&&node.arguments[0].text) {
      assert.ok(dictionary[node.arguments[0].text],`Missing dynamic error translation: ${node.arguments[0].text}`);
    }
    ts.forEachChild(node,visit);
  }
  visit(tree);
}
console.log(`PASS: ${count} literal translation sites, ${Object.keys(dictionary).length} dictionary entries, visible-text/attribute/error coverage and matching placeholders`);
await mkdir('.test-build',{recursive:true});
const common={bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',logLevel:'warning'};
await build({...common,entryPoints:['src/i18n/index.ts'],outfile:'.test-build/locale.mjs'});
await build({...common,entryPoints:['tests/i18n.test.tsx'],outfile:'.test-build/i18n.test.mjs',plugins:[{
  name:'test-only-analytics',setup(build){build.onLoad({filter:/src\/utils\/analytics\.ts$/},()=>({contents:`export const logEvent=()=>{}; export const logPageView=()=>{}; export const initGA=()=>{}; export const CATEGORY={GAME:'Game',NAVIGATION:'Navigation'}; export const ACTION={START_GAME:'Start Game'};`,loader:'ts'}));}
}],banner:{js:`globalThis.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};`}});
const result=spawnSync(process.execPath,['--test','.test-build/i18n.test.mjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
