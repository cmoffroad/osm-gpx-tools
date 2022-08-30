function degToRad(n) {
  return n * (Math.PI / 180);
}
function radToDeg(n) {
  return n * (180 / Math.PI);
}

function getBearingDeg(lat1, lon1, lat2, lon2) {
  const y = Math.sin(lon2-lon1) * Math.cos(lat2);
  const x = Math.cos(lat1)*Math.sin(lat2) -
            Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1);
  const θ = Math.atan2(y, x);
  const b = (θ*180/Math.PI + 360) % 360;
  return b;
}

module.exports = {
  getBearingDeg
}