import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

export function getValue<T>(dataView: DataView, objectName: string, propertyName: string, defaultValue: T): T {
    if (dataView &&
        dataView.metadata &&
        dataView.metadata.objects) {
        
        const objects = dataView.metadata.objects;
        const object = objects[objectName];
        
        if (object) {
            const property = object[propertyName];
            if (property !== undefined) {
                return property as T;
            }
        }
    }
    
    return defaultValue;
}
