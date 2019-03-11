import React from "react";
import { ItemGroup } from "../../../types";
import { Text } from "native-base";
import { View } from "react-native";

/**
 * Interface for component props
 */
export interface Props {
  itemGroup: ItemGroup
};

/**
 * Interface for component state
 */
interface State {
};

export default class ContractHeader extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  /**
   * Render method for contract header component
   */
  public render() {
    return (
      <View style={{marginBottom: 10, marginTop: 10}}>
        <Text style={{fontWeight: "bold", fontSize: 25,color:"red", textAlign:"center"}}>
          {this.props.itemGroup.displayName}
        </Text>
        <View style={{backgroundColor:"lightblue"}}>
          <Text style={{fontWeight:"bold", marginLeft:10, marginRight:10}}>
            {this.props.itemGroup.category === "FROZEN" ? 
              `Pakkasmarja Oy:n ja viljelijän sopimus pakastukseen toimitettavista marjoista ja niiden hinnoista satokaudella ${new Date().getFullYear()}`
              :
              "Pakkasmarja Oy:n ja viljelijän sopimus tuoremarjakauppaan toimitettavista marjoista."
            }
          </Text>
       </View>
      </View>
    );
  }
}