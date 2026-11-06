import {generateC} from './legacy-generate.js';

export function validate(program) {
  if(program?.version!==1 || !Array.isArray(program.body))throw Error('作品の形式が違います。');
  const procs=program.procedures??[];
  if(!Array.isArray(procs)||procs.length>32)throw Error('マイブロックは32個までです。');
  const names=new Set();
  for(const p of procs){if(typeof p.name!=='string'||!p.name.trim()||p.name.length>64||names.has(p.name)||!Array.isArray(p.body))throw Error('マイブロックの名前・定義を確認してください。');names.add(p.name);}
  let count=0;
  const visit=(body,depth=0)=>{if(!Array.isArray(body)||depth>20)throw Error('入れ子が深すぎます。');for(const b of body){if(!b||++count>500)throw Error('ブロックは500個までです。');if(b.type==='call'){if(!names.has(b.name))throw Error('マイブロックが未定義です: '+b.name);}else if(!['wait','motor','image','repeat','forever','ifDistance'].includes(b.type))throw Error('未対応の命令です: '+b.type);if(b.body)visit(b.body,depth+1);if(b.then)visit(b.then,depth+1);if(b.else)visit(b.else,depth+1);}};
  visit(program.body);procs.forEach(p=>visit(p.body));
  const checkPorts=body=>{for(const b of body){if((b.type==='motor'||b.type==='ifDistance')&&b.port==='F')throw Error('ポートFは公式SPIKE-RT v0.2.0ではデバッグ用です。A〜Eを選んでください。');for(const k of ['body','then','else'])if(b[k])checkPorts(b[k]);}};
  checkPorts(program.body);procs.forEach(p=>checkPorts(p.body));
  const seen=new Set(),active=new Set();
  const refs=body=>body.flatMap(b=>[...(b.type==='call'?[b.name]:[]),...refs(b.body??[]),...refs(b.then??[]),...refs(b.else??[])]);
  const graph=new Map(procs.map(p=>[p.name,refs(p.body)]));
  const dfs=n=>{if(active.has(n))throw Error('再帰呼び出しには対応していません。');if(seen.has(n))return;active.add(n);graph.get(n).forEach(dfs);active.delete(n);seen.add(n);};
  names.forEach(dfs);
  // The original basic generator validates ranges and conflicting port assignments.
  const flatten=body=>body.flatMap(b=>b.type==='call'?flatten(procs.find(p=>p.name===b.name).body):[{...b,...(b.body?{body:flatten(b.body)}:{}),...(b.then?{then:flatten(b.then),else:flatten(b.else??[])}:{})}]);
  let expanded=0;
  const bounded=body=>{for(const b of body){if(++expanded>500)throw Error('展開後の命令が500個を超えます。');bounded(b.body??[]);bounded(b.then??[]);bounded(b.else??[]);}};
  // Check expansion size before expansion to avoid unbounded repeated-call allocation.
  const cost=(body,budget=500)=>{let n=0;for(const b of body){n+=1;if(b.type==='call')n+=cost(procs.find(p=>p.name===b.name).body,budget-n);for(const key of ['body','then','else'])if(b[key])n+=cost(b[key],budget-n);if(n>budget)throw Error('展開後の命令が500個を超えます。');}return n;};
  cost(program.body);for(const p of procs)cost(p.body);
  const all=flatten([...program.body,...procs.flatMap(p=>p.body)]);bounded(all);
  // Keep an empty program invalid; definitions alone do not run.
  if(!program.body.length)throw Error('スタートにブロックをつないでください。');
  const baseline=generateC({version:1,body:all});
  return {baseline,procs};
}

export function generateProject(program,cdl){
 const {baseline,procs}=validate(program);
 const split=baseline.indexOf('void main_task(intptr_t exinf) {');
 const ready='    if (!await_start()) goto cleanup;';
 const readyAt=baseline.indexOf(ready,split)+ready.length;
 if(split<0||readyAt<ready.length)throw Error('生成テンプレートが一致しません。');
 const header=`#pragma once\n#include <kernel.h>\n#include <stdint.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <spike/hub/display.h>\n#include <spike/pup/motor.h>\n#include <spike/pup/ultrasonicsensor.h>\nbool keep_running(void);\nbool wait_ms(uint32_t ms);\nbool check_error(pbio_error_t err);\nvoid stop_all(void);\nbool sbl_initialize(void);\nbool await_start(void);\n`;
 let runtime=baseline.slice(0,split).replace('#include "app.h"','#include "app.h"\n#include "sbl_rt_runtime.h"');
 // A single object owns state. Expose functions and used devices through extern declarations.
 let externs='';
 runtime=runtime.replace(/^static (pup_motor_t|pup_device_t) \*(\w+);$/gm,(_,type,name)=>{externs+=`extern ${type} *${name};\n`;return `${type} *${name};`;});
 let nearDecl='';
 runtime=runtime.replace(/^static (bool|void) (\w+)\(/gm,(_,type,name)=>{if(name.startsWith('near_'))nearDecl+=`bool ${name}(int32_t limit_mm);\n`;return `${type} ${name}(`;});
 const init=baseline.slice(split,readyAt).split('\n').slice(2).join('\n').replace(ready,'').replaceAll('goto cleanup;','return false;');
 runtime+='\nbool sbl_initialize(void) {\n'+init+'\n    return true;\n}\n';
 let serial=0;
 const ids=new Map(procs.map((p,i)=>[p.name,'sbl_proc_'+i]));
 function seq(body,level=1){let text='';const emit=s=>text+='    '.repeat(level)+s+'\n';for(const b of body){emit('if (!keep_running()) return false;');if(b.id)emit('/* block: '+String(b.id).replace(/[^a-zA-Z0-9_-]/g,'')+' */');switch(b.type){
 case 'wait':emit(`if (!wait_ms(${Math.round(b.seconds*1000)}U)) return false;`);break;
 case 'motor':emit(`if (!check_error(pup_motor_set_speed(motor_${b.port}, ${b.speed}))) return false;`);emit(`if (!wait_ms(${Math.round(b.seconds*1000)}U)) return false;`);emit(`if (!check_error(pup_motor_brake(motor_${b.port}))) return false;`);break;
 case 'image':{const images={smile:['00000','01010','00000','10001','01110'],heart:['01010','11111','11111','01110','00100'],arrow:['00100','01110','11111','00100','00100'],clear:['00000','00000','00000','00000','00000']};emit('{ uint8_t pixels[25] = {'+images[b.image].join('').split('').map(x=>x==='1'?100:0).join(',')+'};');emit('  if (!check_error(hub_display_image(pixels))) return false; }');break;}
 case 'call':emit(`if (!${ids.get(b.name)}()) return false;`);break;
 case 'repeat':{const id=serial++;emit(`for (int repeat_${id}=0; repeat_${id}<${b.count}; ++repeat_${id}) {`);text+=seq(b.body,level+1);emit('    if (!wait_ms(10)) return false;');emit('}');break;}
 case 'forever':emit('while (keep_running()) {');text+=seq(b.body,level+1);emit('    if (!wait_ms(10)) return false;');emit('}');emit('return false;');break;
 case 'ifDistance':emit(`if (near_${b.port}(${Math.round(b.cm*10)})) {`);text+=seq(b.then,level+1);emit('} else {');text+=seq(b.else??[],level+1);emit('}');break;
 default:throw Error('未対応の命令です。');}}return text;}
 const procHeader='#pragma once\n#include <stdbool.h>\nbool sbl_program(void);\n'+[...ids.values()].map(id=>`bool ${id}(void);`).join('\n')+'\n';
 const myblocks='#include "sbl_myblocks.h"\n#include "sbl_rt_runtime.h"\n'+procs.map(p=>`\n/* My Block ${JSON.stringify(p.name).replaceAll('*/','* /')} */\nbool ${ids.get(p.name)}(void) {\n${seq(p.body)}    return true;\n}\n`).join('')+`\nbool sbl_program(void) {\n${seq(program.body)}    return true;\n}\n`;
 const app=`/* SBL-RT Windows 0.1.1 / SPIKE-RT v0.2.0. Hardware verification pending. */\n#include "app.h"\n#include "sbl_rt_runtime.h"\n#include "sbl_myblocks.h"\n#include <t_syslog.h>\nvoid main_task(intptr_t exinf) {\n    (void)exinf;\n    bool success = false;\n    if (!sbl_initialize()) goto cleanup;\n    syslog(LOG_NOTICE, "READY: press and release center button");\n    if (!await_start()) goto cleanup;\n    success = sbl_program();\ncleanup:\n    stop_all();\n    syslog(LOG_NOTICE, success ? "DONE" : "STOPPED / ERROR");\n    ext_tsk();\n}\n`;
 if(typeof cdl!=='string'||!cdl.includes('kernel.cdl'))throw Error('構成テンプレートがありません。');
 return {'app.c':app,'sbl_myblocks.c':myblocks,'sbl_rt_runtime.c':runtime,'sbl_myblocks.h':procHeader,'sbl_rt_runtime.h':header+externs+nearDecl,
 'app.h':'#pragma once\n#include <kernel.h>\n#define MAIN_PRIORITY 5\n#define MAIN_STACK_SIZE 8192\n#ifndef TOPPERS_MACRO_ONLY\nextern void main_task(intptr_t exinf);\n#endif\n',
 'app.cfg':'INCLUDE("tecsgen.cfg");\n#include "app.h"\nCRE_TSK(APP_MAIN_TASK, { TA_ACT, 0, main_task, MAIN_PRIORITY, MAIN_STACK_SIZE, NULL });\n',
 'app.cdl':cdl,'Makefile.inc':'APPL_COBJS += sbl_myblocks.o sbl_rt_runtime.o\n',
 'program.json':JSON.stringify(program,null,2)+'\n','target.json':JSON.stringify({generator:'SBL-RT Windows',version:'0.1.1',target:'SPIKE-RT',ref:'v0.2.0',hardwareTested:false},null,2)+'\n'};
}
