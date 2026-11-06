// Capability checks are separate from the unchanged SBL presentation and saved state.
export const IMPLEMENTED_TYPES=new Set([
 'spike_start','spike_image','spike_wait','spike_motor','spike_repeat','spike_forever','spike_if_distance','spike_call','sbl_proc','sbl_parameter','sbl_call_value',
 'lab_motor_single_run','lab_motor_single_angle','lab_motor_single_rotation','lab_motor_single_time','lab_motor_pair_run','lab_motor_pair_angle','lab_motor_pair_rotation','lab_motor_pair_time','lab_motor_group_stop','lab_motor_power','lab_motor_velocity',
 'lab_distance','lab_distance_valid','lab_reflection','lab_ambient','lab_force','lab_pressed','lab_encoder','lab_encoder_reset','lab_button','lab_timer','lab_timer_reset','lab_battery_voltage','lab_distance_compare','lab_reflection_compare','lab_force_compare',
 'lab_wait','lab_wait_until','lab_forever','lab_end','lab_return','controls_if','controls_repeat_ext','controls_whileUntil',
 'math_number','math_arithmetic','math_single','math_trig','math_round','math_modulo','math_constrain','math_constant','logic_compare','logic_operation','logic_negate','logic_boolean',
 ...['add','sub','mul','div','lt','eq','gt','lte','gte','neq','and','or'].map(x=>'lab_op_'+x),'lab_math_function','lab_minmax',
 'lab_display_clear','lab_display_number','lab_pixel','lab_text','text','lab_light','lab_light_off','lab_tone_ms','lab_sound_stop',
 'variables_get','variables_set','math_change','procedures_defnoreturn','procedures_defreturn','procedures_callnoreturn','procedures_callreturn','lab_argument','lab_return_value','lab_return_values','lab_call_outputs'
]);
export function blockIssue(b){
 const message=reason=>({id:b.id,type:b.type,message:reason+' ['+b.type+']'});
 if(!IMPLEMENTED_TYPES.has(b.type))return message('SPIKE-RT未対応です。編集・保存・読込はできますが、C生成はできません');
 for(const name of ['PORT','PORTS','LEFT','RIGHT'])if(String(b.getFieldValue(name)??'').split(',').includes('F'))return message('ポートFはデバッグ用のため使えません。A〜Eへ変更してください');
 if(['procedures_defnoreturn','procedures_defreturn'].includes(b.type)&&b.getVarModels().length>2)return message('SPIKE-RTの引数は２個までです');
 if((b.returnNames_??[]).length>1)return message('SPIKE-RTの戻り値は１個までです');
 if(b.type==='procedures_callreturn'&&Number(b.getFieldValue('RESULT')??0)!==0)return message('SPIKE-RTでは戻り値１個目だけを使えます');
 if(['variables_set','math_change'].includes(b.type)){const root=b.getRootBlock(),id=b.getField('VAR')?.getVariable()?.getId();if(root.getVarModels?.().some(m=>m.getId()===id))return message('引数への代入はSPIKE-RT未対応です。通常の変数を使ってください');}
 if(['lab_light','lab_light_blink','lab_light_pulse'].includes(b.type)&&['BLACK','UNKNOWN'].includes(b.getFieldValue('COLOR')))return message('このランプ色はSPIKE-RT未対応です');
 if(b.type==='math_constant'&&b.getFieldValue('CONSTANT')==='INFINITY')return message('無限大定数はSPIKE-RT未対応です');
 if(b.type==='lab_text'&&b.getInputTargetBlock('TEXT')?.type!=='text')return message('SPIKE-RTの文字表示は定数文字列だけに対応しています');
 if(b.type==='lab_text'&&/[^\x20-\x7e]/.test(b.getInputTargetBlock('TEXT')?.getFieldValue('TEXT')??''))return message('SPIKE-RTの文字表示はASCII英数字・記号だけに対応しています');
 return null;
}
export const supportIssues=ws=>ws.getAllBlocks(false).map(blockIssue).filter(Boolean);
export function annotateSupport(ws){
 for(const b of ws.getAllBlocks(false)){const issue=blockIssue(b);b.setWarningText?.(issue?.message??null,'spike-rt-capability');}
 return supportIssues(ws);
}
