

function throttle(count, regen, times) {
  let now = Date.now();
  let last = times[count - 1] || 0;
  times.unshift(now);
  times.splice(count);
  let wait = last + regen - now;
  console.log("wait", wait, "times", times.map((t) => now - t ));
  return wait <= 0 ? Promise.resolve(true) : new Promise(function(res, rej) { setTimeout(res, wait, null, true) })
}

module.exports = throttle;
