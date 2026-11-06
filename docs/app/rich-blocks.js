import {setupClassroom,STANDARD_TYPES} from './sbl-reference/classroom-blocks.js';
import {commonToolbox} from './sbl-reference/common-blocks.js?v=0.7.0';
import {setBlockLanguage} from './sbl-reference/blocks.js';
import {supportIssues,IMPLEMENTED_TYPES} from './sbl-support.js';
// SBL-compatible block identifiers, restricted to implemented SPIKE-RT semantics.
import {PORTS} from './model.js';
const defs=[],stmt={previousStatement:null,nextStatement:null,inputsInline:true};
const val=(name,check='Number')=>({type:'input_value',name,check});
const choice=(name,options)=>({type:'field_dropdown',name,options});
const port=()=>choice('PORT',PORTS.map(p=>[p,p]));
const field=(name,text)=>({type:'field_input',name,text});
const add=(type,message0,args0,properties={})=>defs.push({type,message0,...(args0.length?{args0}:{}),...properties});
const pairs=PORTS.flatMap(a=>PORTS.filter(b=>b!==a).map(b=>[a+' + '+b,a+','+b]));
for(const paired of [false,true])for(const action of ['run','angle','rotation','time']){
 const amount={angle:'DEGREES',rotation:'ROTATIONS',time:'SECONDS'}[action];
 add('lab_motor_'+(paired?'pair':'single')+'_'+action,`モーター${paired?'2個':'1個'} %1 を速さ %2 %で `+({run:'回し続ける',angle:'%3 度回す',rotation:'%3 回転させる',time:'%3 秒回す'}[action]),[paired?choice('PORTS',pairs):port(),val('SPEED'),...(amount?[val(amount)]:[])],{...stmt,colour:'#0090f5',tooltip:'速さは-100〜100%。1050度/秒を100%とする指令値です。2個は独立制御で、車体の直進補正はありません。'});
}
add('lab_motor_group_stop','モーター %1 を %2 で停止',[choice('PORTS',[...PORTS.map(p=>[p,p]),...pairs,['使用中のすべて','ALL']]),choice('MODE',[['ブレーキ','BRAKE'],['惰性','COAST'],['保持','HOLD']])],{...stmt,colour:'#0090f5'});
add('lab_motor_power','モーター %1 をパワー %2 %で回す',[port(),val('POWER')],{...stmt,colour:'#0090f5'});
for(const [type,label]of [['encoder','回転角度（度）'],['motor_velocity','実際の速さ（度/秒）']])add('lab_'+type,'モーター %1 の'+label,[port()],{output:'Number',colour:'#34ccf1'});
add('lab_encoder_reset','モーター %1 の回転角度を0にする',[port()],{...stmt,colour:'#34ccf1'});
for(const [type,label,output]of [['distance','距離（cm）','Number'],['distance_valid','距離を検出できている','Boolean'],['reflection','反射光（%）','Number'],['ambient','周囲光（%）','Number'],['force','力（N）','Number'],['pressed','3N以上押されている','Boolean']])add('lab_'+type,'センサー %1 の'+label,[port()],{output,colour:'#34ccf1'});
add('lab_button','本体の %1 ボタンが押されている',[choice('BUTTON',[['左','LEFT'],['右','RIGHT']])],{output:'Boolean',colour:'#34ccf1'});
add('lab_timer','タイマー（秒）',[],{output:'Number',colour:'#34ccf1'});
add('lab_timer_reset','タイマーを0にする',[],{...stmt,colour:'#34ccf1'});
add('lab_battery_voltage','本体のバッテリー電圧（mV）',[],{output:'Number',colour:'#34ccf1'});
add('lab_wait','%1 秒待つ',[val('SECONDS')],{...stmt,colour:'#f5a400'});
add('lab_wait_until','%1 まで待つ',[val('BOOL','Boolean')],{...stmt,colour:'#f5a400'});
add('lab_forever','ずっと繰り返す',[],{...stmt,message1:'%1',args1:[{type:'input_statement',name:'DO'}],colour:'#f5a400'});
add('lab_end','使用中の機器を止めてプログラム終了',[],{previousStatement:null,colour:'#f5a400'});
for(const [op,label]of Object.entries({add:'＋',sub:'−',mul:'×',div:'÷',lt:'＜',eq:'＝',gt:'＞',lte:'≦',gte:'≧',neq:'≠',and:'かつ',or:'または'}))add('lab_op_'+op,'%1 '+label+' %2',[val('A',['and','or'].includes(op)?'Boolean':'Number'),val('B',['and','or'].includes(op)?'Boolean':'Number')],{output:['add','sub','mul','div'].includes(op)?'Number':'Boolean',inputsInline:true,colour:'#00b84a'});
add('lab_math_function','%1 の %2',[val('VALUE'),choice('FUNCTION',[['絶対値','abs'],['切り下げ','floor'],['切り上げ','ceil'],['平方根','sqrt'],['sin（度）','sin'],['cos（度）','cos'],['tan（度）','tan'],['asin（度）','asin'],['acos（度）','acos'],['atan（度）','atan'],['ln','ln'],['log10','log'],['e^','exp'],['10^','pow10']])],{output:'Number',inputsInline:true,colour:'#00b84a'});
add('lab_minmax','%1 と %2 の %3',[val('A'),val('B'),choice('OP',[['小さい方','min'],['大きい方','max']])],{output:'Number',inputsInline:true,colour:'#00b84a'});
add('lab_display_clear','本体の表示を消す',[],{...stmt,colour:'#9966ff'});
add('lab_display_number','本体に数値 %1 を表示（-99〜99・小数切捨て）',[val('VALUE')],{...stmt,colour:'#9966ff'});
add('lab_pixel','横 %1 縦 %2 を明るさ %3 %にする',[val('X'),val('Y'),val('BRIGHTNESS')],{...stmt,colour:'#9966ff'});
add('lab_text','本体に文字 %1 を順に表示',[val('TEXT','String')],{...stmt,colour:'#9966ff',tooltip:'今回は英数字・記号の定数文字列のみ。最大120文字。各文字300ms、消灯50msで中央ボタン停止を確認します。'});
const colors=[['赤','RED'],['黄','YELLOW'],['緑','GREEN'],['青','BLUE'],['白','WHITE'],['マゼンタ','MAGENTA']];
add('lab_light','本体のランプを %1 にする',[choice('COLOR',colors)],{...stmt,colour:'#9966ff'});
add('lab_light_off','本体のランプを消す',[],{...stmt,colour:'#9966ff'});
add('lab_tone_ms','音 %1 Hz を %2 ミリ秒、音量 %3 %で鳴らす',[val('FREQUENCY'),val('MS'),val('VOLUME')],{...stmt,colour:'#a570b3'});
add('lab_sound_stop','音を止める',[],{...stmt,colour:'#a570b3'});
add('sbl_parameter','引数 %1',[choice('INDEX',[['1','0'],['2','1']])],{output:'Number',colour:'#aa597e'});
add('sbl_call_value','マイブロック %1 （%2 , %3）の戻り値',[field('NAME','動作'),val('ARG1'),val('ARG2')],{output:'Number',colour:'#aa597e',inputsInline:true});
add('lab_return_value','値 %1 を返してマイブロック終了',[val('VALUE')],{previousStatement:null,colour:'#f5a400'});
export const RICH_TYPES=new Set([...defs.map(d=>d.type),'math_number','math_arithmetic','math_single','math_trig','math_round','math_modulo','math_constrain','math_constant','logic_compare','logic_operation','logic_negate','logic_boolean','controls_if','controls_repeat_ext','controls_whileUntil','variables_get','variables_set','math_change','text']);
export function validateWorkspaceState(state){
 let total=0;const allowed=new Set([...RICH_TYPES,...STANDARD_TYPES,'spike_start','spike_image','spike_wait','spike_motor','spike_repeat','spike_forever','spike_if_distance','spike_call','sbl_proc']);
 function visit(x,d=0){if(d>100)throw Error('作品の入れ子が深すぎます。');if(!x||typeof x!=='object')return;
 if(x.type&&(!allowed.has(x.type)||++total>4000))throw Error('未知のブロックまたは上限超過です。元の作品は変更していません。');
 for(const k of ['PORT','PORTS','LEFT','RIGHT'])if(x.fields?.[k]!==undefined){const s=x.fields[k];if(s==='ALL'&&k==='PORTS'&&['lab_motor_group_stop','lab_motor_stop_mode'].includes(x.type))continue;const a=typeof s==='string'?s.split(','):[];if(!a.length||a.length>(k==='PORTS'?2:1)||new Set(a).size!==a.length||a.some(p=>!'ABCDEF'.includes(p)||p.length!==1))throw Error('ポート指定が不正です。元の作品は変更していません。');}
 Object.values(x).forEach(v=>visit(v,d+1));}visit(state);return state;
}
const n=value=>({shadow:{type:'math_number',fields:{NUM:value}}});
const block=(type,inputs={})=>({kind:'block',type,inputs:Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,typeof v==='number'?n(v):{shadow:{type:'logic_boolean',fields:{BOOL:'FALSE'}}}]))});
export function setupRich(Blockly){Blockly.defineBlocksWithJsonArray(defs.filter(d=>!STANDARD_TYPES.includes(d.type)));Blockly.defineBlocksWithJsonArray([
 {type:'sbl_proc',message0:'マイブロック %1（引数1・引数2）',args0:[field('NAME','動作')],message1:'%1',args1:[{type:'input_statement',name:'BODY'}],colour:'#aa597e'},
 {type:'spike_call',message0:'マイブロック %1 を実行（%2 , %3）',args0:[field('NAME','動作'),val('ARG1'),val('ARG2')],previousStatement:null,nextStatement:null,inputsInline:true,colour:'#aa597e'}]);
 setupClassroom(Blockly);setBlockLanguage(Blockly,'standard');
 for(const type of STANDARD_TYPES)if(!IMPLEMENTED_TYPES.has(type)&&Blockly.Blocks[type]){const init=Blockly.Blocks[type].init;Blockly.Blocks[type].init=function(){init.call(this);this.setWarningText('SPIKE-RT未対応：編集・保存・読込はできますが、C生成はできません。','spike-rt-capability');};}
}
export function richToolbox(){return commonToolbox();}
export function workspaceProgramV2(ws){
 const issues=supportIssues(ws);if(issues.length)throw Error(issues.map(x=>x.message).join(' / '));
 let currentDefinition=null;
 const args=b=>(b.arguments_??[]).map((_,i)=>expr(b.getInputTargetBlock('ARG'+i)));
 const parameter=b=>{const id=b.type==='lab_argument'?b.parameterId:b.getField('VAR')?.getVariable()?.getId();return currentDefinition?.getVarModels?.().findIndex(m=>m.getId()===id)??-1;};
 let total=0;const tick=(b,d)=>{if(!b||d>24||++total>4000)throw Error('式やブロックが多すぎるか、入れ子が深すぎます。');};
 const expr=(b,d=0)=>{if(!b)return 0;tick(b,d);const f=n=>b.getFieldValue(n),v=n=>expr(b.getInputTargetBlock(n),d+1);const t=b.type;
  if(t==='math_number')return Number(f('NUM'));if(t==='logic_boolean')return f('BOOL')==='TRUE'?1:0;if(t==='lab_argument'){const i=parameter(b);if(i<0)throw Error('引数は対応する定義の中で使ってください。');return {kind:'param',index:i};}if(t==='variables_get'){const i=parameter(b);return i>=0?{kind:'param',index:i}:{kind:'var',name:b.getField('VAR').getVariable().name};}if(t==='sbl_parameter')return {kind:'param',index:Number(f('INDEX'))};
  if(t.startsWith('lab_op_'))return {kind:'op',op:t.slice(7),a:v('A'),b:v('B')};
  if(t==='math_arithmetic')return {kind:'op',op:{ADD:'add',MINUS:'sub',MULTIPLY:'mul',DIVIDE:'div',POWER:'pow'}[f('OP')],a:v('A'),b:v('B')};
  if(t==='logic_compare')return {kind:'op',op:{EQ:'eq',NEQ:'neq',LT:'lt',LTE:'lte',GT:'gt',GTE:'gte'}[f('OP')],a:v('A'),b:v('B')};
  if(t==='logic_operation')return {kind:'op',op:f('OP').toLowerCase(),a:v('A'),b:v('B')};
  if(t==='logic_negate')return {kind:'math',fn:'not',value:v('BOOL')};
  if(t==='lab_math_function')return {kind:'math',fn:f('FUNCTION'),value:v('VALUE')};
  if(t==='math_single'||t==='math_trig')return {kind:'math',fn:{ROOT:'sqrt',ABS:'abs',NEG:'neg',LN:'ln',LOG10:'log',EXP:'exp',POW10:'pow10',SIN:'sin',COS:'cos',TAN:'tan',ASIN:'asin',ACOS:'acos',ATAN:'atan'}[f('OP')],value:v('NUM')};
  if(t==='math_round')return {kind:'math',fn:{ROUND:'round',ROUNDUP:'ceil',ROUNDDOWN:'floor'}[f('OP')],value:v('NUM')};
  if(t==='lab_minmax')return {kind:'op',op:f('OP'),a:v('A'),b:v('B')};if(t==='math_modulo')return {kind:'op',op:'mod',a:v('DIVIDEND'),b:v('DIVISOR')};if(t==='math_constrain')return {kind:'clamp',value:v('VALUE'),low:v('LOW'),high:v('HIGH')};
  if(t==='math_constant'){const x={PI:Math.PI,E:Math.E,GOLDEN_RATIO:(1+Math.sqrt(5))/2,SQRT2:Math.SQRT2,SQRT1_2:Math.SQRT1_2}[f('CONSTANT')];if(x===undefined)throw Error('無限大定数は対応していません。');return x;}
  if(t==='procedures_callreturn')return {kind:'call',name:b.getProcedureCall(),args:args(b)};
  if(/^lab_(distance|reflection|force)_compare$/.test(t))return {kind:'op',op:{EQ:'eq',NEQ:'neq',LT:'lt',LTE:'lte',GT:'gt',GTE:'gte'}[f('OP')],a:{kind:'sensor',sensor:t.split('_')[1],port:f('PORT')},b:v('VALUE')};
  if(t==='sbl_call_value')return {kind:'call',name:f('NAME'),args:[v('ARG1'),v('ARG2')]};
  if(['distance','distance_valid','reflection','ambient','force','pressed','encoder','motor_velocity','button','timer','battery_voltage'].some(s=>t==='lab_'+s))return {kind:'sensor',sensor:t.slice(4),port:f('PORT'),button:f('BUTTON')};
  throw Error('未対応の式です: '+t);
 };
 const roots=ws.getTopBlocks(true).filter(b=>b.isEnabled());if(roots.filter(b=>b.type==='spike_start').length!==1)throw Error('スタートは１つ置いてください。');
 function chain(b,d=0){const nodes=[];while(b){tick(b,d);if(!b.isEnabled()){b=b.getNextBlock();continue;}const t=b.type,f=n=>b.getFieldValue(n),v=n=>expr(b.getInputTargetBlock(n)),body=n=>chain(b.getInputTargetBlock(n),d+1);let n={id:b.id};
  if(t==='spike_image')Object.assign(n,{type:'image',image:f('IMAGE')});else if(t==='spike_wait'||t==='lab_wait')Object.assign(n,{type:'wait',seconds:t==='spike_wait'?Number(f('SECONDS')):v('SECONDS')});
  else if(t==='spike_motor')Object.assign(n,{type:'motor',port:f('PORT'),speed:Number(f('SPEED'))*Number(f('DIRECTION')),seconds:Number(f('SECONDS'))});
  else if(/^lab_motor_(single|pair)_(run|angle|rotation|time)$/.test(t)){const [,group,action]=t.match(/^lab_motor_(single|pair)_(run|angle|rotation|time)$/);Object.assign(n,{type:'motorCommand',ports:group==='single'?f('PORT'):f('PORTS'),action,speed:v('SPEED'),amount:action==='run'?0:v({angle:'DEGREES',rotation:'ROTATIONS',time:'SECONDS'}[action])});}
  else if(t==='lab_motor_group_stop')Object.assign(n,{type:'motorStop',ports:f('PORTS'),mode:f('MODE')});else if(t==='lab_motor_power')Object.assign(n,{type:'motorPower',port:f('PORT'),value:v('POWER')});else if(t==='lab_encoder_reset')Object.assign(n,{type:'encoderReset',port:f('PORT')});
  else if(t==='variables_set'||t==='math_change')Object.assign(n,{type:t==='variables_set'?'set':'change',name:b.getField('VAR').getVariable().name,value:v(t==='math_change'?'DELTA':'VALUE')});
  else if(t==='controls_repeat_ext'||t==='spike_repeat')Object.assign(n,{type:'repeat',count:t==='spike_repeat'?Number(f('COUNT')):v('TIMES'),body:body(t==='spike_repeat'?'BODY':'DO')});
  else if(['spike_forever','lab_forever'].includes(t))Object.assign(n,{type:'forever',body:body(t==='spike_forever'?'BODY':'DO')});else if(t==='controls_whileUntil')Object.assign(n,{type:'while',until:f('MODE')==='UNTIL',condition:v('BOOL'),body:body('DO')});else if(t==='lab_wait_until')Object.assign(n,{type:'waitUntil',condition:v('BOOL')});
  else if(t==='spike_if_distance')Object.assign(n,{type:'ifDistance',port:f('PORT'),cm:Number(f('CM')),then:body('THEN'),else:body('ELSE')});
  else if(t==='controls_if'){let tail=body('ELSE');let i=0;while(b.getInput('IF'+i))i++;for(--i;i>=0;i--)tail=[{type:'if',condition:v('IF'+i),then:body('DO'+i),else:tail}];nodes.push(...tail);b=b.getNextBlock();continue;}
  else if(t==='procedures_callnoreturn')Object.assign(n,{type:'call',name:b.getProcedureCall(),args:args(b)});
  else if(t==='lab_call_outputs')Object.assign(n,{type:'set',name:b.getField('OUT0').getVariable().name,value:{kind:'call',name:b.getProcedureCall(),args:args(b)}});
  else if(t==='lab_return')Object.assign(n,{type:'return',value:0});
  else if(t==='lab_return_values')Object.assign(n,{type:'return',value:v('VALUE0')});
  else if(t==='spike_call')Object.assign(n,{type:'call',name:f('NAME'),args:[v('ARG1'),v('ARG2')]});else if(t==='lab_return_value')Object.assign(n,{type:'return',value:v('VALUE')});else if(t==='lab_end')n.type='end';
  else if(t==='lab_timer_reset')n.type='timerReset';else if(t==='lab_display_clear')n.type='displayClear';else if(t==='lab_display_number')Object.assign(n,{type:'displayNumber',value:v('VALUE')});else if(t==='lab_pixel')Object.assign(n,{type:'pixel',x:v('X'),y:v('Y'),value:v('BRIGHTNESS')});
  else if(t==='lab_text'){const text=b.getInputTargetBlock('TEXT');if(text?.type!=='text')throw Error('文字表示は今回は定数文字列のみ対応します。');Object.assign(n,{type:'displayText',text:text.getFieldValue('TEXT')});}
  else if(t==='lab_light')Object.assign(n,{type:'light',color:f('COLOR')});else if(t==='lab_light_off')n.type='lightOff';else if(t==='lab_tone_ms')Object.assign(n,{type:'tone',hz:v('FREQUENCY'),ms:v('MS'),volume:v('VOLUME')});else if(t==='lab_sound_stop')n.type='soundStop';else throw Error('未対応ブロックです: '+t);
  nodes.push(n);if(['forever','end','return'].includes(n.type)&&b.getNextBlock())throw Error('終了・戻る・ずっとの後のブロックには進めません。');b=b.getNextBlock();}return nodes;
 }
 for(const b of roots)if(!['spike_start','sbl_proc','procedures_defnoreturn','procedures_defreturn'].includes(b.type))throw Error('接続されていないブロックがあります。スタートかマイブロックへつないでください。');
 return {version:2,body:chain(roots.find(b=>b.type==='spike_start').getNextBlock()),procedures:roots.filter(b=>['sbl_proc','procedures_defnoreturn','procedures_defreturn'].includes(b.type)).map(b=>{currentDefinition=b;const body=chain(b.getInputTargetBlock(b.type==='sbl_proc'?'BODY':'STACK'));if(b.type==='procedures_defreturn')body.push({type:'return',value:expr(b.getInputTargetBlock('RETURN'))});currentDefinition=null;return {name:b.getFieldValue('NAME'),params:b.type==='sbl_proc'?2:b.getVarModels().length,body};})};
}
export function richSample(name){
 const num=n=>({shadow:{type:'math_number',fields:{NUM:n}}}),block=b=>({block:b});
 if(name==='math'){
  const call={type:'procedures_callreturn',extraState:{name:'足す',params:['入力1','入力2'],outputs:['答え'],output:0},inputs:{ARG0:num(3),ARG1:num(4)}};
  const show={type:'lab_display_number',inputs:{VALUE:block({type:'variables_get',fields:{VAR:{id:'result'}}})}};
  const repeat={type:'controls_repeat_ext',inputs:{TIMES:num(3),DO:block({type:'math_change',fields:{VAR:{id:'result'}},inputs:{DELTA:num(1)}})},next:block(show)};
  const set={type:'variables_set',fields:{VAR:{id:'result'}},inputs:{VALUE:block(call)},next:block(repeat)};
  const add={type:'lab_op_add',inputs:{A:block({type:'lab_argument',extraState:{parameterId:'arg1',name:'入力1'}}),B:block({type:'lab_argument',extraState:{parameterId:'arg2',name:'入力2'}})}};
  return {variables:[{name:'結果',id:'result'},{name:'入力1',id:'arg1'},{name:'入力2',id:'arg2'}],blocks:{languageVersion:0,blocks:[{type:'spike_start',x:40,y:40,next:block(set)},{type:'procedures_defreturn',x:550,y:40,fields:{NAME:'足す'},extraState:{params:[{name:'入力1',id:'arg1'},{name:'入力2',id:'arg2'}],outputs:['答え']},inputs:{RETURN:block(add)}}]}};
 }
 if(name==='angle')return {blocks:{languageVersion:0,blocks:[{type:'spike_start',x:40,y:40,next:block({type:'lab_motor_pair_angle',fields:{PORTS:'A,B'},inputs:{SPEED:num(20),DEGREES:num(90)},next:block({type:'lab_motor_group_stop',fields:{PORTS:'A,B',MODE:'BRAKE'}})})}]}};
 if(name==='sensor_number')return {blocks:{languageVersion:0,blocks:[{type:'spike_start',x:40,y:40,next:block({type:'controls_if',inputs:{IF0:block({type:'lab_distance_valid',fields:{PORT:'D'}}),DO0:block({type:'lab_display_number',inputs:{VALUE:block({type:'math_constrain',inputs:{VALUE:block({type:'lab_distance',fields:{PORT:'D'}}),LOW:num(0),HIGH:num(99)}})}})}})}]}};
 return null;
}
