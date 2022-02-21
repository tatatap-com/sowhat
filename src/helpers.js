export const casePermutations = (input) => {
  // From https://stackoverflow.com/questions/27992204/find-all-lowercase-and-uppercase-combinations-of-a-string-in-javascript
  const letters = input.split("");
  const permCount = 1 << input.length;
  const perms = []
  for (let perm = 0; perm < permCount; perm++) {
    // Update the capitalization depending on the current permutation
    letters.reduce((perm, letter, i) => {
      letters[i] = (perm & 1) ? letter.toUpperCase() : letter.toLowerCase();
      return perm >> 1;
    }, perm);

    const result = letters.join("");
    perms.push(result)
  }

  return perms;
}

export default {casePermutations}
