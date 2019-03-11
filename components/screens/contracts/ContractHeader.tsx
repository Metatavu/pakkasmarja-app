import React from "react";
import { ItemGroup } from "../../../types";
import { Text } from "native-base";
import { View, StyleSheet } from "react-native";

/**
 * Interface for component props
 */
export interface Props {
  itemGroup: ItemGroup
  styles ?:any
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
    const styles = StyleSheet.create({
      ContractHeaderTitle: {
        fontFamily: "Sans Serif",
        padding:15,
        fontWeight:"bold",
        color: "#e01e36",
        fontSize: 24,
      },
      ContentView:{
        padding: 15,
        backgroundColor: "#dae7fa",
        paddingTop: 35,
        paddingBottom: 20,
        marginBottom: 15
      },
      ContentText:{
        fontSize: 18,
        lineHeight: 25,
        fontWeight:"bold"
      }
    });
    return (
      <View style={{marginBottom: 10}}>
        <Text style={styles.ContractHeaderTitle}>
          { this.props.itemGroup.displayName}
        </Text>
        <View style={this.props.styles.BlueContentView}>
          <Text style={styles.ContentText}>
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