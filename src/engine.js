// Motor de la Araña Voladora — lógica pura (port del programa ST verificado, 22 pasos)
export const LEG = ["A", "B", "C", "D", "E", "F"];
export const upS   = (pos, i) => pos[i] >= 0.999;   // a1 (final de carrera)
export const downS = (pos, i) => pos[i] <= 0.001;   // a0 (inicio de carrera)

const OUT = [[1,13,19],[3,13,21],[5,15,19],[7,15,21],[9,17,19],[11,17,21]];
export function solenoide(s, i){ return s.sysOn && OUT[i].includes(s.paso); }

export function avanzar(s){
  const U = i => upS(s.pos, i), D = i => downS(s.pos, i);
  switch (s.paso){
    case 1:  if(U(0)) s.paso=2;  break;  case 2:  if(D(0)) s.paso=3;  break;
    case 3:  if(U(1)) s.paso=4;  break;  case 4:  if(D(1)) s.paso=5;  break;
    case 5:  if(U(2)) s.paso=6;  break;  case 6:  if(D(2)) s.paso=7;  break;
    case 7:  if(U(3)) s.paso=8;  break;  case 8:  if(D(3)) s.paso=9;  break;
    case 9:  if(U(4)) s.paso=10; break;  case 10: if(D(4)) s.paso=11; break;
    case 11: if(U(5)) s.paso=12; break;  case 12: if(D(5)) s.paso=13; break;
    case 13: if(U(0)&&U(1)) s.paso=14; break;  case 14: if(D(0)&&D(1)) s.paso=15; break;
    case 15: if(U(2)&&U(3)) s.paso=16; break;  case 16: if(D(2)&&D(3)) s.paso=17; break;
    case 17: if(U(4)&&U(5)) s.paso=18; break;  case 18: if(D(4)&&D(5)) s.paso=19; break;
    case 19: if(U(0)&&U(2)&&U(4)) s.paso=20; break;  case 20: if(D(0)&&D(2)&&D(4)) s.paso=21; break;
    case 21: if(U(1)&&U(3)&&U(5)) s.paso=22; break;  case 22: if(D(1)&&D(3)&&D(5)) s.paso=1;  break;
  }
}

export function step(s, dt){
  if (s.sysOn){ s.tRun += dt; if (s.auto && s.tRun >= s.tauto*1000) s.sysOn = false; }
  else s.tRun = 0;
  if (s.sysOn && s.paso === 0) s.paso = 1;
  if (!s.sysOn) s.paso = 0;
  const v = s.vel * dt / 1000;
  for (let i = 0; i < 6; i++){
    const o = solenoide(s, i) ? 1 : 0;
    if (s.pos[i] < o) s.pos[i] = Math.min(1, s.pos[i] + v);
    else if (s.pos[i] > o) s.pos[i] = Math.max(0, s.pos[i] - v);
  }
  if (s.sysOn) avanzar(s);
}

export const newSim   = () => ({ pos:[0,0,0,0,0,0], sysOn:false, paso:0, emerg:false, tRun:0, vel:0.8, auto:true, tauto:180 });
export const marcha    = s => { if(!s.emerg){ s.sysOn = true; s.tRun = 0; } };
export const paro      = s => { s.sysOn = false; };
export const setaEmerg = s => { s.emerg = !s.emerg; if(s.emerg) s.sysOn = false; };
export const reset     = s => { s.sysOn=false; s.emerg=false; s.paso=0; s.tRun=0; s.pos=[0,0,0,0,0,0]; };
export const modo      = p => p===0 ? "—" : p<=12 ? "1 · una a una" : p<=18 ? "2 · parejas" : "3 · tríos";
