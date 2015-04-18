function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function lerp(v, a, b) {
    return a + (b - a) * v;
}

function unlerp(v, a, b) {
    return (v - a) / (b - a);
}