import React from "react";
import { Text } from "native-base";
import { View, StyleSheet, TouchableOpacity } from "react-native";

/**
 * Interface for component props
 */
interface Props {
  isActiveContract: boolean,
  goBack: () => void,
  acceptContract: () => void,
  declineContract: () => void,
  downloadContractPdf: () => void,
  approveButtonText: string,
  styles?: any
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
    const styles = StyleSheet.create({
      smallRedButton: {
        width: "45%",
        height: 50,
        backgroundColor: "#e01e36",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20
      },
      smallWhiteButton: {
        width: "45%",
        height: 50,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        borderColor: "red",
        borderWidth: 2
      },
      flexView: {
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        flexDirection: 'row',
      },
      smallWhiteButtonText: {
        color: "#e01e36",
        fontSize: 22,
        fontWeight: "500"
      }
    });
    return (
      <View style={this.props.styles.WhiteContentView}>
        {
          this.props.isActiveContract &&
          <View>
            <TouchableOpacity style={{ marginBottom: 25 }} onPress={this.props.downloadContractPdf}>
              <Text style={this.props.styles.linkStyle}>
                Lataa sopimus PDF - muodossa.
                </Text>
            </TouchableOpacity>
          </View>
        }
        <View style={styles.flexView}>
          <TouchableOpacity style={[styles.smallRedButton, { marginRight: "5%" }]} onPress={this.props.goBack}>
            <Text style={this.props.styles.buttonText}>
              TAKAISIN
              </Text>
          </TouchableOpacity>
        {
          !this.props.isActiveContract && 
          <View>
            <TouchableOpacity style={[styles.smallWhiteButton, { marginLeft: "5%" }]} onPress={this.props.declineContract}>
              <Text style={styles.smallWhiteButtonText}>
                EN HYVÄKSY
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={this.props.styles.bigRedButton} onPress={this.props.acceptContract}>
              <Text style={this.props.styles.buttonText}>
                {this.props.approveButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        }
        </View>
      </View>
    );
  }
}