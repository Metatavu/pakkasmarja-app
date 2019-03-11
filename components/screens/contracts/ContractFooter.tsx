import React from "react";
import { Contact } from "pakkasmarja-client";
import { Text } from "native-base";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";

/**
 * Interface for component props
 */
export interface Props {
  isActiveContract: boolean,
  goBack: () => void,
  acceptContract: () => void,
  declineContract: () => void,
  downloadContractPdf: () => void,
  styles?:any
};

/**
 * Interface for component state
 */
interface State {
};

export default class ContractFooter extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  /**
   * Render method for contract parties component
   */
  public render() {
    return (
      <View style={this.props.styles.WhiteContentView}>
        {
          this.props.isActiveContract && 
            <View>
              <TouchableOpacity onPress={this.props.downloadContractPdf}>
                <Text style={{ backgroundColor: "red"}}>
                  Lataa sopimus PDF - muodossa.
                </Text>
              </TouchableOpacity>
            </View>
        }
        <View>
          <TouchableOpacity onPress={this.props.goBack}>
              <Text style={{ backgroundColor: "red"}}>
                Takaisin
              </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.props.declineContract}>
              <Text style={{ backgroundColor: "red"}}>
                En hyväksy
              </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.props.acceptContract}>
              <Text style={{ backgroundColor: "red"}}>
                Hyväksyn
              </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}