import {setupReturnBlocks} from './returns.js';
import {setupBlocks} from './blocks.js';
import {BLOCK_TYPES,PORTS} from './model.js';
import {COMMON_TYPES,setupCommon,commonToolbox} from './common-blocks.js?v=0.7.0';
export const STANDARD_TYPES = [
  'lab_pair','lab_geometry',
  'lab_wait','lab_wait_until','lab_forever','lab_end','lab_text','lab_pixel','lab_light',
  'lab_distance','lab_distance_valid','lab_color','lab_color_is','lab_reflection','lab_force','lab_pressed',
  'lab_angle','lab_encoder','lab_encoder_reset','lab_button','lab_timer','lab_timer_reset','lab_yaw_reset',
  'lab_when','lab_message_hat','lab_broadcast',
  'math_number','math_arithmetic','math_single','math_trig','math_constant','math_round','math_modulo','math_constrain','math_random_int',
  'logic_compare','logic_operation','logic_negate','logic_boolean','controls_if','controls_repeat_ext','controls_whileUntil',
  'variables_get','variables_set','math_change','text','text_join','text_length','text_isEmpty','text_print',
  'lists_create_with','lists_length','lists_isEmpty','lists_getIndex','lists_setIndex','lists_indexOf',
  'procedures_defnoreturn','procedures_callnoreturn','procedures_defreturn','procedures_callreturn','lab_call_outputs','lab_return_values','lab_return_value',...COMMON_TYPES
];
for(const type of STANDARD_TYPES)BLOCK_TYPES.add(type);
const number=(name,value,min,max)=>({type:'field_number',name,value,min,max});
const input=name=>({type:'input_value',name,check:'Number'});
const port=(name='PORT')=>({type:'field_dropdown',name,options:PORTS.map(p=>[p,p])});
const choice=(name,options)=>({type:'field_dropdown',name,options});
const colors=[['赤','RED'],['黄','YELLOW'],['緑','GREEN'],['青','BLUE'],['白','WHITE'],['黒','BLACK'],['紫','MAGENTA'],['色なし','UNKNOWN']];
export function setupClassroom(Blockly) {
  setupBlocks(Blockly);
  Blockly.Msg.PROCEDURES_DEFNORETURN_PROCEDURE='マイブロック';
  Blockly.Msg.PROCEDURES_DEFNORETURN_TITLE='定義';
  Blockly.Msg.CONTROLS_IF_MSG_THEN='';Blockly.Msg.CONTROLS_IF_MSG_ELSE='でなければ';
  Blockly.defineBlocksWithJsonArray([
    ...['motor','motor_run','motor_stop'].map(kind=>kind==='motor'?{
      type:'lab_motor',message0:'モーター %1 速さ %2 ％で %3 %4 回す',args0:[port(),input('SPEED'),input('AMOUNT'),choice('UNIT',[['度','degrees'],['回転','rotations'],['秒','seconds']])],previousStatement:null,nextStatement:null,inputsInline:true,colour:'#0090f5'
    }:kind==='motor_run'?{type:'lab_motor_run',message0:'モーター %1 を速さ %2 ％で回し続ける',args0:[port(),input('SPEED')],previousStatement:null,nextStatement:null,inputsInline:true,colour:'#0090f5'}:{type:'lab_motor_stop',message0:'モーター %1 を %2 で停止',args0:[choice('PORT',[...PORTS.map(p=>[p,p]),['すべて','ALL']]),choice('MODE',[['ブレーキ','BRAKE'],['惰性','COAST'],['保持','HOLD']])],previousStatement:null,nextStatement:null,colour:'#0090f5'}),
    {type:'lab_pair',message0:'動きに使うモーターを 左 %1 右 %2 にする',args0:[{...port('LEFT'),options:[['B','B'],...PORTS.filter(p=>p!=='B').map(p=>[p,p])]},{...port('RIGHT'),options:[['C','C'],...PORTS.filter(p=>p!=='C').map(p=>[p,p])]}],previousStatement:null,nextStatement:null,colour:'#ff4ccd'},
    {type:'lab_drive',message0:'速さ %1 ％で %2 %3 進む 曲がり方 %4',args0:[input('SPEED'),input('AMOUNT'),choice('UNIT',[['cm','cm'],['秒','seconds'],['度（モーター）','degrees']]),input('STEERING')],previousStatement:null,nextStatement:null,inputsInline:true,colour:'#ff4ccd',tooltip:'曲がり方は−100〜100。0は直進、±100はその場で旋回。負の速さで後退します。'},
    {type:'lab_tank',message0:'左を速さ %1 ％ 右を速さ %2 ％で走り続ける',args0:[input('LEFT'),input('RIGHT')],previousStatement:null,nextStatement:null,colour:'#ff4ccd',inputsInline:true},
    {type:'lab_geometry',message0:'タイヤの直径を %1 mm にする',args0:[number('DIAMETER',56,10,200)],previousStatement:null,nextStatement:null,colour:'#ff4ccd'},
    {type:'lab_wait',message0:'%1 秒待つ',args0:[input('SECONDS')],previousStatement:null,nextStatement:null,colour:'#d19636'},
    {type:'lab_wait_until',message0:'%1 まで待つ',args0:[{type:'input_value',name:'BOOL',check:'Boolean'}],previousStatement:null,nextStatement:null,colour:'#d19636'},
    {type:'lab_forever',message0:'ずっと',message1:'%1',args1:[{type:'input_statement',name:'DO'}],previousStatement:null,nextStatement:null,colour:'#d19636'},
    {type:'lab_end',message0:'すべて止めてプログラムを終了',previousStatement:null,colour:'#d19636'},
    {type:'lab_text',message0:'本体に文字 %1 を表示',args0:[{type:'input_value',name:'TEXT'}],previousStatement:null,nextStatement:null,colour:'#965dc0',tooltip:'本体フォントは英数字・記号。日本語は表示できません。'},
    {type:'lab_pixel',message0:'横 %1 縦 %2 のライトを明るさ %3 ％にする',args0:[input('X'),input('Y'),input('BRIGHTNESS')],previousStatement:null,nextStatement:null,inputsInline:true,colour:'#965dc0'},
    {type:'lab_light',message0:'本体のランプを %1 にする',args0:[choice('COLOR',colors)],previousStatement:null,nextStatement:null,colour:'#965dc0'},
    {type:'lab_tone',message0:'音 %1 Hz を %2 秒 鳴らす 音量 %3 ％',args0:[input('HZ'),input('SECONDS'),input('VOLUME')],previousStatement:null,nextStatement:null,inputsInline:true,colour:'#a570b3'},
    ...[['distance','距離センサ %1 の距離（cm）','Number'],['distance_valid','距離センサ %1 が測れている','Boolean'],['color','カラーセンサ %1 の色番号','Number'],['reflection','カラーセンサ %1 の反射光（％）','Number'],['force','フォースセンサ %1 の力（N）','Number'],['pressed','フォースセンサ %1 が押されている','Boolean'],['encoder','モーター %1 の回転角度（度）','Number']].map(([name,message0,output])=>({type:'lab_'+name,message0,args0:[port()],output,colour:'#34bbcc'})),
    {type:'lab_color_is',message0:'カラーセンサ %1 が %2',args0:[port(),choice('COLOR',colors)],output:'Boolean',colour:'#34bbcc'},
    {type:'lab_angle',message0:'本体の %1 角度（度）',args0:[choice('AXIS',[['向き','0'],['前後の傾き','1'],['左右の傾き','2']])],output:'Number',colour:'#34bbcc'},
    {type:'lab_encoder_reset',message0:'モーター %1 の回転角度を0にする',args0:[port()],previousStatement:null,nextStatement:null,colour:'#34bbcc'},
    {type:'lab_button',message0:'本体の %1 ボタンが押されている',args0:[choice('BUTTON',[['左','LEFT'],['右','RIGHT']])],output:'Boolean',colour:'#34bbcc'},
    {type:'lab_timer',message0:'タイマー（秒）',output:'Number',colour:'#34bbcc'},
    {type:'lab_timer_reset',message0:'タイマーを0にする',previousStatement:null,nextStatement:null,colour:'#34bbcc'},
    {type:'lab_yaw_reset',message0:'本体の向きを0にする',previousStatement:null,nextStatement:null,colour:'#34bbcc'},
    {type:'lab_when',message0:'%1 になったとき',args0:[{type:'input_value',name:'BOOL',check:'Boolean'}],nextStatement:null,colour:'#d3a238'},
    {type:'lab_message_hat',message0:'メッセージ %1 を受け取ったとき',args0:[{type:'field_input',name:'MESSAGE',text:'合図'}],nextStatement:null,colour:'#d3a238'},
    {type:'lab_broadcast',message0:'メッセージ %1 を送る',args0:[{type:'field_input',name:'MESSAGE',text:'合図'}],previousStatement:null,nextStatement:null,colour:'#d3a238'}
  ].filter(def=>!['lab_motor','lab_motor_run','lab_motor_stop','lab_drive','lab_tank','lab_tone'].includes(def.type)));
  setupCommon(Blockly);setupReturnBlocks(Blockly);
}
const shadow=(n)=>({shadow:{type:'math_number',fields:{NUM:n}}});
// Older projects and disconnected sensor inputs may have empty comparison sockets.
export function ensureComparisonInputs(workspace) {
  for(const b of workspace.getAllBlocks(false)) {
    if(b.type!=='logic_compare'&&!/^lab_op_(add|sub|mul|div|lt|eq|gt|lte|gte|neq)$/.test(b.type))continue;
    for(const name of ['A','B']) {
      const connection=b.getInput(name)?.connection;
      if(connection&&!connection.targetBlock())connection.setShadowState({type:'math_number',fields:{NUM:0}});
    }
  }
}
const block=(type,values={})=>({kind:'block',type,inputs:Object.fromEntries(Object.entries(values).map(([k,v])=>[k,typeof v==='number'?shadow(v):{shadow:{type:'text',fields:{TEXT:v}}}]))});
export function classroomToolbox(level='standard') {
  return commonToolbox();
}

