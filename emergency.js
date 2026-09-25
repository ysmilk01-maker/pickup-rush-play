// A garage vehicle keeps its original seats and FIFO passengers. Only its
// appearance and optional turn-limited bonus mission change.
export const emergencyLimit = level => level < 30 ? 6 : level < 60 ? 5 : 4;
export function beginEmergency(traffic, car) {
  if (traffic.demandVersion < 6 || traffic.state.emergency) return;
  car.emergency = true;
  traffic.state.emergency = {id:car.id,color:car.color,capacity:({taxi:4,van:6,bus:10})[car.type],
    limit:emergencyLimit(traffic.state.levelIndex),remaining:emergencyLimit(traffic.state.levelIndex),
    status:'active',announced:false,resultSeen:false};
}
export function settleEmergency(traffic) {
  const e=traffic.state.emergency;
  if(e?.status==='active' && e.remaining===0 && !traffic.running.length && !traffic.walkers.length && !traffic.arriving.length) e.status='missed';
}
