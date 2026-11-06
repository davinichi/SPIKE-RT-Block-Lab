// Shared, target-independent program model. No Blockly, DOM or device APIs.
export const VERSION = '0.7.0';
// Official SPIKE-RT v0.2.0 reserves F for the ASP3 debug UART.
export const PORTS = ['A', 'B', 'C', 'D', 'E'];
export const IMAGES = {
  smile: ['00000','01010','00000','10001','01110'],
  heart: ['01010','11111','11111','01110','00100'],
  arrow: ['00100','01110','11111','00100','00100'],
  clear: ['00000','00000','00000','00000','00000']
};
export class ProgramError extends Error {
  constructor(message, blockId) { super(message); this.blockId = blockId; }
}
export function validateProgram(program) {
  if (!program || program.version !== 1 || !Array.isArray(program.body)) throw new ProgramError('プログラムの形式を確認してください。');
  let count = 0;
  const devices = new Map();
  const fail = (message, b) => { throw new ProgramError(message, b?.id); };
  const num = (n, lo, hi, label, b, integer = false) => {
    if (!Number.isFinite(n) || n < lo || n > hi || (integer && !Number.isInteger(n))) fail(`${label}は${lo}〜${hi}${integer ? 'の整数' : ''}にしてください。`, b);
  };
  function device(port, kind, b) {
    if (!PORTS.includes(port)) fail('接続先をA〜Fから選んでください。', b);
    if (devices.has(port) && devices.get(port) !== kind) fail(`ポート${port}に違う種類の機器が指定されています。`, b);
    devices.set(port, kind);
  }
  function visit(body, depth = 0) {
    if (!Array.isArray(body) || depth > 20) fail('ブロックの入れ子は20段までにしてください。');
    for (const b of body) {
      if (!b || typeof b !== 'object' || ++count > 500) fail('ブロックは500個までにしてください。');
      switch (b.type) {
        case 'wait': num(b.seconds, 0, 60, '待つ時間（秒）', b); break;
        case 'image': if (!Object.hasOwn(IMAGES, b.image)) fail('表示する絵を選んでください。', b); break;
        case 'motor':
          device(b.port, 'motor', b); num(b.speed, -360, 360, '回転の速さ（度/秒）', b, true);
          if (b.speed === 0) fail('速さを選んでください。', b);
          num(b.seconds, .1, 30, 'モーターを回す時間（秒）', b); break;
        case 'repeat': num(b.count, 1, 1000, '繰り返す回数', b, true); visit(b.body, depth + 1); break;
        case 'forever': visit(b.body, depth + 1); break;
        case 'ifDistance':
          device(b.port, 'distance', b); num(b.cm, 4, 200, '距離（cm）', b);
          visit(b.then, depth + 1); visit(b.else, depth + 1); break;
        default: fail('対応していない命令があります。', b);
      }
    }
  }
  visit(program.body);
  if (!count) fail('「スタート」の下にブロックをつないでみましょう。');
  return { devices, count };
}
export const BLOCK_TYPES = new Set(['spike_start','spike_wait','spike_image','spike_motor','spike_repeat','spike_forever','spike_if_distance']);
export function validateProject(project) {
  if (project?.format !== 'spike-block-lab' || project.version !== 1 || !project.workspace?.blocks ||
      typeof project.name !== 'string' || project.name.length > 80 || !['basic','standard'].includes(project.language)) throw Error('SPIKE Block Labの作品ファイルを選んでください。');
  let count = 0;
  function visit(x, depth = 0) {
    if (depth > 100) throw Error('作品の入れ子が深すぎます。');
    if (!x || typeof x !== 'object') return;
    if (x.type && (!BLOCK_TYPES.has(x.type) || ++count > 500)) throw Error('未対応のブロック、または500個を超える作品です。');
    for (const child of Object.values(x)) visit(child, depth + 1);
  }
  visit(project.workspace);
  return project;
}
export const SAMPLES = {
  lights: { version: 1, body: [{type:'image',image:'smile'},{type:'wait',seconds:1},{type:'image',image:'heart'},{type:'wait',seconds:1}] },
  motor: { version: 1, body: [{type:'motor',port:'A',speed:90,seconds:1},{type:'wait',seconds:1},{type:'motor',port:'A',speed:-90,seconds:1}] },
  distance: { version: 1, body: [{type:'repeat',count:10,body:[{type:'ifDistance',port:'D',cm:15,then:[{type:'image',image:'heart'}],else:[{type:'image',image:'smile'}]},{type:'wait',seconds:.2}]}] }
};





