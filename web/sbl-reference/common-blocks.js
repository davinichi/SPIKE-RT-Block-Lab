import {EXTRA_TYPES,setupEnhancements,extraPalette} from './enhancements.js';
// EV3 Block Lab v0.22 classroom organization, adapted to SPIKE hardware.
const ports=['A','B','C','D','E','F'];
const field=(name,options)=>({type:'field_dropdown',name,options});
const port=(name='PORT',first='A')=>field(name,[first,...ports.filter(p=>p!==first)].map(p=>[p,p]));
const pairs=ports.flatMap(left=>ports.filter(right=>right!==left).map(right=>[left+' + '+right,left+','+right]));
const pairPort=()=>field('PORTS',[pairs.find(p=>p[1]==='B,C'),...pairs.filter(p=>p[1]!=='B,C')]);
const value=(name,check='Number')=>({type:'input_value',name,...(check?{check}:{})});
const textField=(name,text)=>({type:'field_input',name,text});
const stmt={previousStatement:null,nextStatement:null,inputsInline:true};
const motion='#ff4ccd',motor='#0090f5',sensor='#34ccf1',control='#f5a400',operator='#00b84a';
const definitions=[];
function define(type,message0,args0,properties={}){definitions.push({type,message0,...(args0.length?{args0}:{}),...properties});}
const comparison=()=>field('OP',[['＜','LT'],['＝','EQ'],['＞','GT'],['≦','LTE'],['≧','GTE'],['≠','NEQ']]);
for(const paired of [false,true])for(const action of ['run','angle','rotation','time']) {
  const amount={angle:'DEGREES',rotation:'ROTATIONS',time:'SECONDS'}[action];
  const suffix={run:'を速さ %2 ％で回し続ける',angle:'速さ %2 ％で %3 度回す',rotation:'速さ %2 ％で %3 回転する',time:'速さ %2 ％で %3 秒動かす'}[action];
  define('lab_motor_'+(paired?'pair':'single')+'_'+action,'モーター'+(paired?'2個':'1個')+' %1 '+suffix,[paired?pairPort():port(),value('SPEED'),...(amount?[value(amount)]:[])],{...stmt,colour:motor,tooltip:'SPIKEのL/Mモーター共通。速さ−100〜100％。負は逆回転。2個指定は各軸を同じ向きに回します。車体の移動には「動き」を使います。'});
}
define('lab_motor_group_stop','モーター %1 を %2 で停止',[field('PORTS',[...ports.map(p=>[p,p]),...pairs,['すべて','ALL']]),field('MODE',[['ブレーキ','BRAKE'],['惰性','COAST'],['保持','HOLD']])],{...stmt,colour:motor});
define('lab_tread','トレッド（タイヤ中心どうしの間隔）を %1 mm にする',[{type:'field_number',name:'TREAD',value:112,min:10,max:1000}],{...stmt,colour:motion,tooltip:'左右のタイヤの中心間を測ります。スピンターンとピボットターンの角度計算に使います。'});
for(const [direction,label] of [['forward','前に進む'],['backward','後ろに下がる']])
  define('lab_drive_'+direction,'速さ %1 ％で %2 cm '+label,[value('SPEED'),value('CM')],{...stmt,colour:motion,tooltip:'速さは−100〜100％（0を除く）、距離は正の値。負の速さで表示と逆向きに進みます。左右のモーターとタイヤ直径を先に設定します。'});
for(const kind of ['spin','pivot'])for(const [direction,label] of [['right','右'],['left','左']])
  define('lab_'+kind+'_'+direction,'速さ %1 ％で '+label+'に %2 度'+(kind==='spin'?'スピンターン':'ピボットターン'),[value('SPEED'),value('ANGLE')],{...stmt,colour:motion,tooltip:kind==='spin'?'左右の車輪を逆方向に回してその場で旋回。車体の角度を指定します。速さは−100〜100％（0を除く）。負の速さで各車輪が逆回転します。タイヤ直径とトレッドを先に設定します。':'内側の車輪を止め、外側だけを回して旋回。車体の角度を指定します。速さは−100〜100％（0を除く）。負の速さで各車輪が逆回転します。タイヤ直径とトレッドを先に設定します。'});
for(const action of ['run','angle','time']) {
  const amount=action==='angle'?'DEGREES':'SECONDS';
  define('lab_steering_'+action,'ステアリング %1 速さ %2 ％で '+({run:'回し続ける',angle:'外側を %3 度回す',time:'%3 秒走る'}[action]),[value('TURN'),value('SPEED'),...(action==='run'?[]:[value(amount)])],{...stmt,colour:motion,tooltip:'発展用。ステアリング−100〜100。0は直進。これは車体の旋回角度ではありません。角度指定は外側のモーター軸の角度です。'});
  define('lab_tank_'+action,'左の速さ %1 ％ 右の速さ %2 ％で'+({run:'回し続ける',angle:'速い側を %3 度回す',time:' %3 秒走る'}[action]),[value('LEFT_SPEED'),value('RIGHT_SPEED'),...(action==='run'?[]:[value(amount)])],{...stmt,colour:motion});
}
for(const [type,label] of [['distance','距離センサ %1 の距離が %2 %3 cm'],['reflection','カラーセンサ %1 の反射光が %2 %3 ％'],['force','フォースセンサ %1 の力が %2 %3 N']])
  define('lab_'+type+'_compare',label,[port(),comparison(),value('VALUE')],{output:'Boolean',inputsInline:true,colour:sensor});
define('lab_display_clear','本体の表示を消す',[],{...stmt,colour:'#9966ff'});
define('lab_display_number','本体に数値 %1 を表示',[value('VALUE')],{...stmt,colour:'#9966ff',tooltip:'SPIKE本体の5×5ライトに英数字として流して表示します。'});
define('lab_light_off','本体のランプを消す',[],{...stmt,colour:'#9966ff'});
define('lab_tone_ms','音 %1 Hz を %2 ミリ秒 鳴らす 音量 %3',[value('FREQUENCY'),value('MS'),value('VOLUME')],{...stmt,colour:'#a570b3'});
define('lab_when_changed','%1 が変わったとき',[value('VALUE',null)],{nextStatement:null,colour:'#d3a238'});
define('lab_message_wait','メッセージ %1 を送って待つ',[textField('MESSAGE','合図')],{...stmt,colour:'#d3a238'});
define('lab_return','このマイブロックを終了する',[],{previousStatement:null,colour:control});
define('lab_pid','PID %1 目標値 %2 測定値 %3',[textField('NAME','PID1'),value('TARGET'),value('MEASURED')],{message1:'P %1 I %2 D %3 の出力',args1:[value('KP'),value('KI'),value('KD')],output:'Number',inputsInline:true,colour:operator});
define('lab_pid_reset','PID %1 をリセットする',[textField('NAME','PID1')],{...stmt,colour:control});
define('lab_text_get','文字 %1',[textField('NAME','文字1')],{output:'String',colour:operator});
define('lab_text_set','文字 %1 を %2 にする',[textField('NAME','文字1'),value('VALUE',null)],{...stmt,colour:'#ff8c1a'});
for(const [action,label] of [['clear','を空にする'],['add','に %2 を追加する'],['set','の %2 番目を %3 にする'],['delete','の %2 番目を削除する'],['item','の %2 番目'],['length','の長さ'],['contains','に %2 が含まれる'],['stat','の %2']]) {
  const indexed=['set','delete','item'].includes(action),valued=['add','set','contains'].includes(action);
  define('lab_list_'+action,'リスト %1 '+label,[textField('NAME','リスト1'),...(indexed?[value('INDEX')]:[]),...(valued?[value('VALUE')]:[]),...(action==='stat'?[field('OP',[['合計','sum'],['平均','average'],['最小','min'],['最大','max']])]:[])],['item','length','contains','stat'].includes(action)?{output:action==='contains'?'Boolean':'Number',inputsInline:true,colour:operator}:{...stmt,colour:'#ff8c1a'});
}
define('lab_log_start','記録 %1 を始める',[textField('NAME','Record1')],{...stmt,colour:'#c58245',tooltip:'本体にCSVを保存します。再接続後に記録を取り出せます。本体のファイル機能が使えない場合はエラーで停止します。'});
define('lab_log_value','項目 %1 の値 %2 を記録する',[textField('LABEL','値1'),value('VALUE',null)],{...stmt,colour:'#c58245'});
define('lab_log_end','記録を終える',[],{...stmt,colour:'#c58245'});
export const COMMON_TYPES=[...definitions.map(d=>d.type),'lab_argument',...EXTRA_TYPES];
export function setupCommon(Blockly) {
  Blockly.defineBlocksWithJsonArray(definitions);
  Blockly.Blocks.lab_argument={init(){this.parameterId='';this.appendDummyInput().appendField(new Blockly.FieldLabelSerializable('引数'),'ARG_NAME');this.setOutput(true);this.setColour('#aa597e');},saveExtraState(){return {parameterId:this.parameterId,name:this.getFieldValue('ARG_NAME')};},loadExtraState(state){this.parameterId=String(state.parameterId??'');this.setFieldValue(String(state.name??'引数'),'ARG_NAME');}};
  setupEnhancements(Blockly);
  // Standard operators use the same green as EV3 Block Lab.
  for(const type of ['math_number','math_arithmetic','logic_compare','logic_operation','logic_negate','logic_boolean','math_single','math_trig','math_round','math_modulo','math_random_int','math_constrain','text','text_join','text_length','text_isEmpty','text_charAt','text_indexOf','math_minmax']) {
    if(!Blockly.Blocks[type])continue;
    const original=Blockly.Blocks[type]._commonInit??Blockly.Blocks[type].init;Blockly.Blocks[type]._commonInit=original;
    Blockly.Blocks[type].init=function(){original.call(this);this.setColour(operator);};
  }
  // Blockly built-ins otherwise retain their default category colours.
  // Apply the EV3 palette after every definition, including restored blocks.
  const recolour=(types,colour)=>{for(const type of types){
    const definition=Blockly.Blocks[type];if(!definition)continue;
    const original=definition._ev3ColourInit??definition.init;definition._ev3ColourInit=original;
    definition.init=function(){original.call(this);this.setColour(colour);};
  }};
  recolour(['spike_start','lab_when','lab_when_changed','lab_message_hat','lab_broadcast','lab_message_wait'],'#d3a238');
  recolour(['lab_wait','lab_wait_until','lab_forever','lab_end','lab_return','lab_pid_reset','controls_if','controls_repeat_ext','controls_whileUntil'],control);
  recolour(['lab_distance','lab_distance_valid','lab_color','lab_color_is','lab_reflection','lab_force','lab_pressed','lab_angle','lab_encoder','lab_encoder_reset','lab_button','lab_timer','lab_timer_reset','lab_yaw_reset','lab_distance_compare','lab_reflection_compare','lab_force_compare'],sensor);
  recolour(['lab_text','lab_pixel','spike_image','lab_light','lab_light_off','lab_display_clear','lab_display_number'],'#9966ff');
  recolour(['text','text_join','text_length','text_isEmpty','text_print','text_charAt','text_indexOf','lab_text_get','lab_text_set',...COMMON_TYPES.filter(type=>type.startsWith('lab_list_')),'lists_create_with','lists_length','lists_isEmpty','lists_getIndex','lists_setIndex','lists_indexOf','math_modulo','math_random_int','math_round','math_constrain'],'#00b85b');
  recolour(['lab_text_get','lab_text_set',...COMMON_TYPES.filter(type=>type.startsWith('lab_list_'))],'#ff8c1a');
  recolour(['variables_get','variables_set','math_change'],'#c58245');
  recolour(['procedures_defnoreturn','procedures_callnoreturn','procedures_defreturn','procedures_callreturn','lab_call_outputs','lab_return_values','lab_return_value','lab_argument'],'#aa597e');
  recolour(['lab_pid'],'#00b85d');
}
export function syncArgumentColours(workspace) {
  for(const block of workspace.getAllBlocks(false))if(block.type==='variables_get'){
    const root=block.getRootBlock(),model=block.getField('VAR')?.getVariable();
    const argument=['procedures_defnoreturn','procedures_defreturn'].includes(root.type)&&root.getVarModels().some(parameter=>parameter.getId()===model?.getId());
    const colour=argument?'#aa597e':'#c58245';if(block.getColour()!==colour)block.setColour(colour);
  }
}
const shadow=n=>({shadow:{type:'math_number',fields:{NUM:n}}});
const textShadow=t=>({shadow:{type:'text',fields:{TEXT:t}}});
const block=(type,values={},fields={})=>({kind:'block',type,fields,inputs:Object.fromEntries(Object.entries(values).map(([name,n])=>[name,typeof n==='number'?shadow(n):textShadow(n)]))});
const label=text=>({kind:'label',text});
const category=(name,colour,contents)=>({kind:'category',name,colour,contents});
export function commonToolbox() {
  const motors=[label('加速・減速（L・M共通）'),...extraPalette('ramp')];
  for(const paired of [false,true]) {motors.push(label(paired?'モーター2個':'モーター1個'));for(const action of ['run','angle','rotation','time'])motors.push(block('lab_motor_'+(paired?'pair':'single')+'_'+action,{SPEED:20,...(action==='run'?{}:{[{angle:'DEGREES',rotation:'ROTATIONS',time:'SECONDS'}[action]]:action==='angle'?90:1})}));}
  const motorExtras=extraPalette('motor');
  motors.push(label('L・M共通の速度・パワー・停止方法'),...['lab_motor_change_speed','lab_motor_power','lab_motor_stop_mode'].map(type=>motorExtras.find(item=>item.type===type)),label('モーターを停止（L・M共通）'),block('lab_motor_group_stop'),label('モーターの計測'),motorExtras.find(item=>item.type==='lab_motor_velocity'));
  const advanced=['run','angle','time'].map(action=>block('lab_steering_'+action,{TURN:25,SPEED:20,...(action==='run'?{}:{[action==='angle'?'DEGREES':'SECONDS']:action==='angle'?360:2})}));
  return {kind:'categoryToolbox',contents:[
    category('スタート','#d3a238',[block('spike_start')]),
    category('イベント','#d3a238',[label('センサー・比較を条件の欄に入れます'),block('lab_when'),block('lab_when_changed',{VALUE:0}),label('同じ名前のメッセージで連携します'),block('lab_message_hat'),block('lab_broadcast'),block('lab_message_wait')]),
    category('モーター',motor,motors),
    category('動き',motion,[block('lab_pair'),block('lab_geometry'),block('lab_tread'),...advanced,...['angle','time'].map(action=>block('lab_tank_'+action,{LEFT_SPEED:30,RIGHT_SPEED:15,[action==='angle'?'DEGREES':'SECONDS']:action==='angle'?360:1})),block('lab_tank_run',{LEFT_SPEED:20,RIGHT_SPEED:20}),...['spin','pivot'].flatMap(kind=>['right','left'].map(direction=>block('lab_'+kind+'_'+direction,{SPEED:20,ANGLE:90}))),block('lab_drive_forward',{SPEED:20,CM:20}),block('lab_drive_backward',{SPEED:20,CM:20})]),
    category('センサー',sensor,[label('本体のバッテリー'),block('lab_battery_voltage'),label('タイマー'),block('lab_timer'),block('lab_timer_reset'),label('モーターのエンコーダ'),block('lab_encoder'),block('lab_encoder_reset'),label('本体のジャイロ・ボタン'),block('lab_angle'),block('lab_yaw_reset'),block('lab_button'),label('フォースセンサー'),block('lab_pressed'),block('lab_force'),block('lab_force_compare',{VALUE:2}),label('カラーセンサー'),block('lab_color_is'),block('lab_color'),block('lab_reflection_compare',{VALUE:50}),block('lab_reflection'),label('距離センサー'),block('lab_distance_compare',{VALUE:15}),block('lab_distance'),block('lab_distance_valid')]),
    category('音','#a570b3',[block('lab_tone_ms',{FREQUENCY:440,MS:200,VOLUME:25})]),
    category('制御',control,[block('lab_wait',{SECONDS:1}),block('controls_if'),{...block('controls_if'),extraState:{hasElse:true}},block('lab_forever'),block('controls_repeat_ext',{TIMES:10}),block('controls_whileUntil',{}, {MODE:'UNTIL'}),block('controls_whileUntil',{}, {MODE:'WHILE'}),block('lab_wait_until'),block('lab_end'),block('lab_return'),label('PID制御'),block('lab_pid',{TARGET:0,MEASURED:0,KP:1,KI:0,KD:0}),block('lab_pid_reset')]),
    category('演算',operator,[block('math_number'),...extraPalette('operators'),...extraPalette('math'),block('logic_negate'),block('logic_boolean'),block('math_modulo',{DIVIDEND:1,DIVISOR:10}),block('math_random_int',{FROM:1,TO:10}),block('math_round',{NUM:1.5}),block('math_constrain',{VALUE:120,LOW:-100,HIGH:100})]),
    category('表示','#9966ff',[label('SPIKE本体：5×5ライト／英数字を表示'),block('lab_display_clear'),block('lab_text',{TEXT:'Hello'}),block('lab_display_number',{VALUE:12.5}),block('lab_display_abacus',{VALUE:7800}),block('lab_pixel',{X:2,Y:2,BRIGHTNESS:100})]),
    category('ランプ','#9966ff',[block('lab_light'),block('lab_light_off'),...extraPalette('lamp')]),
    category('データ','#ff8c1a',[label('文字列'),block('text'),block('lab_text_get'),block('lab_text_set',{VALUE:'Hello'}),block('text_join'),block('text_length',{VALUE:'Hello'}),block('text_isEmpty',{VALUE:'Hello'}),...extraPalette('text'),label('数値リスト（同じ名前で共有）'),...['clear','add','set','delete','item','length','contains','stat'].map(action=>block('lab_list_'+action,{...(['set','delete','item'].includes(action)?{INDEX:1}:{}),...(['add','set','contains'].includes(action)?{VALUE:0}:{})}))]),
    category('記録','#c58245',[label('本体にCSVを保存・再接続して取り出す'),block('lab_log_start'),block('lab_log_value',{VALUE:0}),block('lab_log_end')]),
    {kind:'category',name:'変数',colour:'#c58245',custom:'LAB_VARIABLES'},
    {kind:'category',name:'マイブロック',colour:'#aa597e',custom:'PROCEDURE'},
    {kind:'category',name:'引数',colour:'#668b6d',custom:'ARGUMENTS'}
  ]};
}
export function installCommonWorkspace(workspace,Blockly) {
  workspace.registerToolboxCategoryCallback('ARGUMENTS',ws=>{
    const names=new Map();for(const def of ws.getAllBlocks(false).filter(b=>['procedures_defnoreturn','procedures_defreturn'].includes(b.type)))for(const model of def.getVarModels())if(!names.has(model.getName()))names.set(model.getName(),model);
    return [label('定義の中だけで使う引数'),...[...names.values()].map(model=>({kind:'block',type:'lab_argument',extraState:{parameterId:model.getId(),name:model.getName()}})),...(!names.size?[label('「マイブロックを作る」で引数を追加します')]:[])];
  });
  workspace.registerToolboxCategoryCallback('LAB_VARIABLES',ws=>{
    const parameters=new Set(ws.getAllBlocks(false).filter(b=>['procedures_defnoreturn','procedures_defreturn'].includes(b.type)).flatMap(b=>b.getVarModels().map(m=>m.getId())));
    const variables=ws.getVariableMap().getAllVariables().filter(m=>!parameters.has(m.getId()));
    return [label('プログラム全体で使う変数'),{kind:'button',text:'変数をつくる',callbackKey:'LAB_CREATE_VARIABLE'},...(variables.length?[block('variables_set',{VALUE:0},{VAR:{id:variables[0].getId()}}),block('math_change',{DELTA:1},{VAR:{id:variables[0].getId()}}),...variables.map(m=>block('variables_get',{}, {VAR:{id:m.getId()}}))]:[])];
  });
  workspace.registerButtonCallback('LAB_CREATE_VARIABLE',()=>Blockly.Variables.createVariableButtonHandler(workspace));
}

