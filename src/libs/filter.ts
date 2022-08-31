// ProtobufMessageFilter packageName.serviceName.messageName
import protobuf, {Namespace, ReflectionObject, Service, Type} from "protobufjs";

export type ProtobufMessageFilter = RegExp[];

export interface ProtobufMessage {
    data: ReflectionObject,
    packageName: string;
    serviceName: string;
    messageName: string;
}

export function getProtobufFiltersFromOptions(includes?: string | undefined, excludes?: string | undefined):
    [ProtobufMessageFilter | undefined, ProtobufMessageFilter | undefined] {

    return [
        includes === undefined || includes.length === 0 ? undefined :
            includes.split(',').map(regExpStr => new RegExp(getRegExpString(regExpStr.trim()))),
        excludes === undefined || excludes.length === 0 ? undefined :
            excludes.split(',').map(regExpStr => new RegExp(getRegExpString(regExpStr.trim()))),
    ];
}

export function filterProtobuf(namespace: string, includeFilters: ProtobufMessageFilter | undefined,
                               excludeFilters: ProtobufMessageFilter | undefined): boolean {

    // Process for exclude filters first
    if (excludeFilters !== undefined) {
        if (matchFilters(namespace, excludeFilters)) {
            return true;
        }
    }

    // Process for include filters
    if (includeFilters !== undefined) {
        if (!matchFilters(namespace, includeFilters)) {
            return true;
        }
    }

    // Namespace has been not filtered, we pick it!
    return false;
}

// Filter the protobuf definitions
export function filterProtobufDefinitions(
    pbDefinitions: protobuf.Root[],
    includeFilters: ProtobufMessageFilter | undefined,
    excludeFilters: ProtobufMessageFilter | undefined,
): [Map<string, ProtobufMessage[]>, Map<string, ProtobufMessage[]>, Map<string, ProtobufMessage[]>] {

    let retMessageMaps = new Map<string, ProtobufMessage[]>();
    let retServiceMaps = new Map<string, ProtobufMessage[]>();
    let retMethodMaps = new Map<string, ProtobufMessage[]>();
    let repeatedSet = new Set<string>();
    for (let pbDefinition of pbDefinitions) {
        if (pbDefinition instanceof Namespace) {
            handleNamespace(pbDefinition.name, pbDefinition as Namespace,
                includeFilters, excludeFilters, retMessageMaps, retServiceMaps, retMethodMaps, repeatedSet);
        }
    }

    return [retMessageMaps, retServiceMaps, retMethodMaps];
}

function handleNamespace(namespace: string, pbDefinition: Namespace,
                         includeFilters: ProtobufMessageFilter | undefined,
                         excludeFilters: ProtobufMessageFilter | undefined,
                         retMessageMaps: Map<string, ProtobufMessage[]>,
                         retServiceMaps: Map<string, ProtobufMessage[]>,
                         retMethodMaps: Map<string, ProtobufMessage[]>,
                         repeatedSet: Set<string>) {

    for (let i = 0; i < pbDefinition.nestedArray.length; i++) {
        let item = pbDefinition.nestedArray[i];

        if (item instanceof Type) {
            pushItem(namespace, "", "Type", item, includeFilters, excludeFilters, retMessageMaps, repeatedSet);
        } else if (item instanceof Service) {
            pushItem(namespace, item.name, "Service", item, includeFilters, excludeFilters, retServiceMaps, repeatedSet);
            for (let method of item.methodsArray) {
                pushItem(namespace, item.name, "Method", method, includeFilters, excludeFilters, retMethodMaps, repeatedSet);
            }
        } else if (item instanceof Namespace) {
            handleNamespace(namespace === "" ? item.name : namespace + "." + item.name, item,
                includeFilters, excludeFilters, retMessageMaps, retServiceMaps, retMethodMaps, repeatedSet);
        }
    }

    return retMessageMaps;
}

function pushItem(namespace: string, serviceName: string, itemType: string, item: ReflectionObject,
                  includeFilters: ProtobufMessageFilter | undefined,
                  excludeFilters: ProtobufMessageFilter | undefined,
                  retMap: Map<string, ProtobufMessage[]>,
                  repeatedSet: Set<string>) {

    if (namespace !== "" && filterProtobuf(namespace + `.${item.name}`, includeFilters, excludeFilters)) {
        return;
    }

    let repeatStr = generateRepeatStr(namespace, serviceName, itemType, item.name);
    if (repeatedSet.has(repeatStr)) { // duplicate
        return;
    } else {
        repeatedSet.add(repeatStr);
    }

    if (retMap.has(namespace)) {
        retMap.get(namespace)!.push({
            data: item,
            packageName: namespace,
            serviceName: serviceName,
            messageName: item.name
        });
    } else {
        retMap.set(namespace, [{data: item, packageName: namespace, serviceName: serviceName, messageName: item.name}]);
    }
}

function generateRepeatStr(namespace: string, serviceName: string, itemType: string, itemName: string): string {
    return `${itemType}-${namespace}.${serviceName}.${itemName}`;
}

function getRegExpString(regExpStr: string): string {
    // Using prefix match for filters
    regExpStr = regExpStr.replace('\.', "\\.");
    return `^${regExpStr}`;
}

function matchFilters(namespace: string, filters: ProtobufMessageFilter): boolean {

    return filters.some((filter) => filter.test(namespace));
}
