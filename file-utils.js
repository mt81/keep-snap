const { readFileSync, readdirSync, statSync, createReadStream } = require("fs");
const { join } = require("path");
const { outputFileSync } = require("fs-extra");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");
const uuid = require("uuid/v4");
const tempDirectory = require('temp-dir');

module.exports.swap = diff => {
  const { testSnap, refSnap } = diff;
  outputFileSync(refSnap, readFileSync(testSnap));
};

module.exports.createDiffFiles = args => {
  let allImages = findSnapshotComparisons(args).flatMap(comparison => {
    return comparison.testSnaps.map(imageName => {
      const id = uuid();
      const testSnap = join(comparison.testDir, imageName);
      const refSnap = join(comparison.referenceDir, imageName);
      const diffSnap = `${tempDirectory}/diffs/diff-${id}-${imageName}`
 
      console.log("creating diff image in: " + diffSnap);
      return { id, imageName, testSnap, refSnap, diffSnap};
    });
  });

  return allImages;
};

module.exports.diffImage = diff => {
  const { testSnap, refSnap, diffSnap} = diff;

  const img1 = PNG.sync.read(readFileSync(refSnap));
  const img2 = PNG.sync.read(readFileSync(testSnap));
  const { width, height } = img1;

  const diffImg = new PNG({ width, height });

  pixelmatch(img1.data, img2.data, diffImg.data, width, height, {
    threshold: 0.1,
    alpha: 1
  });

  outputFileSync(diffSnap, PNG.sync.write(diffImg));
};

const findSnapshotComparisons = options => {
  return listDirs(options.failedSnapshotDir)
    .map(dir => {
      const testDir = join(options.failedSnapshotDir, dir);
      const referenceDir = findDir(dir, options.referenceSearchPath);
      if (referenceDir) {
        const testSnaps = listFiles(testDir).filter(file =>
          file.match(/.+\.png$/)
        );

        return { testSnaps, referenceDir, testDir };
      }
      return undefined;
    })
    .filter(e => !!e);
};

module.exports.findSnapshotComparisons = findSnapshotComparisons;

const listDirs = path => {
  try {
    return readdirSync(path).filter(f => statSync(join(path, f)).isDirectory());
  } catch (e) {
    return [];
  }
};

const listFiles = path => {
  try {
    return readdirSync(path).filter(f => statSync(join(path, f)).isFile());
  } catch (e) {
    return [];
  }
};

const findDir = (dirToFind, startingPath) => {
  console.log(`Looking for ${dirToFind} in ${startingPath}`);
  let children = listDirs(startingPath);
  let found = children.find(dir => dir == dirToFind);
  if (found) {
    return join(startingPath, found);
  }

  for (child in children) {
    let found = findDir(dirToFind, join(startingPath, children[child]));
    if (found) {
      return found;
    }
  }

  return null;
};
