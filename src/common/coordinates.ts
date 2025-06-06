import type { Coordinate, PointTuple } from "../@types/coordinates.js"
import {
    degreesFullCircle,
    degreesHalfCircle,
    degreesQuarterCircle,
    mapSize,
    speedFactor,
    timeFactor,
} from "./constants.js"

const transformMatrix = {
    A: -0.004_998_667_793_638_28,
    B: -0.000_000_214_642_549_806_45,
    C: 4096.886_351_518_97,
    D: 4096.902_827_874_69,
}

const transformMatrixInv = {
    A: -200.053_302_087_577,
    B: -0.008_590_278_976_360_11,
    C: 819_630.836_437_126,
    D: -819_563.745_651_571,
}

// F11 coord to svg coord
export const convertCoordX = (x: number, y: number): number =>
    transformMatrix.A * x + transformMatrix.B * y + transformMatrix.C

// F11 coord to svg coord
export const convertCoordY = (x: number, y: number): number =>
    transformMatrix.B * x - transformMatrix.A * y + transformMatrix.D

// svg coord to F11 coord
export const convertInvCoordX = (x: number, y: number): number =>
    transformMatrixInv.A * x + transformMatrixInv.B * y + transformMatrixInv.C

// svg coord to F11 coord
export const convertInvCoordY = (x: number, y: number): number =>
    transformMatrixInv.B * x - transformMatrixInv.A * y + transformMatrixInv.D

/**
 * Convert radians to correctionValueDegrees
 * (see {@link http://cwestblog.com/2012/11/12/javascript-degree-and-radian-conversion/})
 * @param   radians - Radians
 * @returns Degrees
 */
export const radiansToDegrees = (radians: number): number => (radians * degreesHalfCircle) / Math.PI

/**
 * Calculate the angle in correctionValueDegrees between two points
 * see {@link https://stackoverflow.com/questions/9970281/java-calculating-the-angle-between-two-points-in-degrees}
 * @param   centerPt - Center PointTuple
 * @param   targetPt - Target PointTuple
 * @returns Degrees between centerPt and targetPt
 */
export const rotationAngleInDegrees = (centerPt: PointTuple, targetPt: PointTuple): number => {
    let theta = Math.atan2(targetPt[1] - centerPt[1], targetPt[0] - centerPt[0])
    theta -= Math.PI / 2
    const degrees = radiansToDegrees(theta)
    return (degrees + degreesFullCircle) % degreesFullCircle
}

/**
 * Calculate the angle in correctionValueDegrees between two points
 * @see https://stackoverflow.com/questions/9970281/java-calculating-the-angle-between-two-points-in-degrees
 */
export const rotationAngleInRadians = (centerPt: PointTuple, targetPt: PointTuple): number =>
    Math.atan2(centerPt[1], centerPt[0]) - Math.atan2(targetPt[1], targetPt[0])

/**
 * Calculate the distance between two points
 * see {@link https://www.mathsisfun.com/algebra/distance-2-points.html}
 * @param   centerPt - Center PointTuple
 * @param   targetPt - Target PointTuple
 * @returns Distance between centerPt and targetPt
 */
export const distancePoints = (centerPt: Coordinate, targetPt: Coordinate): number =>
    Math.hypot(centerPt.x - targetPt.x, centerPt.y - targetPt.y)

/**
 * Convert correctionValueDegrees to radians
 * @param   degrees - Degrees
 * @returns Radians
 */
export const degreesToRadians = (degrees: number): number =>
    (Math.PI / degreesHalfCircle) * (degrees - degreesQuarterCircle)

/**
 * Calculate the k distance between two svg coordinates
 */
export const getDistance = (pt0: Coordinate, pt1: Coordinate): number => {
    const fromF11 = {
        x: convertInvCoordX(pt0.x, pt0.y),
        y: convertInvCoordY(pt0.x, pt0.y),
    }
    const toF11 = {
        x: convertInvCoordX(pt1.x, pt1.y),
        y: convertInvCoordY(pt1.x, pt1.y),
    }

    return distancePoints(fromF11, toF11) / (timeFactor * speedFactor)
}

/**
 * Compass directions
 */
export const compassDirections = [
    "N",
    "N⅓NE",
    "N⅔NE",
    "NE",
    "E⅔NE",
    "E⅓NE",
    "E",
    "E⅓SE",
    "E⅔SE",
    "SE",
    "S⅔SE",
    "S⅓SE",
    "S",
    "S⅓SW",
    "S⅔SW",
    "SW",
    "W⅔SW",
    "W⅓SW",
    "W",
    "W⅓NW",
    "W⅔NW",
    "NW",
    "N⅔NW",
    "N⅓NW",
]

/**
 * Converts compass direction to correctionValueDegrees
 * @param   compass - Compass direction
 * @returns Degrees
 */
export const compassToDegrees = (compass: string): number => {
    const degree = degreesFullCircle / compassDirections.length
    return compassDirections.indexOf(compass) * degree
}

/**
 * Convert correctionValueDegrees to compass direction
 * (see {@link https://stackoverflow.com/questions/7490660/converting-wind-direction-in-angles-to-text-words})
 * @param   degrees - Degrees
 * @returns Compass direction
 */
export const degreesToCompass = (degrees: number): string => {
    const ticks = degreesFullCircle / compassDirections.length
    // noinspection MagicNumberJS
    const value = Math.floor(degrees / ticks + 0.5)
    return compassDirections[value % compassDirections.length]
}

/**
 * Test if Number is between two unordered Numbers
 * (see {@link https://stackoverflow.com/questions/14718561/how-to-check-if-a-number-is-between-two-values})
 * @param   value - Value to be tested
 * @param   a - Upper/lower bound
 * @param   b - Upper/lower bound
 * @param   inclusive - True if bounds are inclusive
 * @returns True if value is between a and b
 */
export const between = (value: number, a: number, b: number, inclusive: boolean): boolean => {
    const min = Math.min(a, b)
    const max = Math.max(a, b)

    return inclusive ? value >= min && value <= max : value > min && value < max
}

/**
 * Calculate the closest smaller integer power of 2
 * (see {@link https://stackoverflow.com/q/26965171})
 * @param   aSize - Input
 * @returns Closest power of 2 of aSize
 */
export const nearestPow2 = (aSize: number): number => 2 ** Math.floor(Math.log(aSize) / Math.log(2))

/**
 * Adjust for openlayers (top left is not [0,0] but [0,mapSize])
 */
export const coordinateAdjust = (x: number | PointTuple | PointTuple[], y?: number): PointTuple | PointTuple[] => {
    if (Array.isArray(x)) {
        return Array.isArray(x[0])
            ? (x as PointTuple[]).map((element: PointTuple) => [element[0], mapSize - element[1]] as PointTuple)
            : [(x as PointTuple)[0], mapSize - (x as PointTuple)[1]]
    }

    if (y != undefined) {
        return [x, mapSize - y]
    }

    throw new Error(`Wrong parameters x: ${x}, y: ${y}`)
}
