import { existsSync } from 'fs';
import path from 'path';
import protobuf from 'protobufjs';

/**
 * parse the import paths from the import string
 */
export function getImportPaths(importString: string = '') {
  return (importString?.split(',') || [])
    .map(importPath => protobuf.util.path.normalize(path.posix.join(process.cwd(), importPath)));
};

/**
 * override the resolvePath function of protobufjs.Root
 * include the import paths to resolve the proto file
 */
export function getResolveProtoPathsFunction(imports: string[] = []) {
  return (origin: string, target: string) => {
    var normOrigin = protobuf.util.path.normalize(origin),
      normTarget = protobuf.util.path.normalize(target);

    var resolved = protobuf.util.path.resolve(normOrigin, normTarget, true);
    var idx = resolved.lastIndexOf("google/protobuf/");
    if (idx > -1) {
      var altname = resolved.substring(idx);
      if (altname in protobuf.common)
        resolved = altname;
    }

    if (existsSync(resolved))
      return resolved;

    for (var i = 0; i < imports.length; ++i) {
      var iresolved = protobuf.util.path.resolve(imports[i] + "/", target);

      if (existsSync(iresolved))
        return iresolved;
    }

    return resolved;
  };
}
