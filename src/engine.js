// Flying Spider engine — pure logic (port of the verified ST program, 22 steps)
export const LEG = ["A", "B", "C", "D", "E", "F"];
export const upS   = (pos, i) => pos[i] >= 0.999;   // a1 (extended limit switch)
export const downS = (pos, i) => pos[i] <= 0.001;   // a0 (retracted limit switch)

const OUT = [[1,13,19],[3,13,21],[5,15,19],[7,15,21],[9,17,19],[11,17,21]];
export function solenoid(s, i){ return s.sysOn && OUT[i].includes(s.step); }

export function advance(s){
  const U = i => upS(s.pos, i), D = i => downS(s.pos, i);
  switch (s.step){
    case 1:  if(U(0)) s.step=2;  break;  case 2:  if(D(0)) s.step=3;  break;
    case 3:  if(U(1)) s.step=4;  break;  case 4:  if(D(1)) s.step=5;  break;
    case 5:  if(U(2)) s.step=6;  break;  case 6:  if(D(2)) s.step=7;  break;
    case 7:  if(U(3)) s.step=8;  break;  case 8:  if(D(3)) s.step=9;  break;
    case 9:  if(U(4)) s.step=10; break;  case 10: if(D(4)) s.step=11; break;
    case 11: if(U(5)) s.step=12; break;  case 12: if(D(5)) s.step=13; break;
    case 13: if(U(0)&&U(1)) s.step=14; break;  case 14: if(D(0)&&D(1)) s.step=15; break;
    case 15: if(U(2)&&U(3)) s.step=16; break;  case 16: if(D(2)&&D(3)) s.step=17; break;
    case 17: if(U(4)&&U(5)) s.step=18; break;  case 18: if(D(4)&&D(5)) s.step=19; break;
    case 19: if(U(0)&&U(2)&&U(4)) s.step=20; break;  case 20: if(D(0)&&D(2)&&D(4)) s.step=21; break;
    case 21: if(U(1)&&U(3)&&U(5)) s.step=22; break;  case 22: if(D(1)&&D(3)&&D(5)) s.step=1;  break;
  }
}

export function tick(s, dt){
  if (s.sysOn){ s.tRun += dt; if (s.auto && s.tRun >= s.autoStop*1000) s.sysOn = false; }
  else s.tRun = 0;
  if (s.sysOn && s.step === 0) s.step = 1;
  if (!s.sysOn) s.step = 0;
  const v = s.speed * dt / 1000;
  for (let i = 0; i < 6; i++){
    const o = solenoid(s, i) ? 1 : 0;
    if (s.pos[i] < o) s.pos[i] = Math.min(1, s.pos[i] + v);
    else if (s.pos[i] > o) s.pos[i] = Math.max(0, s.pos[i] - v);
  }
  if (s.sysOn) advance(s);
}

export const newSim = () => ({ pos:[0,0,0,0,0,0], sysOn:false, step:0, emerg:false, tRun:0, speed:0.8, auto:true, autoStop:180 });
export const start  = s => { if(!s.emerg){ s.sysOn = true; s.tRun = 0; } };
export const stop   = s => { s.sysOn = false; };
export const eStop  = s => { s.emerg = !s.emerg; if(s.emerg) s.sysOn = false; };
export const reset  = s => { s.sysOn=false; s.emerg=false; s.step=0; s.tRun=0; s.pos=[0,0,0,0,0,0]; };
export const mode   = p => p===0 ? "—" : p<=12 ? "1 · one at a time" : p<=18 ? "2 · pairs" : "3 · trios";
