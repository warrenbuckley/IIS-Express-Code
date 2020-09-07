// Returns a random integer between min (included) and max (included)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomIntInclusive(min:number, max:number):number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}