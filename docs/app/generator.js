import {generateProject as basicGenerate,validate as basicValidate} from './basic-generator.js';
import {generateAdvanced,validateAdvanced} from './advanced-generator.js';
export function generateProject(p,cdl){return p?.version===2?generateAdvanced(p,cdl,basicGenerate):basicGenerate(p,cdl);}
export function validate(p){return p?.version===2?validateAdvanced(p):basicValidate(p);}
