import {ADVANCED_RUNTIME,RUNTIME_DECLARATIONS} from './advanced-runtime.js';
const OPS=['add','sub','mul','div','pow','mod','min','max','lt','lte','gt','gte','eq','neq'];
const MATH=['abs','floor','ceil','sqrt','sin','cos','tan','asin','acos','atan','ln','log','exp','pow10','neg','not','round'];
const SENSORS=['encoder','motor_velocity','distance','distance_valid','reflection','ambient','force','pressed','button','timer','battery_voltage'];
const COLORS=['RED','YELLOW','GREEN','BLUE','WHITE','MAGENTA'];
export function validateAdvanced(p){
 if(p?.version!==2||!Array.isArray(p.body)||!p.body.length||!Array.isArray(p.procedures??[]))throw Error('スタートにブロックをつないでください。');
 const procs=p.procedures??[],names=new Set(),devices=new Map(),variables=new Map();let nodes=0,expressions=0;
 if(procs.length>32)throw Error('マイブロックは32個までです。');
 for(const q of procs){if(typeof q.name!=='string'||!q.name.trim()||q.name.length>64||names.has(q.name))throw Error('マイブロック名が不正または重複しています。');names.add(q.name);}
 const device=(port,kind)=>{if(typeof port!=='string'||port.length!==1||!'ABCDE'.includes(port))throw Error('ポートFはデバッグ用です。ポートはA〜Eのみ選べます。');if(devices.has(port)&&devices.get(port)!==kind)throw Error('同じポートに異なる機器が指定されています: '+port);devices.set(port,kind);};
 const ports=(s,all=false)=>{if(all&&s==='ALL')return 0;if(typeof s!=='string')throw Error('モーターポートを確認してください。');const a=s.split(',');if(a.length>2||new Set(a).size!==a.length)throw Error('異なるモーターポートを選んでください。');for(const x of a)device(x,'motor');return a.reduce((m,x)=>m|(1<<'ABCDE'.indexOf(x)),0);};
 const variable=n=>{if(typeof n!=='string'||!n||n.length>80)throw Error('変数名を確認してください。');if(!variables.has(n))variables.set(n,variables.size);if(variables.size>32)throw Error('数値変数は32個までです。');};
 const edges=new Map([['$main',new Set()],...procs.map(q=>[q.name,new Set()])]);
 function call(n,owner,d){if(!names.has(n.name))throw Error('マイブロックが未定義です: '+n.name);if(!Array.isArray(n.args??[])||(n.args??[]).length>2)throw Error('引数は２個までです。');edges.get(owner).add(n.name);for(const a of n.args??[])expr(a,owner,d+1);}
 function expr(x,owner,d=0){if(++expressions>4000||d>24)throw Error('式が多すぎるか入れ子が深すぎます。');if(typeof x==='number'){if(!Number.isFinite(x))throw Error('有限の数値を使ってください。');return;}if(!x||typeof x!=='object')throw Error('式の形式が不正です。');switch(x.kind){
 case 'var':variable(x.name);break;case 'param':if(owner==='$main'||![0,1].includes(x.index))throw Error('引数はマイブロック内で使ってください。');break;
 case 'op':if(![...OPS,'and','or'].includes(x.op))throw Error('未対応の演算です。');expr(x.a,owner,d+1);expr(x.b,owner,d+1);break;
 case 'math':if(!MATH.includes(x.fn))throw Error('未対応の数学関数です。');expr(x.value,owner,d+1);break;
 case 'clamp':for(const k of ['value','low','high'])expr(x[k],owner,d+1);break;case 'call':call(x,owner,d);break;
 case 'sensor':if(!SENSORS.includes(x.sensor))throw Error('未対応のセンサーです。');if(x.sensor==='button'){if(!['LEFT','RIGHT'].includes(x.button))throw Error('ボタンを確認してください。');}else if(!['timer','battery_voltage'].includes(x.sensor))device(x.port,['encoder','motor_velocity'].includes(x.sensor)?'motor':['distance','distance_valid'].includes(x.sensor)?'distance':['force','pressed'].includes(x.sensor)?'force':'color');break;
 default:throw Error('未対応の式です。');}}
 function body(a,owner,d=0){if(!Array.isArray(a)||d>20)throw Error('処理の入れ子は20段までです。');for(const n of a){if(!n||++nodes>500)throw Error('命令は500個までです。');const e=k=>expr(n[k],owner),num=(v,lo,hi)=>{if(!Number.isFinite(v)||v<lo||v>hi)throw Error('定数が範囲外です。');};switch(n.type){
 case 'wait':e('seconds');if(typeof n.seconds==='number')num(n.seconds,0,3600);break;
 case 'motor':device(n.port,'motor');num(n.speed,-360,360);num(n.seconds,.1,30);if(!n.speed)throw Error('速度0では回せません。');break;
 case 'motorCommand':ports(n.ports);if(!['run','angle','rotation','time'].includes(n.action))throw Error('モーター動作が不正です。');e('speed');e('amount');break;
 case 'motorStop':ports(n.ports,true);if(!['BRAKE','COAST','HOLD'].includes(n.mode))throw Error('停止方法が不正です。');break;
 case 'motorPower':device(n.port,'motor');e('value');break;case 'encoderReset':device(n.port,'motor');break;
 case 'set':case 'change':variable(n.name);e('value');break;case 'repeat':e('count');body(n.body,owner,d+1);break;case 'forever':body(n.body,owner,d+1);break;
 case 'while':e('condition');body(n.body,owner,d+1);break;case 'waitUntil':e('condition');break;
 case 'if':e('condition');body(n.then,owner,d+1);body(n.else??[],owner,d+1);break;
 case 'ifDistance':device(n.port,'distance');num(n.cm,4,200);body(n.then,owner,d+1);body(n.else??[],owner,d+1);break;
 case 'call':call(n,owner,0);break;case 'return':if(owner==='$main')throw Error('戻り値はマイブロック内だけで使えます。');e('value');break;
 case 'image':if(!['smile','heart','arrow','clear'].includes(n.image))throw Error('画像を確認してください。');break;
 case 'displayNumber':e('value');break;case 'pixel':e('x');e('y');e('value');break;
 case 'displayText':if(typeof n.text!=='string'||n.text.length>120||/[^\x20-\x7e]/.test(n.text))throw Error('文字表示は英数字・記号の定数120文字までです。');break;
 case 'light':if(!COLORS.includes(n.color))throw Error('ランプ色を確認してください。');break;case 'tone':e('hz');e('ms');e('volume');break;
 case 'timerReset':case 'end':case 'displayClear':case 'lightOff':case 'soundStop':break;default:throw Error('未対応の命令です: '+n.type);}}
 }
 body(p.body,'$main');for(const q of procs)body(q.body,q.name);
 const active=new Set();function dfs(n,depth){if(active.has(n))throw Error('再帰呼び出しには対応していません。');if(depth>16)throw Error('呼び出しは16段までです。');active.add(n);for(const t of edges.get(n))dfs(t,depth+1);active.delete(n);}for(const n of edges.keys())dfs(n,0);
 return {procs,devices,variables,ports};
}
export function generateAdvanced(p,cdl,basicGenerate){
 const {procs,devices,variables,ports}=validateAdvanced(p);
 const dummy=[...devices].flatMap(([port,kind])=>kind==='motor'?[{type:'motor',port,speed:90,seconds:.1}]:kind==='distance'?[{type:'ifDistance',port,cm:15,then:[],else:[]}]:[]);
 const files=basicGenerate({version:1,body:dummy.length?dummy:[{type:'image',image:'clear'}],procedures:[]},cdl);
 const ids=new Map(procs.map((q,i)=>[q.name,'sbl_proc_'+i]));let serial=0,lines=[],level=1;
 const emit=s=>lines.push('    '.repeat(level)+s),temp=s=>{const id='sbl_tmp_'+serial++;emit(`double ${id} = ${s};`);return id;};
 function call(n){const args=(n.args??[]).map(expr);while(args.length<2)args.push('0');const out=temp('0');emit(`if (!${ids.get(n.name)}(${args.join(', ')}, &${out})) return false;`);return out;}
 function expr(x){if(typeof x==='number')return String(x);if(x.kind==='var')return temp(`sbl_vars[${variables.get(x.name)}]`);if(x.kind==='param')return 'sbl_arg_'+x.index;if(x.kind==='call')return call(x);
 if(x.kind==='op'){const a=expr(x.a);if(x.op==='and'||x.op==='or'){const out=temp(x.op==='and'?'0':'1');emit(`if (${x.op==='and'?'':'!'}(${a})) {`);level++;const b=expr(x.b);emit(`${out} = (${b}) != 0;`);level--;emit('}');return out;}const b=expr(x.b);return temp(`sbl_operation(${OPS.indexOf(x.op)}, ${a}, ${b})`);}
 if(x.kind==='math')return temp(`sbl_math(${MATH.indexOf(x.fn)}, ${expr(x.value)})`);
 if(x.kind==='clamp'){const a=expr(x.value),lo=expr(x.low),hi=expr(x.high);return temp(`sbl_clamp(${a}, ${lo}, ${hi})`);}
 const kinds={encoder:0,motor_velocity:1,distance:2,distance_valid:3,reflection:4,ambient:5,force:6,pressed:7,button:x.button==='RIGHT'?9:8,timer:10,battery_voltage:11};return temp(`sbl_sensor(${kinds[x.sensor]}, ${x.port?'ABCDE'.indexOf(x.port):0})`);
 }
 const check=s=>emit(`if (!(${s})) return false;`);
 function seq(a){for(const n of a){emit('if (!keep_running()) return false;');if(n.id)emit('/* block: '+String(n.id).replace(/[^a-zA-Z0-9_-]/g,'')+' */');switch(n.type){
 case 'wait':{const v=expr(n.seconds);emit(`if (${v}<0 || ${v}>3600) { (void)sbl_number(NAN); return false; }`);check(`wait_ms((uint32_t)llround(${v}*1000))`);break;}
 case 'motor':check(`sbl_motor_command(${1<<'ABCDE'.indexOf(n.port)}, ${n.speed}/10.5, ${n.seconds}, 1)`);break;
 case 'motorCommand':{const v=expr(n.speed),amount=expr(n.amount);check(`sbl_motor_command(${ports(n.ports)}, ${v}, ${amount}, ${{run:0,time:1,angle:2,rotation:3}[n.action]})`);break;}
 case 'motorStop':check(`sbl_motor_stop(${n.ports==='ALL'?0:ports(n.ports)}, ${['BRAKE','COAST','HOLD'].indexOf(n.mode)})`);break;
 case 'motorPower':check(`sbl_motor_power(${'ABCDE'.indexOf(n.port)}, ${expr(n.value)})`);break;case 'encoderReset':check(`sbl_encoder_reset(${'ABCDE'.indexOf(n.port)})`);break;
 case 'set':case 'change':{const v=expr(n.value),id=variables.get(n.name);emit(`sbl_vars[${id}] = sbl_number(${n.type==='change'?`sbl_vars[${id}] + `:''}${v});`);break;}
 case 'repeat':{const c=expr(n.count),id=serial++;emit(`if (${c}<0 || ${c}>10000) { (void)sbl_number(NAN); return false; }`);emit(`for (int sbl_i_${id}=0, sbl_count_${id}=(int)${c}; sbl_i_${id}<sbl_count_${id}; ++sbl_i_${id}) {`);level++;seq(n.body);check('wait_ms(10)');level--;emit('}');break;}
 case 'while':case 'forever':case 'waitUntil':emit('for (;;) {');level++;if(n.type!=='forever'){const c=expr(n.condition);emit(`if (${n.type==='while'&&!n.until?'!':''}(${c})) break;`);}if(n.body)seq(n.body);check('wait_ms(10)');level--;emit('}');break;
 case 'if':case 'ifDistance':{const c=n.type==='if'?expr(n.condition):`near_${n.port}(${Math.round(n.cm*10)})`;emit(`if (${c}) {`);level++;seq(n.then);level--;emit('} else {');level++;seq(n.else??[]);level--;emit('}');break;}
 case 'call':{const result=call(n);emit('(void)'+result+';');break;}case 'return':{const v=expr(n.value);emit(`*sbl_result = sbl_number(${v});`);emit('return keep_running();');break;}case 'end':emit('sbl_end_program();');emit('return false;');break;
 case 'image':{const images={smile:'0000001010000001000101110',heart:'0101011111111110111000100',arrow:'0010001110111110010000100',clear:'0'.repeat(25)};emit('{ uint8_t pixels[25] = {'+images[n.image].split('').map(x=>x==='1'?100:0).join(',')+'};');check('check_error(hub_display_image(pixels))');emit('}');break;}
 case 'displayClear':check('check_error(hub_display_off())');break;case 'displayNumber':check(`sbl_display_number(${expr(n.value)})`);break;
 case 'pixel':{const x=expr(n.x),y=expr(n.y),v=expr(n.value);check(`sbl_pixel(${x},${y},${v})`);break;}
 case 'displayText':check(`sbl_display_text(${JSON.stringify(n.text)})`);break;case 'timerReset':emit('sbl_timer_reset();');break;
 case 'light':check(`sbl_light(${COLORS.indexOf(n.color)})`);break;case 'lightOff':check('check_error(hub_light_off())');break;
 case 'tone':{const hz=expr(n.hz),ms=expr(n.ms),v=expr(n.volume);check(`sbl_tone(${hz},${ms},${v})`);break;}
 case 'soundStop':emit('sbl_sound_stop();');break;default:throw Error('未対応の命令です。');}}
 }
 let source='#include "sbl_myblocks.h"\n#include "sbl_rt_runtime.h"\n#include <math.h>\n#include <spike/hub/light.h>\n';
 for(const q of procs){lines=[];seq(q.body);source+=`\nbool ${ids.get(q.name)}(double sbl_arg_0,double sbl_arg_1,double *sbl_result) {\n    (void)sbl_arg_0; (void)sbl_arg_1; *sbl_result=0;\n${lines.join('\n')}\n    return keep_running();\n}\n`;}
 lines=[];seq(p.body);source+=`\nbool sbl_program(void) {\n${lines.join('\n')}\n    return keep_running();\n}\n`;
 files['sbl_myblocks.c']=source;files['sbl_myblocks.h']='#pragma once\n#include <stdbool.h>\nbool sbl_program(void);\n'+[...ids.values()].map(id=>`bool ${id}(double,double,double*);`).join('\n')+'\n';files['sbl_rt_runtime.h']+=RUNTIME_DECLARATIONS;
 let runtime=files['sbl_rt_runtime.c'],init='';
 for(const [port,kind]of devices){const i='ABCDE'.indexOf(port);if(kind==='motor')init+=`    sbl_motors[${i}] = motor_${port};\n`;else if(kind==='distance')init+=`    sbl_sensors[${i}] = distance_${port};\n`;else init+=`    sbl_sensors[${i}] = ${kind==='color'?'pup_color_sensor_get_device':'pup_force_sensor_get_device'}(PBIO_PORT_ID_${port});\n    if (!sbl_sensors[${i}]) { failed=true; stop_all(); return false; }\n`;}
 const at=runtime.indexOf('bool sbl_initialize(void)');runtime=runtime.slice(0,at)+ADVANCED_RUNTIME+'\n'+runtime.slice(at);runtime=runtime.replace(/\n    return true;\n}\n$/, '\n'+init+'    return true;\n}\n');
 runtime='#include <stdint.h>\n#include <spike/hub/speaker.h>\n'+runtime.replace('void stop_all(void) {','void stop_all(void) {\n    hub_speaker_stop();');files['sbl_rt_runtime.c']=runtime;
 files['app.c']=files['app.c'].replace('success = sbl_program();','sbl_timer_reset();\n    success = sbl_program();').replace('success ? "DONE"','(success || sbl_end_requested) ? "DONE"').replace('0.1.1','0.2.0');files['Makefile.inc']+='APPL_LIBS += -lm\n';files['program.json']=JSON.stringify(p,null,2)+'\n';files['target.json']=JSON.stringify({generator:'SBL-RT Windows',version:'0.2.0',target:'SPIKE-RT',ref:'v0.2.0',irVersion:2,profile:'A-E',hardwareTested:false},null,2)+'\n';return files;
}
