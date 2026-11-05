import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {generateProject} from './web/generator.js';
const out=process.argv[2]??'generated';const cdl=await readFile(new URL('./web/rt-template.cdl',import.meta.url),'utf8');
const samples={display:{version:1,body:[{type:'image',image:'heart'},{type:'wait',seconds:1},{type:'image',image:'smile'}]},motor:{version:1,body:[{type:'motor',port:'A',speed:90,seconds:1}]},distance:{version:1,body:[{type:'repeat',count:100,body:[{type:'ifDistance',port:'D',cm:15,then:[{type:'image',image:'heart'}],else:[{type:'image',image:'smile'}]},{type:'wait',seconds:.1}]}]},myblock:{version:1,body:[{type:'call',name:'表示'}],procedures:[{name:'表示',body:[{type:'image',image:'heart'}]}]}};
for(const [name,program]of Object.entries(samples)){const dir=path.join(out,name);await mkdir(dir,{recursive:true});for(const [file,text]of Object.entries(generateProject(program,cdl)))await writeFile(path.join(dir,file),text);}
console.log('Exported '+Object.keys(samples).join(', '));
