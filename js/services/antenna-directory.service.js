import { getAllAntennas, saveAntennas } from '../repositories/antennas.repository.js';
import { mergeAntennaDirectory } from '../data/antennas.js';
export function syncAntennaDirectory(){
 const previous=getAllAntennas(),next=mergeAntennaDirectory(previous);
 if(JSON.stringify(previous)!==JSON.stringify(next))saveAntennas(next);
 return next;
}
