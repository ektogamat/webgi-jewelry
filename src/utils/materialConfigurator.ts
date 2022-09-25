import { MaterialConfiguratorBasePlugin } from "webgi"

export class CustomMaterialConfiguratorPlugin extends MaterialConfiguratorBasePlugin{  
  
    // This must be set to exactly this.
    public static PluginType = 'MaterialConfiguratorPlugin'  
    
    // this function is automatically called when an object is loaded with some material variations  
    protected async _refreshUi(): Promise<boolean> {  
    if (!await super._refreshUi()) return false // check if any data is changed.  
    
    return true  
    }  

    // Function to change material of the object by the name of the variation
    setMaterial(name: string): void {  
        for (const variation of this.variations) {  
            variation.materials.map(material => {  
                if(material.name === name)
                    this.applyVariation(variation, material.uuid)
            })
        }
    }  
}