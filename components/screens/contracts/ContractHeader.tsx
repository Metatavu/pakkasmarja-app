import React from "react";
import { ItemGroup } from "pakkasmarja-client";
import { Text } from "native-base";
import { View } from "react-native";
import { styles } from "./styles";

/**
 * Interface for component props
 */
interface Props {
  itemGroup: ItemGroup
  styles ?:any
};

/**
 * Interface for component state
 */
interface State {
};

/**
 * Contract header component class
 */
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
      <View style={{marginBottom: 10}}>
        <Text style={styles.contractHeaderTitle}>
          { this.props.itemGroup.displayName}
        </Text>
        <View style={styles.BlueContentView}>
          <Text style={styles.contentText}>
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