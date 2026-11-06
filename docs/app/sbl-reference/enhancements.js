// EBL classroom behaviour, implemented with the standard SPIKE App 3 API.
const input=(name,check='Number')=>({type:'input_value',name,...(check?{check}:{})});
const menu=(name,options)=>({type:'field_dropdown',name,options});
const ports=['A','B','C','D','E','F'];
const port=()=>menu('PORT',ports.map(p=>[p,p]));
const stmt={previousStatement:null,nextStatement:null,inputsInline:true};
const defs=[];
const add=(type,message0,args0,properties)=>defs.push({type,message0,args0,...properties});
const operators={add:['＋','+','Number'],sub:['−','-','Number'],mul:['×','*','Number'],div:['÷','/','Number'],lt:['＜','<','Boolean'],eq:['＝','==','Boolean'],gt:['＞','>','Boolean'],lte:['≦','<=','Boolean'],gte:['≧','>=','Boolean'],neq:['≠','!=','Boolean'],and:['かつ','and','Boolean'],or:['または','or','Boolean']};
for(const [op,[label,,output]] of Object.entries(operators))add('lab_op_'+op,'%1 '+label+' %2',[input('A',['and','or'].includes(op)?'Boolean':'Number'),input('B',['and','or'].includes(op)?'Boolean':'Number')],{output,inputsInline:true,colour:'#00b84a'});
const modes=menu('MODE',[['ブレーキ','BRAKE'],['惰性','COAST'],['保持','HOLD']]);
add('lab_battery_voltage','本体のバッテリー電圧（mV）',[],{output:'Number',colour:'#34ccf1',tooltip:'本体の電圧をmVで読みます。1000mV＝1V。対応する標準Hub OSで使用できます。'});
add('lab_display_abacus','数値 %1 をそろばん形式で表示',[input('VALUE')],{...stmt,colour:'#9966ff',tooltip:'0〜99999の整数を右詰めで表示。1列が1桁で、最上段は5、下4段は1の玉です。0の桁は点灯しません。'});
add('lab_motor_velocity','モーター %1 の実際の速さ（度/秒）',[port()],{output:'Number',colour:'#0090f5'});
add('lab_motor_stop_mode','モーター %1 の動作後の停止を %2 にする',[menu('PORTS',[...ports.map(p=>[p,p]),['すべて','ALL']]),modes],{...stmt,colour:'#0090f5'});
add('lab_motor_change_speed','モーター %1 の速さを %2 ％に変える',[port(),input('SPEED')],{...stmt,colour:'#0090f5',tooltip:'動作中の目標角度・終了時刻を保ったまま速さを変えます。0は一時停止。'});
add('lab_motor_power','モーター %1 をパワー %2 ％で回し続ける',[port(),input('POWER')],{...stmt,colour:'#0090f5',tooltip:'−100〜100％の出力。負荷に合わせた速さの補正はしません。'});
add('lab_ramp','加減速を %1 にする 加速 %2 秒 減速 %3 秒',[menu('PROFILE',[['なし','none'],['台形','trapezoid'],['S字','s']]),input('UP'),input('DOWN')],{...stmt,colour:'#0090f5',tooltip:'以降に始めるモーター・動きに適用。短い移動では最高速度に達する前に減速します。'});
add('lab_sync','2個のモーターの同期補正を %1 にする',[menu('ENABLED',[['有効','TRUE'],['無効','FALSE']])],{...stmt,colour:'#0090f5',tooltip:'エンコーダの進み具合を20ミリ秒周期で比較します。タイヤの滑りや車体の方位は補正しません。'});
const funcs=[['絶対値','abs'],['切り下げ','floor'],['切り上げ','ceil'],['平方根','sqrt'],['sin','sin'],['cos','cos'],['tan','tan'],['asin','asin'],['acos','acos'],['atan','atan'],['ln','ln'],['log','log'],['e^','exp'],['10^','pow10']];
add('lab_math_function','%1 の %2',[input('VALUE'),menu('FUNCTION',funcs)],{output:'Number',inputsInline:true,colour:'#00b84a',tooltip:'三角関数は度で指定。逆三角関数の答えも度です。'});
add('lab_minmax','%1 と %2 の %3',[input('A'),input('B'),menu('OP',[['小さい方','min'],['大きい方','max']])],{output:'Number',inputsInline:true,colour:'#00b85b'});
for(const [type,label,args,output] of [
 ['char','文字 %1 の %2 番目',[input('TEXT',null),input('INDEX')],'String'],
 ['contains','文字 %1 に %2 が含まれる',[input('TEXT',null),input('FIND',null)],'Boolean'],
 ['equal','文字 %1 と %2 が同じ',[input('TEXT',null),input('OTHER',null)],'Boolean'],
 ['to_number','文字 %1 を数値にする',[input('TEXT',null)],'Number'],
 ['from_number','数値 %1 を文字にする',[input('VALUE')],'String']
])add('lab_string_'+type,label,args,{output,inputsInline:true,colour:'#00b85b'});
for(const kind of ['blink','pulse'])add('lab_light_'+kind,'本体のランプを %1 で'+(kind==='blink'?'点滅':'ゆっくり明暗')+' 周期 %2 秒',[menu('COLOR',[['赤','RED'],['黄','YELLOW'],['緑','GREEN'],['青','BLUE'],['白','WHITE']]),input('SECONDS')],{...stmt,colour:'#9966ff'});
export const EXTRA_TYPES=defs.map(d=>d.type);
const n=x=>({shadow:{type:'math_number',fields:{NUM:x}}}),t=x=>({shadow:{type:'text',fields:{TEXT:x}}});
const b=(type,inputs={})=>({kind:'block',type,inputs:Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,typeof v==='number'?n(v):t(v)]))});
export function extraPalette(group){return {
 motor:[b('lab_motor_velocity'),b('lab_motor_stop_mode'),b('lab_motor_change_speed',{SPEED:20}),b('lab_motor_power',{POWER:20})],
 operators:Object.keys(operators).map(op=>['and','or'].includes(op)?{kind:'block',type:'lab_op_'+op,inputs:{A:{shadow:{type:'logic_boolean',fields:{BOOL:'FALSE'}}},B:{shadow:{type:'logic_boolean',fields:{BOOL:'FALSE'}}}}}:b('lab_op_'+op,{A:0,B:['add','sub','mul','div'].includes(op)?1:100})),
 ramp:[b('lab_ramp',{UP:1,DOWN:1}),b('lab_sync')],
 math:[b('lab_math_function',{VALUE:1}),b('lab_minmax',{A:1,B:2})],
 text:[b('lab_string_char',{TEXT:'Hello',INDEX:1}),b('lab_string_contains',{TEXT:'Hello',FIND:'ell'}),b('lab_string_equal',{TEXT:'Hello',OTHER:'Hello'}),b('lab_string_to_number',{TEXT:'12.5'}),b('lab_string_from_number',{VALUE:12.5})],
 lamp:[b('lab_light_blink',{SECONDS:1}),b('lab_light_pulse',{SECONDS:2})]
}[group]??[];}
export function setupEnhancements(Blockly){
 Blockly.Msg.CONTROLS_IF_MSG_THEN='';Blockly.Msg.CONTROLS_IF_MSG_ELSE='';Blockly.Msg.CONTROLS_IF_MSG_ELSEIF='でなければ、もし';Blockly.Msg.CONTROLS_REPEAT_INPUT_DO='';
 Blockly.defineBlocksWithJsonArray(defs);
 const footer=b=>{if(!b.getInput('LAB_LOOP_ICON'))b.appendDummyInput('LAB_LOOP_ICON').setAlign(Blockly.inputs.Align.RIGHT).appendField('↻');};
 const shape=b=>{b.setColour('#f5a400');b.setInputsInline(true);for(let i=0;b.getInput('IF'+i);i++){const name='LAB_THEN_'+i;if(!b.getInput(name)){b.appendDummyInput(name).appendField('なら');b.moveInputBefore(name,'DO'+i);}}if(b.getInput('ELSE')&&!b.getInput('LAB_ELSE_LABEL')){b.appendDummyInput('LAB_ELSE_LABEL').appendField('でなければ');b.moveInputBefore('LAB_ELSE_LABEL','ELSE');}};
 const orig=Blockly.Blocks.controls_if._labShapeInit??Blockly.Blocks.controls_if.init;Blockly.Blocks.controls_if._labShapeInit=orig;
 Blockly.Blocks.controls_if.init=function(){orig.call(this);this.setMutator(null);const update=this.updateShape_;this.updateShape_=function(){for(const i of [...this.inputList])if(i.name.startsWith('LAB_THEN_')||i.name==='LAB_ELSE_LABEL')this.removeInput(i.name);update.call(this);shape(this);};shape(this);};
 Blockly.Blocks.controls_whileUntil.init=function(){this.jsonInit({message0:'%1 %2',args0:[input('BOOL','Boolean'),menu('MODE',[['まで繰り返す','UNTIL'],['の間繰り返す','WHILE']])],message1:'%1',args1:[{type:'input_statement',name:'DO'}],...stmt,colour:'#f5a400'});footer(this);};
 for(const type of ['controls_repeat_ext','lab_forever']){const orig=Blockly.Blocks[type]._labShapeInit??Blockly.Blocks[type].init;Blockly.Blocks[type]._labShapeInit=orig;Blockly.Blocks[type].init=function(){orig.call(this);this.setInputsInline(true);footer(this);};}
}
export function checkMessageCycles(hats,workspace,fail){
 const edges=new Map();
 const waits=(root,seen=new Set())=>{const result=new Set();for(const b of root.getDescendants(false)){if(!b.isEnabled())continue;if(b.type==='lab_message_wait')result.add(b.getFieldValue('MESSAGE').trim());if(['procedures_callnoreturn','procedures_callreturn','lab_call_outputs'].includes(b.type)){const name=b.getProcedureCall();if(!seen.has(name)){seen.add(name);const d=workspace.getAllBlocks(false).find(d=>['procedures_defnoreturn','procedures_defreturn'].includes(d.type)&&d.getFieldValue('NAME')===name);if(d)for(const m of waits(d,seen))result.add(m);}}}return result;};
 for(const h of hats.filter(h=>h.type==='lab_message_hat')){const name=h.getFieldValue('MESSAGE').trim();const set=edges.get(name)??new Set();for(const m of waits(h))set.add(m);edges.set(name,set);}
 const visit=(name,path)=>{if(path.has(name))fail(hats.find(h=>h.type==='lab_message_hat'&&h.getFieldValue('MESSAGE').trim()===name),'メッセージを送って待つ処理が循環しています。');for(const next of edges.get(name)??[])visit(next,new Set([...path,name]));};
 for(const name of edges.keys())visit(name,new Set());
}
export function registerEnhancements({g,emit,v,stat}){
 const p=b=>'port.'+b.getFieldValue('PORT');
 emit('lab_battery_voltage',()=>['_lab_battery_voltage()',g.ORDER_ATOMIC]);
 emit('lab_display_abacus',b=>stat(`_lab_display_abacus(${v(b,'VALUE')})\n`));
 for(const [op,[,symbol]] of Object.entries(operators))emit('lab_op_'+op,b=>[`((${v(b,'A',['and','or'].includes(op)?'False':'0')}) ${symbol} (${v(b,'B',['and','or'].includes(op)?'False':'0')}))`,g.ORDER_ATOMIC]);
 emit('math_round',b=>{const op=b.getFieldValue('OP');return [op==='ROUND'?`math.floor((${v(b,'NUM')}) + 0.5)`:`math.${op==='ROUNDUP'?'ceil':'floor'}(${v(b,'NUM')})`,g.ORDER_ATOMIC];});
 emit('lab_math_function',b=>[`_lab_math(${JSON.stringify(b.getFieldValue('FUNCTION'))}, ${v(b,'VALUE')})`,g.ORDER_ATOMIC]);
 emit('lab_minmax',b=>[`${b.getFieldValue('OP')}(${v(b,'A')}, ${v(b,'B')})`,g.ORDER_ATOMIC]);
 for(const kind of ['char','contains','equal','to_number','from_number'])emit('lab_string_'+kind,b=>[`_lab_string_op('${kind}', ${v(b,kind==='from_number'?'VALUE':'TEXT')}, ${kind==='char'?v(b,'INDEX'):kind==='contains'?v(b,'FIND'):kind==='equal'?v(b,'OTHER'):'0'})`,g.ORDER_ATOMIC]);
 emit('lab_motor_velocity',b=>[`motor.velocity(${p(b)})`,g.ORDER_ATOMIC]);
 emit('lab_motor_stop_mode',b=>stat((b.getFieldValue('PORTS')==='ALL'?['A','B','C','D','E','F']:[b.getFieldValue('PORTS')]).map(p=>`_lab_stop_modes[port.${p}] = motor.${b.getFieldValue('MODE')}\n`).join('')));
 emit('lab_motor_change_speed',b=>stat(`_lab_change_speed(${p(b)}, ${v(b,'SPEED')})\n`));
 emit('lab_motor_power',b=>stat(`_lab_power(${p(b)}, ${v(b,'POWER')})\n`));
 emit('lab_ramp',b=>stat(`_lab_set_ramp('${b.getFieldValue('PROFILE')}', ${v(b,'UP')}, ${v(b,'DOWN')})\n`));
 emit('lab_sync',b=>stat(`_lab_motion_config['sync'] = ${b.getFieldValue('ENABLED')==='TRUE'?'True':'False'}\n`));
 for(const kind of ['blink','pulse'])emit('lab_light_'+kind,b=>stat(`_lab_lamp_start('${kind}', color.${b.getFieldValue('COLOR')}, ${v(b,'SECONDS')})\n`));
 emit('lab_light',b=>stat(`_lab_lamp.clear()\nlight.color(light.POWER, color.${b.getFieldValue('COLOR')})\n`));
 emit('lab_light_off',()=>stat('_lab_lamp.clear()\nlight.color(light.POWER, color.BLACK)\n'));
}
export const EXTRA_RUNTIME=String.raw`
_lab_stop_modes = {}
_lab_active_motors = {}
_lab_motion_config = {'profile': 'none', 'up': 0, 'down': 0, 'sync': True}
_lab_lamp = {}
_lab_log = {}

def _lab_battery_voltage():
    import hub
    read = getattr(hub, 'battery_voltage', None)
    if read is None:
        raise RuntimeError('This Hub OS does not support hub.battery_voltage()')
    return read()

def _lab_display_abacus(value):
    if not isinstance(value, (int, float)) or not 0 <= value <= 99999 or value != int(value):
        raise ValueError('Abacus display needs an integer from 0 to 99999')
    digits = str(int(value))
    start_x = 5 - len(digits)
    light_matrix.clear()
    for i in range(len(digits)):
        digit = int(digits[i])
        x = start_x + i
        if digit >= 5:
            light_matrix.set_pixel(x, 0, 100)
            digit -= 5
        for y in range(digit):
            light_matrix.set_pixel(x, y + 1, 100)

def _lab_string(value):
    text = str(value)
    if len(text.encode('utf-8')) > 120:
        raise ValueError('Text exceeds 120 UTF-8 bytes')
    return text

def _lab_string_op(op, value, extra):
    if op == 'from_number':
        return _lab_string(value)
    text = _lab_string(value)
    if op == 'char':
        if extra != int(extra) or not 1 <= extra <= len(text):
            raise ValueError('Character index out of range')
        return text[int(extra) - 1]
    if op == 'contains':
        return str(extra) in text
    if op == 'equal':
        return text == str(extra)
    result = float(text)
    return _lab_range(result, -1e12, 1e12)

def _lab_math(op, x):
    if op in ('sin', 'cos', 'tan'):
        return getattr(math, op)(x * math.pi / 180)
    if op in ('asin', 'acos', 'atan'):
        return getattr(math, op)(x) * 180 / math.pi
    if op == 'pow10':
        return 10 ** x
    if op == 'abs':
        return abs(x)
    return getattr(math, 'log' if op == 'ln' else 'log10' if op == 'log' else op)(x)

def _lab_send(name):
    _lab_messages[name] += 1
    return _lab_messages[name]

async def _lab_send_wait(name):
    token = _lab_send(name)
    while any(_lab_message_done.get(i, 0) < token for i in _lab_receivers[name]):
        await _lab_tick()

def _lab_set_ramp(profile, up, down):
    _lab_motion_config.update({'profile': profile, 'up': _lab_range(up, 0, 60), 'down': _lab_range(down, 0, 60)})

def _lab_shape(x, profile):
    x = max(0, min(1, x))
    return x * x * (3 - 2 * x) if profile == 's' else x

def _lab_change_speed(p, speed):
    velocity = _lab_speed(speed)
    state = _lab_active_motors.get(p)
    if state is None:
        raise ValueError('Motor is not running')
    if state.get('bounded') and velocity and state['direction'] * velocity < 0:
        raise ValueError('Cannot reverse a bounded movement')
    state['velocity'] = velocity

def _lab_power(p, power):
    _lab_active_motors.pop(p, None)
    motor.set_duty_cycle(p, int(_lab_range(power, -100, 100) * 100))

def _lab_motor_group_run(ports, speed):
    _lab_start_velocities(ports, [_lab_speed(speed)] * len(ports))

def _lab_stop_port(p, mode, optional=False):
    _lab_active_motors.pop(p, None)
    try:
        motor.stop(p, stop=mode)
    except Exception:
        if not optional:
            raise

async def _lab_managed_move(ports, velocities, amount, unit):
    _lab_positive(amount, 3600 if unit == 'time' else 360000)
    if any(p in _lab_active_motors and _lab_active_motors[p].get('bounded') for p in ports):
        raise ValueError('Motor already has an active bounded movement')
    maximum = max(abs(v) for v in velocities)
    if not maximum:
        raise ValueError('Speed cannot be zero')
    degrees = amount * (360 if unit == 'rotation' else 1)
    started = time.ticks_ms()
    timeout = int(amount * 1000) if unit == 'time' else 600000
    states = []
    for p, velocity in zip(ports, velocities):
        state = {'velocity': velocity, 'direction': 1 if velocity >= 0 else -1, 'start': started, 'position': motor.relative_position(p), 'bounded': True}
        _lab_active_motors[p] = state
        states.append(state)
    try:
        while True:
            if any(_lab_active_motors.get(p) is not s for p, s in zip(ports, states)):
                raise ValueError('Movement was interrupted by another motor command')
            elapsed = time.ticks_diff(time.ticks_ms(), started)
            progress = [abs(motor.relative_position(p) - s['position']) for p, s in zip(ports, states)]
            targets = [degrees * abs(v) / maximum for v in velocities]
            if (unit == 'time' and elapsed >= timeout) or (unit != 'time' and all(pos >= target for pos, target in zip(progress, targets))):
                break
            if unit != 'time' and elapsed >= timeout:
                raise RuntimeError('Motor movement timed out')
            config = _lab_motion_config
            profile, up, down = config['profile'], config['up'], config['down']
            normalized = [pos / abs(v) if v else 0 for pos, v in zip(progress, velocities)]
            reference = sum(normalized) / len(normalized) if all(velocities) else 0
            for p, s, pos, target, base, phase in zip(ports, states, progress, targets, velocities, normalized):
                velocity = s['velocity']
                scale = 1
                if profile != 'none':
                    scale = _lab_shape(elapsed / (up * 1000), profile) if up else 1
                    if down:
                        remaining = max(0, (timeout - elapsed) / 1000) if unit == 'time' else max(0, target - pos) / max(1, abs(velocity))
                        scale = min(scale, _lab_shape(remaining / down, profile))
                command = velocity * scale
                if velocity and scale < 0.05:
                    command = (1 if velocity > 0 else -1) * min(abs(velocity), 30)
                if config['sync'] and all(velocities) and command:
                    correction = max(-0.2, min(0.2, (phase - reference) * 2))
                    command *= 1 - correction
                if unit != 'time' and pos >= target:
                    command = 0
                if command:
                    motor.run(p, int(max(-1050, min(1050, command))))
                else:
                    motor.stop(p, stop=motor.BRAKE)
            await runloop.sleep_ms(20)
    finally:
        for p, state in zip(ports, states):
            if _lab_active_motors.get(p) is state:
                _lab_active_motors.pop(p, None)
                motor.stop(p, stop=_lab_stop_modes.get(p, motor.BRAKE))

async def _lab_motor_group(ports, speed, amount, unit):
    await _lab_managed_move(ports, [_lab_speed(speed)] * len(ports), amount, unit)

def _lab_start_velocities(ports, velocities):
    now = time.ticks_ms()
    group = []
    for p, velocity in zip(ports, velocities):
        s = {'velocity': int(velocity), 'direction': 1 if velocity >= 0 else -1, 'start': now, 'position': motor.relative_position(p), 'bounded': False, 'group': group}
        _lab_active_motors[p] = s
        group.append((p, s))
        motor.run(p, int(velocity) if _lab_motion_config['profile'] == 'none' else 0)

def _lab_steering_run(left, right, turn, speed, amount):
    _lab_pair(left, right)
    _lab_start_velocities((left, right), _lab_steering_velocities(speed, turn))

def _lab_tank_run(left, right, left_speed, right_speed, amount):
    _lab_pair(left, right)
    _lab_start_velocities((left, right), (-_lab_speed(left_speed), _lab_speed(right_speed)))

_lab_native_drive = _lab_drive
_lab_native_turn = _lab_turn
_lab_native_pair = _lab_pair
_lab_pair_ports = None

def _lab_pair(left, right):
    global _lab_pair_ports, _lab_pair_ready
    if left == right:
        raise ValueError('Choose two different motor ports')
    if _lab_pair_ports == (left, right):
        return
    if _lab_pair_ports is not None:
        motor_pair.unpair(motor_pair.PAIR_1)
        _lab_pair_ports = None
        _lab_pair_ready = False
    _lab_native_pair(left, right)
    _lab_pair_ports = (left, right)

def _lab_motion_ports():
    _lab_require_pair()
    return _lab_pair_ports

def _lab_set_motion_pair(left, right):
    if left == right:
        raise ValueError('Choose two different motor ports')
    if _lab_pair_ports is not None and _lab_pair_ports != (left, right):
        for p in _lab_pair_ports:
            _lab_stop_port(p, motor.BRAKE)
    _lab_pair(left, right)

def _lab_use_managed():
    return _lab_motion_config.get('managed', False) or _lab_motion_config['profile'] != 'none' or any(p in _lab_stop_modes for p in _lab_pair_ports)

def _lab_steering_velocities(speed, turn):
    v = _lab_speed(speed)
    t = _lab_range(turn, -100, 100)
    # Motors are mirrored on the standard drive base.
    return (-v if t <= 0 else -v * (1 - t / 50), v if t >= 0 else v * (1 + t / 50))

async def _lab_drive(speed, amount, unit, steering):
    _lab_require_pair()
    if not _lab_use_managed():
        return await _lab_native_drive(speed, amount, unit, steering)
    degrees = amount * 10 * 360 / (math.pi * _lab_wheel) if unit == 'cm' else amount
    await _lab_managed_move(_lab_pair_ports, _lab_steering_velocities(speed, steering), degrees, 'time' if unit == 'seconds' else 'angle')

async def _lab_turn(left, right, speed, angle, pivot, direction):
    _lab_pair(left, right)
    if not _lab_use_managed():
        return await _lab_native_turn(left, right, speed, angle, pivot, direction)
    velocity = _lab_speed(speed)
    if velocity == 0:
        raise ValueError('Speed cannot be zero')
    degrees = _lab_positive(angle, 3600) * _lab_tread / _lab_wheel * (2 if pivot else 1)
    lv, rv = (velocity, 0 if pivot else -velocity) if direction > 0 else (0 if pivot else -velocity, velocity)
    await _lab_managed_move((left, right), (-lv, rv), degrees, 'angle')

async def _lab_tank_angle(left, right, left_speed, right_speed, amount):
    _lab_pair(left, right)
    await _lab_managed_move((left, right), (-_lab_speed(left_speed), _lab_speed(right_speed)), amount, 'angle')

async def _lab_tank_time(left, right, left_speed, right_speed, amount):
    _lab_pair(left, right)
    await _lab_managed_move((left, right), (-_lab_speed(left_speed), _lab_speed(right_speed)), amount, 'time')

def _lab_lamp_start(kind, colour, seconds):
    _lab_lamp.update({'kind': kind, 'colour': colour, 'period': int(_lab_range(seconds, 0.1, 60) * 1000), 'start': time.ticks_ms()})

async def _lab_service():
    while _lab_task_count[0]:
        now = time.ticks_ms()
        for p, s in list(_lab_active_motors.items()):
            if not s['bounded']:
                c = _lab_motion_config
                scale = _lab_shape(time.ticks_diff(now, s['start']) / (c['up'] * 1000), c['profile']) if c['profile'] != 'none' and c['up'] else 1
                correction = 0
                group = s.get('group', [])
                if c['sync'] and len(group) == 2 and all(_lab_active_motors.get(q) is other and other['velocity'] for q, other in group):
                    phases = [abs(motor.relative_position(q) - other['position']) / abs(other['velocity']) for q, other in group]
                    phase = abs(motor.relative_position(p) - s['position']) / abs(s['velocity'])
                    correction = max(-0.2, min(0.2, (phase - sum(phases) / len(phases)) * 2))
                motor.run(p, int(max(-1050, min(1050, s['velocity'] * scale * (1 - correction)))))
        if _lab_lamp:
            phase = time.ticks_diff(now, _lab_lamp['start']) % _lab_lamp['period'] / _lab_lamp['period']
            if _lab_lamp['kind'] == 'blink':
                light.color(light.POWER, _lab_lamp['colour'] if phase < 0.5 else color.BLACK)
            else:
                # Standard hub.light exposes discrete colours only. Temporal
                # dithering gives a software brightness envelope without HSV.
                duty = (1 - math.cos(2 * math.pi * phase)) / 2
                accumulator = _lab_lamp.get('accumulator', 0) + duty
                light.color(light.POWER, _lab_lamp['colour'] if accumulator >= 1 else color.BLACK)
                _lab_lamp['accumulator'] = accumulator % 1
        await runloop.sleep_ms(5 if _lab_lamp.get('kind') == 'pulse' else 20)

async def _lab_track(task):
    try:
        await task()
    finally:
        _lab_task_count[0] -= 1

def _lab_log_start(name):
    _lab_log_end()
    if not name or len(name) > 31 or any(not ('a' <= c <= 'z' or 'A' <= c <= 'Z' or '0' <= c <= '9' or c in '-_') for c in name):
        raise ValueError('CSV name: 1-31 letters, digits, - or _')
    try:
        f = open('/sbl_' + name + '.csv', 'w')
        f.write('time_s,label,value\n')
        f.flush()
    except Exception:
        raise RuntimeError('Hub file storage unavailable; CSV was not started')
    _lab_log.update({'file': f, 'start': time.ticks_ms(), 'rows': 0})

def _lab_log_value(label, value):
    if not _lab_log:
        raise ValueError('Start recording first')
    if _lab_log['rows'] >= 5000:
        raise ValueError('CSV has 5000 rows')
    line = str(time.ticks_diff(time.ticks_ms(), _lab_log['start']) / 1000) + ',' + _lab_csv(_lab_string(label)) + ',' + _lab_csv(_lab_string(value)) + '\n'
    _lab_log['file'].write(line)
    _lab_log['file'].flush()
    _lab_log['rows'] += 1

def _lab_log_end():
    f = _lab_log.pop('file', None)
    _lab_log.clear()
    if f is not None:
        f.close()
`;
