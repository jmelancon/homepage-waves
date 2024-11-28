/**
 * @typedef {Object} Coordinate
 * @property {int} x
 * @property {int} y
 */

/**
 * A trio of absolute coordinates used for a Béziers plane
 * @typedef {Object} Bezier
 * @property {Coordinate} originHandle
 * @property {Coordinate} destinationHandle
 * @property {Coordinate} destination
 */

/**
 * @typedef {Object} Bounds
 * @property {Coordinate} origin
 * @property {int} width
 * @property {int} height
 */

/**
 * "rasterize" a list of Béziers into a path.
 * @param {Bounds} bounds
 * @param {Coordinate} pathOrigin
 * @param {...Bezier} beziers
 * @returns {string} The path created by the Béziers. As this script
 *                   is written to mimic the PSP wave, the path will
 *                   border the bottom of the bounds specified.
 */
function beziersToPath(bounds, pathOrigin, ...beziers) {
    let output = `M ${pathOrigin.x},${pathOrigin.y} C`;

    beziers.forEach((bezier) => {
        output += ` ${bezier.originHandle.x},${bezier.originHandle.y}`;
        output += ` ${bezier.destinationHandle.x},${bezier.destinationHandle.y}`;
        output += ` ${bezier.destination.x},${bezier.destination.y}`;
    })

    output += ` L ${bounds.origin.x + bounds.width},${bounds.origin.y + bounds.height}`
    output += ` L ${bounds.origin.x},${bounds.origin.y + bounds.height}`
    output += ` L ${pathOrigin.x},${pathOrigin.y}z`


    return output;
}

/** @var {Bounds} defaultBounds */
defaultBounds = {
    origin: {x: 0, y: 0},
    width: 100,
    height: 100,
}

/**
 * Generate the path for a wave
 *
 * ```
 *      /-o-\         h2
 *    o      o        h1/h3
 * o_/        \_o     h0
 * p0 p1  p2 p3 p4
 * ```
 *
 * The above outlines the points in the curve. For
 * simplicity, these will be addressed from p0 to p4.
 * The Y height of the points is given by h0 through h2.
 * All measurements are relative to the center of the bounds.
 *
 * @param {int} amplitude
 * @param {int} tightness
 * @param {int[]} heights
 */
function makeWave(amplitude, tightness = 15, heights){
    // Lay out horizontals.
    const mid = defaultBounds.height / 2 - defaultBounds.origin.y
    const h0 = mid + heights[0]
    const h1 = mid + heights[1]
    const h2 = mid + heights[2]
    const h3 = mid + heights[3]


    // Lay out verticals
    const incr = defaultBounds.width / 4
    const v0 = defaultBounds.origin.x
    const v1 = v0 + incr
    const v2 = v1 + incr
    const v3 = v2 + incr
    const v4 = v3 + incr

    // Set up variance fn
    const isSine = h1 !== h3;
    let a1 = 1
    let a2 = isSine ? 1 : 0
    let a4 = 1
    let handleCount = 0
    function vHandle(coords){
        const x = coords.x + (a2 === 0 ? a1 * (tightness / 5) : (tightness * a1))
        const y = coords.y - (amplitude * a4 * a2 * a1)

        handleCount++

        a1 *= -1

        if (handleCount % 2 === (isSine ? 1 : 1)){
            a2 = a2 === 0 ? 1 : 0
        }

        if (handleCount % 4 === (isSine ? 2 : 0)){
            a4 = a4 * -1
        }

        return {
            x: x,
            y: y
        }
    }

    // Start making each path point.
    /** @var {Coordinate} c0 */
    const c0 = {
        x: v0,
        y: h0
    }

    /** @var {Coordinate} c1 */
    const c1 = {
        x: v1,
        y: h1
    }

    /** @var {Coordinate} c2 */
    const c2 = {
        x: v2,
        y: h2
    }

    /** @var {Coordinate} c3 */
    const c3 = {
        x: v3,
        y: h3
    }

    /** @var {Coordinate} c4 */
    const c4 = {
        x: v4,
        y: h0
    }

    // Create Beziers
    /** @var {Bezier} b0 */
    const b0 = {
        originHandle: vHandle(c0),
        destinationHandle: vHandle(c1),
        destination: c1
    }

    /** @var {Bezier} b1 */
    const b1 = {
        originHandle: vHandle(c1),
        destinationHandle: vHandle(c2),
        destination: c2
    }

    /** @var {Bezier} b2 */
    const b2 = {
        originHandle: vHandle(c2),
        destinationHandle: vHandle(c3),
        destination: c3
    }

    /** @var {Bezier} b3 */
    const b3 = {
        originHandle: vHandle(c3),
        destinationHandle: vHandle(c4),
        destination: c4
    }

    return beziersToPath(defaultBounds, c0, b0, b1, b2, b3);
}

function setTint(){
    const tints = [
        "#FF0000",
        "#00FF00",
        "#0000FF"
    ]

    const newColor = tints[Math.floor(Math.random() * tints.length)];

    document.documentElement.style.setProperty("--tint-color", newColor)
}

/**
 *
 * @param {HTMLElement} domTarget
 * @param {Boolean} isSine
 */
function createWave(domTarget, isSine){
    // Define constants
    const amplitude = 20
    const tightness = 10

    // Set path parameters
    let heights;
    if (isSine){
        heights = [0, amplitude * -1, 0, amplitude];
    } else {
        heights = [amplitude, 0, amplitude * -1, 0];
    }

    // Build path
    const path = makeWave(amplitude, tightness, heights)

    // Set clip
    domTarget.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewBox='0 0 100 100' width='100px' height='100px'%3E%3Cpath d='${path}'/%3E%3C/svg%3E")`
}

window.addEventListener("load", function(){
    const wave1 = document.getElementById("wave1");
    const wave2 = document.getElementById("wave2");
    createWave(wave1, true);
    createWave(wave2, false);
    setTint();
})